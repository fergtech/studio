// h:\Projects\il3\studio\test-azure-storage.js
require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

async function main() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

    console.log("--- Azure Storage Connection Test ---");

    if (!connectionString) {
        console.error("❌ Error: AZURE_STORAGE_CONNECTION_STRING is not set.");
        console.log("   Please ensure it's defined in your .env.local file or as an environment variable.");
        process.exit(1);
    }
    if (!containerName) {
        console.error("❌ Error: AZURE_STORAGE_CONTAINER_NAME is not set.");
        console.log("   Please ensure it's defined in your .env.local file or as an environment variable.");
        process.exit(1);
    }

    console.log(`🔵 AZURE_STORAGE_CONNECTION_STRING: Parsed (not displaying value for security)`);
    console.log(`🔵 AZURE_STORAGE_CONTAINER_NAME: ${containerName}`);
    console.log("\nAttempting to connect to Azure Blob Storage...");

    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        console.log("✅ Successfully created BlobServiceClient and ContainerClient.");

        // Test 1: Check if container exists
        console.log(`\nChecking if container '${containerName}' exists...`);
        try {
            const exists = await containerClient.exists();
            if (exists) {
                console.log(`✅ Container '${containerName}' exists.`);
            } else {
                // If the container is expected to exist, this is a problem.
                // If your policy is to create it if not exists, you could add:
                // console.warn(`⚠️ Container '${containerName}' does not exist. Attempting to create...`);
                // await containerClient.create({ access: 'container' }); // or 'blob' or undefined for private
                // console.log(`✅ Container '${containerName}' created successfully.`);
                // For this test, we'll assume it should exist.
                 console.error(`❌ Error: Container '${containerName}' does not exist. Please create it in the Azure portal or ensure the name is correct.`);
                 process.exit(1);
            }
        } catch (error) {
            console.error(`❌ Error checking/creating container '${containerName}':`, error.message);
            if (error.statusCode) console.error(`   Status Code: ${error.statusCode}`);
            if (error.details) console.error(`   Details: ${JSON.stringify(error.details)}`);
            process.exit(1);
        }

        // Test 2: Attempt to upload a small blob
        const blobName = `test-upload-${uuidv4()}.txt`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const content = `Hello Azure! Test upload on ${new Date().toISOString()}`;
        
        console.log(`\nAttempting to upload blob '${blobName}' to container '${containerName}'...`);
        
        const uploadBlobResponse = await blockBlobClient.upload(content, Buffer.byteLength(content), {
            blobHTTPHeaders: { blobContentType: "text/plain" }
        });
        
        console.log(`✅ Upload successful!`);
        console.log(`   Blob URL: ${blockBlobClient.url}`);
        console.log(`   Azure Response Status: ${uploadBlobResponse._response.status}`);

        // Test 3: Attempt to delete the blob (cleanup)
        console.log(`\nAttempting to delete blob '${blobName}'...`);
        await blockBlobClient.delete();
        console.log(`✅ Blob '${blobName}' deleted successfully.`);

        console.log("\n🎉 Azure Storage connection and basic operations (upload, delete) test PASSED.");

    } catch (error) {
        console.error("\n❌ Azure Storage test FAILED.");
        console.error("Error details:");
        console.error(`   Name: ${error.name}`);
        console.error(`   Message: ${error.message}`);
        if (error.statusCode) { // Azure SDK specific
            console.error(`   Status Code: ${error.statusCode}`);
        }
        if (error.code) { // General error code
            console.error(`   Error Code: ${error.code}`);
        }
        if (error.details && error.details.errorCode) { // Azure Storage specific error code
             console.error(`   Azure Error Code: ${error.details.errorCode}`);
        }
        if (error.details) { // Full Azure SDK specific details
            console.error(`   Raw Details: ${JSON.stringify(error.details, null, 2)}`);
        }
        console.error("   Stack (partial):", error.stack?.split('\\n').slice(0, 5).join('\\n'));
        process.exit(1);
    }
}

main();