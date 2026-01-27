import { PrismaClient, MessageRole } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateMessages() {
  console.log('🔍 Finding messages with JSON content...');
  
  const messages = await prisma.message.findMany({
    where: {
      role: MessageRole.ASSISTANT,
    },
  });

  console.log(`📊 Found ${messages.length} assistant messages`);

  let updatedCount = 0;

  for (const message of messages) {
    const content = message.content.trim();
    
    // Check if content looks like JSON
    if (content.startsWith('{') || content.startsWith('[')) {
      try {
        const parsed = JSON.parse(content);
        
        // If it has ai_response field, extract it
        if (parsed.ai_response) {
          console.log(`✅ Updating message ${message.id} - extracting ai_response`);
          
          await prisma.message.update({
            where: { id: message.id },
            data: { content: parsed.ai_response },
          });
          
          updatedCount++;
        } else if (parsed.response) {
          console.log(`✅ Updating message ${message.id} - extracting response`);
          
          await prisma.message.update({
            where: { id: message.id },
            data: { content: parsed.response },
          });
          
          updatedCount++;
        }
      } catch (e) {
        // Not valid JSON, skip
        console.log(`⏭️  Skipping message ${message.id} - not valid JSON`);
      }
    }
  }

  console.log(`\n✅ Migration complete! Updated ${updatedCount} messages`);
}

migrateMessages()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
