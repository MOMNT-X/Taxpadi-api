import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        title: createConversationDto.title || 'New Conversation',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return this.mapToResponseDto(conversation);
  }

  async updateTitle(conversationId: string, title: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  async findAll(userId: string): Promise<ConversationResponseDto[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 1, // Get only the first message for preview
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations.map((conv) => this.mapToResponseDto(conv));
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapToResponseDto(conversation);
  }

  async remove(id: string, userId: string): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.conversation.delete({
      where: { id },
    });
  }

  private mapToResponseDto(conversation: any): ConversationResponseDto {
    return {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages?.map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        createdAt: msg.createdAt,
      })),
    };
  }
}


