import { PrismaClient, ResourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillResourceMetadata() {
  console.log('Starting resource metadata backfill...');

  try {
    const updates = await prisma.update.findMany({
      include: { media: true },
    });

    let totalCreated = 0;
    let errors = 0;

    for (const update of updates) {
      try {
        const details = update.details as any;
        const resources = [];

        // Extract links
        if (details?.links?.length > 0) {
          details.links.forEach((link: any, index: number) => {
            resources.push({
              initiativeId: update.initiativeId,
              updateId: update.id,
              resourceType: ResourceType.LINK,
              title: link.title || link.url || 'Untitled Link',
              description: link.description || null,
              url: link.url,
              category: link.category || null,
              order: index,
              createdBy: update.userId,
              createdAt: update.createdAt,
            });
          });
        }

        // Extract documents
        if (details?.documents?.length > 0) {
          details.documents.forEach((doc: any, index: number) => {
            resources.push({
              initiativeId: update.initiativeId,
              updateId: update.id,
              resourceType: ResourceType.DOCUMENT,
              title: doc.title || doc.filename || 'Untitled Document',
              description: doc.description || null,
              url: doc.url,
              category: doc.category || null,
              order: index,
              createdBy: update.userId,
              createdAt: update.createdAt,
            });
          });
        }

        // Extract media (images, videos, audio)
        if (update.media?.length > 0) {
          update.media.forEach((media, index) => {
            resources.push({
              initiativeId: update.initiativeId,
              updateId: update.id,
              resourceType: ResourceType.MEDIA,
              title: `Media from update`,
              description: null,
              url: media.url,
              category: null,
              order: index,
              createdBy: update.userId,
              createdAt: update.createdAt,
            });
          });
        }

        if (resources.length > 0) {
          await prisma.resourceMetadata.createMany({
            data: resources,
            skipDuplicates: true,
          });
          totalCreated += resources.length;

          if (totalCreated % 100 === 0) {
            console.log(`Progress: ${totalCreated} resources created...`);
          }
        }
      } catch (error) {
        console.error(`Error processing update ${update.id}:`, error);
        errors++;
      }
    }

    console.log('\n✅ Backfill complete!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total updates processed: ${updates.length}`);
    console.log(`   - Resources created: ${totalCreated}`);
    console.log(`   - Errors: ${errors}`);
  } catch (error) {
    console.error('❌ Fatal error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillResourceMetadata()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
