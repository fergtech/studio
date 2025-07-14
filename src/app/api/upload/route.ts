import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient, BlockBlobUploadOptions } from '@azure/storage-blob';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma'; // Added prisma import
//import { HttpsProxyAgent } from "https-proxy-agent";
//import { StorageSharedKeyCredential } from "@azure/storage-blob";
//import { createPipelineFromOptions, Pipeline } from "@azure/core-rest-pipeline";
//import { DefaultHttpClient } from '@azure/core-http';

// Allow larger file uploads (up to 20MB)
export const maxRequestBodySize = '20mb';

export async function POST(request: NextRequest) {
  console.log("Upload API route hit");

  const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!AZURE_STORAGE_CONNECTION_STRING) {
    console.error("Azure Storage Connection String is not configured.");
    return NextResponse.json({ error: "Azure Storage Connection String is not configured." }, { status: 500 });
  }
  
  if (!AZURE_STORAGE_CONTAINER_NAME) {
    console.error("Azure Storage Container Name is not configured.");
    return NextResponse.json({ error: "Azure Storage Container Name is not configured." }, { status: 500 });
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

    if (
      !file.type.startsWith('image/') &&
      !file.type.startsWith('video/')
    ) {
      console.error(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        { success: false, message: 'Only image and video files are allowed' },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File size exceeds limit: ${file.size}`);
      return NextResponse.json(
        { success: false, message: 'File size must be less than 100MB' },
        { status: 400 }
      );
    }

    /*
     *
     * COMMENTING OUT THE PROBLEMATIC PROXY/PIPELINE CODE
     *
    const proxyUrl = process.env.FIXIE_URL;
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
    const pipeline = newPipeline(undefined, {
      httpClient: agent
        ? {
            sendRequest: (httpRequest: any) => {
              httpRequest.agent = agent;
              return new DefaultHttpClient().sendRequest(httpRequest);
            },
          }
        : undefined,
    });*/
    // ✅ ADDING THE CORRECT, SIMPLIFIED CLIENT INITIALIZATION
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
    // Optional: Ensure container exists. Usually, it's better to ensure it's created beforehand.
    // await containerClient.createIfNotExists();

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const uniqueFileName = `${Date.now()}-${uuidv4()}-${sanitizedFileName}`;
    
    // Construct blob name with path prefix if provided
    // Corrected regex for removing trailing slash: /\/$/
    const normalizedPath = filePath ? filePath.replace(/\\\\\\\\/g, '/').replace(/\/$/, '') : '';
    const blobName = normalizedPath ? `${normalizedPath}/${uniqueFileName}` : uniqueFileName;
    
    console.log(`Attempting to upload blob: '${blobName}' to container '${AZURE_STORAGE_CONTAINER_NAME}'`);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadOptions: BlockBlobUploadOptions = {
      blobHTTPHeaders: { blobContentType: file.type }
    };

    const uploadBlobResponse = await blockBlobClient.uploadData(buffer, uploadOptions);
    
    console.log(`File uploaded successfully. Azure response status: ${uploadBlobResponse._response.status}`);
    console.log(`Uploaded Blob URL: ${blockBlobClient.url}`);

    // --- BEGIN DATABASE UPDATE LOGIC ---
    const imageUrl = blockBlobClient.url;
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
      } else {
        // If imageType is not specified or recognized, we might not update the DB
        // or handle it as a generic upload not tied to a specific user field.
        // For now, we'll assume it's one of the above or we don't update user record directly here.
        console.log(`Image uploaded with URL: ${imageUrl}, but no specific user field updated as imageType ('${imageType}') is not 'profile' or 'banner'.`);
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
