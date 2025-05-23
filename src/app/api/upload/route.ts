import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient, BlockBlobUploadOptions } from '@azure/storage-blob';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

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

    const formData = await request.formData();
    console.log("Form data received"); // Removed formData content from log for brevity

    const file = formData.get('file') as File | null;
    const filePath = formData.get('filePath') as string | null; // e.g., "initiatives/banners"

    if (!file) {
      console.error("No file found in form data.");
      return NextResponse.json({ error: "No file found" }, { status: 400 });
    }

    console.log(`File details: Name: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
    console.log(`Target file path prefix: ${filePath}`);

    if (!file.type.startsWith('image/')) {
      console.error(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        { success: false, message: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File size exceeds limit: ${file.size}`);
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
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

    return NextResponse.json({ imageUrl: blockBlobClient.url, message: "File uploaded successfully" }, { status: 200 });

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