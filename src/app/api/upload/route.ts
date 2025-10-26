import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { uploadToR2, generateR2Key } from '@/lib/r2';

// Using Cloudflare R2 for file storage (much higher limits than Vercel Blob)
export const maxDuration = 60; // 60 seconds timeout
export const maxRequestBodySize = '50mb'; // R2 supports much larger files

export async function POST(request: NextRequest) {
  console.log("Upload API route hit - using Cloudflare R2");

  // Verify R2 configuration
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.error("Cloudflare R2 is not configured.");
    return NextResponse.json({ error: "Cloudflare R2 is not configured." }, { status: 500 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("User not authenticated for upload.");
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id; // Get userId from session

    const formData = await request.formData();
    console.log("Form data received"); // Removed formData content from log for brevity

    const file = formData.get('file') as File | null;
    const filePath = formData.get('filePath') as string | null; // e.g., "profile/images" or "initiatives/banners"
    const imageType = formData.get('imageType') as string | null; // e.g., "profile" or "banner"

    if (!file) {
      console.error("No file found in form data.");
      return NextResponse.json({ error: "No file found" }, { status: 400 });
    }

    console.log(`File details: Name: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
    console.log(`Target file path prefix: ${filePath}`);

    // Check for supported document types
    const documentTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain', // .txt
      'text/markdown', // .md
      'application/rtf', // .rtf
    ];

    const isDocument = documentTypes.includes(file.type) || 
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.md') ||
      file.name.toLowerCase().endsWith('.rtf');

    if (
      !file.type.startsWith('image/') &&
      !file.type.startsWith('video/') &&
      !file.type.startsWith('audio/') &&
      !isDocument
    ) {
      console.error(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        { success: false, message: 'Only image, video, audio, and document files (PDF, DOCX, TXT) are allowed' },
        { status: 400 }
      );
    }

    // R2 supports much larger files than Vercel Blob
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File size exceeds limit: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return NextResponse.json(
        {
          success: false,
          message: `File size must be less than 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please compress it before uploading.`
        },
        { status: 413 } // 413 = Payload Too Large
      );
    }

    // Prepare file for R2 upload
    const normalizedPath = filePath ? filePath.replace(/\\\\\\\\/g, '/').replace(/\/$/, '') : 'uploads';
    const r2Key = generateR2Key(normalizedPath, file.name);

    console.log(`Attempting to upload to R2: '${r2Key}'`);

    // Convert file to buffer for R2 upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudflare R2
    const imageUrl = await uploadToR2(fileBuffer, r2Key, file.type);

    console.log(`File uploaded successfully to R2: ${imageUrl}`);

    // --- BEGIN DATABASE UPDATE LOGIC ---
    let updatedUser;

    console.log(`Attempting to update database for user: ${userId} with imageType: ${imageType}`);

    try {
      if (imageType === 'profile') {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { image: imageUrl },
        });
        console.log("User profile image updated in database:", updatedUser);
      } else if (imageType === 'banner') {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { bannerImageUrl: imageUrl },
        });
        console.log("User banner image updated in database:", updatedUser);
      } else if (imageType === 'initiative') {
        // For initiatives, we just return the URL without updating any user fields
        // The initiative update will be handled separately by the initiative actions
        console.log(`Initiative image uploaded with URL: ${imageUrl}`);
        return NextResponse.json({ imageUrl: imageUrl, message: "Initiative image uploaded successfully." }, { status: 200 });
      } else {
        // If imageType is not specified or recognized, we might not update the DB
        // or handle it as a generic upload not tied to a specific user field.
        // For now, we'll assume it's one of the above or we don't update user record directly here.
        console.log(`Image uploaded with URL: ${imageUrl}, but no specific user field updated as imageType ('${imageType}') is not 'profile', 'banner', or 'initiative'.`);
        // Return just the URL if no specific user field is targeted by this upload
        return NextResponse.json({ imageUrl: imageUrl, message: "File uploaded successfully, no specific user field updated." }, { status: 200 });
      }

      return NextResponse.json({ 
        imageUrl: imageUrl, 
        message: "File uploaded and user profile updated successfully",
        user: updatedUser // Optionally return updated user data
      }, { status: 200 });

    } catch (dbError: any) {
      console.error("Error updating user profile in database:", dbError);
      // It's tricky: file is uploaded, but DB update failed.
      // You might want to implement a cleanup logic for the uploaded blob if DB fails.
      // For now, return an error indicating DB update failure.
      return NextResponse.json({ 
        error: "File uploaded but database update failed.", 
        imageUrl: imageUrl, // Still return the URL so client knows where it is
        dbError: dbError.message 
      }, { status: 500 });
    }
    // --- END DATABASE UPDATE LOGIC ---

  } catch (error: any) { 
    console.error("Error during file upload:", error);
    let errorMessage = "File upload failed due to an unexpected error.";
    let errorDetails: Record<string, any> = {}; // Ensure errorDetails is an object

    if (error && typeof error.name === 'string' && typeof error.message === 'string') { 
        errorMessage = error.message;
        errorDetails = { name: error.name, message: error.message, stack: error.stack, code: error.code };
        console.error(`Error Name: ${error.name}`);
        console.error(`Error Message: ${errorMessage}`);
        console.error(`Error Stack: ${error.stack}`);
        if (error.code) {
            console.error(`Error Code: ${error.code}`);
        }
        // Check for Azure SDK specific details
        if (error.details) { 
            console.error(`Error Details: ${JSON.stringify(error.details)}`);
            errorDetails.sdkDetails = error.details;
        }
    } else if (error && typeof error.toString === 'function') {
        errorMessage = error.toString();
        errorDetails = { message: errorMessage };
    } else {
        errorDetails = { message: "An unknown error structure was caught."};
    }
    
    return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return new Response("Upload endpoint is alive", { status: 200 });
}
