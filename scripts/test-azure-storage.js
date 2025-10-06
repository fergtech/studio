// Test script for Azure Storage connection
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); // Adjust path if your .env.local is elsewhere

async function main() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!connectionString) {
    console.error('Error: AZURE_STORAGE_CONNECTION_STRING is not set in .env.local');
    process.exit(1);
  }
  if (!containerName) {
    console.error('Error: AZURE_STORAGE_CONTAINER_NAME is not set in .env.local');
    process.exit(1);
  }

  console.log('Attempting to connect to Azure Blob Storage...');
  console.log(`Container Name: ${containerName}`);

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    console.log('Successfully created BlobServiceClient and ContainerClient.');

    // 1. Test container existence (and create if not exists for this test)
    try {
      await containerClient.createIfNotExists();
      console.log(`Container "${containerName}" exists or was created.`);
    } catch (error) {
      console.error(`Error checking/creating container "${containerName}":`, error.message);
      if (error.statusCode === 403) {
        console.error('Authorization error (403): Check if the provided connection string has permissions to read/create containers.');
      }
      process.exit(1);
    }

    // 2. Test uploading a small blob
    const blobName = `test-upload-${uuidv4()}.txt`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const content = "Hello Azure Blob Storage from test script!";
    
    console.log(`Attempting to upload a test blob: ${blobName}`);
    try {
      await blockBlobClient.upload(content, content.length);
      console.log(`Successfully uploaded blob: ${blockBlobClient.url}`);
    } catch (error) {
      console.error('Error uploading blob:', error.message);
      if (error.statusCode === 403) {
        console.error('Authorization error (403): Check if the provided connection string has permissions to write blobs to this container.');
        console.error('Detailed Azure error:', error.details?.message || error.details || error);
      } else if (error.statusCode === 404 && error.code === 'ContainerNotFound') {
         console.error('ContainerNotFound (404): The container does not exist and creation might have failed or was not attempted.');
      } else {
        console.error('Detailed Azure error:', error.details || error);
      }
      process.exit(1);
    }

    // 3. Test listing blobs (optional, confirms read access)
    console.log('Attempting to list blobs in container (first 5)...');
    try {
      let i = 1;
      for await (const blob of containerClient.listBlobsFlat({ includeMetadata: true, includeSnapshots: false, includeVersions: false, prefix: "test-upload-" })) {
        console.log(`  Blob ${i++}: ${blob.name}, Created: ${blob.properties.createdOn}`);
        if (i > 5) break;
      }
      console.log('Successfully listed blobs (or found none matching prefix).');
    } catch (error) {
        console.error('Error listing blobs:', error.message);
        if (error.statusCode === 403) {
            console.error('Authorization error (403): Check if the provided connection string has permissions to list blobs in this container.');
        }
    }


    // 4. Test deleting the uploaded blob
    console.log(`Attempting to delete the test blob: ${blobName}`);
    try {
      await blockBlobClient.delete();
      console.log(`Successfully deleted blob: ${blobName}`);
    } catch (error) {
      console.error('Error deleting blob:', error.message);
       if (error.statusCode === 403) {
        console.error('Authorization error (403): Check if the provided connection string has permissions to delete blobs.');
      }
    }

    console.log('\nTest completed. If all steps were successful, your connection and basic permissions are fine.');
    console.log('If you saw 403 errors, re-check your connection string, SAS token validity/permissions, or Azure Storage firewall/network settings.');

  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
    console.error('Stack trace:', error.stack);
    if (error.code) {
        console.error('Error code:', error.code)
    }
     if (error.details) {
        console.error('Error details:', error.details);
    }
  }
}

main().catch(console.error);
