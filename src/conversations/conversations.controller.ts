import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { MessagesService } from '../messages/messages.service';
import { AiService } from '../ai/ai.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
    private aiService: AiService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationsService.create(user.id, createConversationDto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.conversationsService.findAll(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.findOne(id, user.id);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    // Verify conversation ownership
    const conversation = await this.conversationsService.findOne(
      conversationId,
      user.id,
    );

    // Save user message
    const userMessage = await this.messagesService.create(
      conversationId,
      'USER',
      createMessageDto.content,
    );

    // Get conversation context
    const context = await this.messagesService.findByConversation(
      conversationId,
    );

    // Call AI service
    const aiResponse = await this.aiService.queryMakeWebhook({
      prompt: createMessageDto.content,
      context: context.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      conversationId,
    });

    // Save AI response
    const assistantMessage = await this.messagesService.create(
      conversationId,
      'ASSISTANT',
      aiResponse.response,
    );

    return {
      userMessage,
      assistantMessage,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.conversationsService.remove(id, user.id);
  }
}

