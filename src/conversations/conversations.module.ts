import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, MessagesModule, AiModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}


