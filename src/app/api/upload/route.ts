import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { images } from '@/lib/db/schema';

// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING || ''
);
const containerClient = blobServiceClient.getContainerClient(
  process.env.AZURE_STORAGE_CONTAINER_NAME || 'initiative-images'
);

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const initiativeId = formData.get('initiativeId') as string;

    // Validate input
    if (!file || !initiativeId) {
      return NextResponse.json(
        { error: 'File and initiativeId are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${session.user.id}/${initiativeId}/${timestamp}-${file.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    // Upload the file to Azure Blob Storage
    const arrayBuffer = await file.arrayBuffer();
    await blockBlobClient.upload(arrayBuffer, arrayBuffer.byteLength, {
      blobHTTPHeaders: { blobContentType: file.type },
    });

    // Get the URL of the uploaded file
    const url = blockBlobClient.url;

    // Store image metadata in the database
    await db.insert(images).values({
      url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedBy: session.user.id,
      initiativeId,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 