import { PrismaClient, MessageRole } from '@prisma/client';

const prisma = new PrismaClient();

async function debugMessages() {
  console.log('🔍 Fetching the most recent assistant message...\n');
  
  const latestMessage = await prisma.message.findFirst({
    where: {
      role: MessageRole.ASSISTANT,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!latestMessage) {
    console.log('❌ No assistant messages found');
    return;
  }

  console.log('📝 Latest Assistant Message:');
  console.log('ID:', latestMessage.id);
  console.log('Created:', latestMessage.createdAt);
  console.log('\n📄 Content (first 200 chars):');
  console.log(latestMessage.content.substring(0, 200));
  console.log('\n📄 Content type:', typeof latestMessage.content);
  console.log('📄 Content length:', latestMessage.content.length);
  console.log('\n🔍 First 10 characters (with escape sequences visible):');
  console.log(JSON.stringify(latestMessage.content.substring(0, 50)));
  
  console.log('\n🧪 Testing JSON.parse:');
  try {
    const parsed = JSON.parse(latestMessage.content);
    console.log('✅ JSON.parse succeeded!');
    console.log('Parsed object:', parsed);
    console.log('Has ai_response field?', 'ai_response' in parsed);
    if (parsed.ai_response) {
      console.log('\n✅ ai_response field (first 100 chars):');
      console.log(parsed.ai_response.substring(0, 100));
    }
  } catch (e) {
    console.log('❌ JSON.parse failed:', (e as Error).message);
    console.log('\n🔍 Raw content:');
    console.log(latestMessage.content);
  }
}

debugMessages()
  .catch((e) => {
    console.error('❌ Debug failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
