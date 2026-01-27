import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageResponseDto } from './dto/message-response.dto';
import { MessageRole } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(
    conversationId: string,
    role: MessageRole,
    content: string,
  ): Promise<MessageResponseDto> {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return this.mapToResponseDto(message);
  }

  async createAssistantMessage(
    conversationId: string,
    content: string,
  ): Promise<MessageResponseDto> {
    return this.create(conversationId, MessageRole.ASSISTANT, content);
  }

  async findByConversation(
    conversationId: string,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages.map((msg) => this.mapToResponseDto(msg));
  }

  private mapToResponseDto(message: any): MessageResponseDto {
    // Content is already extracted and plain text from the controller
    // No need for extraction logic here
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      createdAt: message.createdAt,
    };
  }
}


