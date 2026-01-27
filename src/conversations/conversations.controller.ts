import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
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
  private readonly logger = new Logger(ConversationsController.name);

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
    // Verify conversation ownership and get current state
    const conversation = await this.conversationsService.findOne(
      conversationId,
      user.id,
    );

    // Check if this is the first message (only USER messages count)
    const existingMessages = await this.messagesService.findByConversation(
      conversationId,
    );
    const userMessageCount = existingMessages.filter((msg) => msg.role === 'USER').length;
    const isFirstMessage = userMessageCount === 0;

    // Save user message
    const userMessage = await this.messagesService.create(
      conversationId,
      'USER',
      createMessageDto.content,
    );

    // Call AI service with just the user's prompt message
    // The AI service already extracts the ai_response field from the webhook
    const aiResponse = await this.aiService.sendPromptToWebhook(
      createMessageDto.content,
    );

    // Save AI response (already contains extracted plain text from AI service)
    const assistantMessage = await this.messagesService.create(
      conversationId,
      'ASSISTANT',
      aiResponse.response,
    );

    // Update conversation title from first user message if it's still the default
    if (isFirstMessage && (conversation.title === 'New Conversation' || !conversation.title)) {
      // Generate title from first message (truncate to 50 chars)
      const title = createMessageDto.content.slice(0, 50).trim();
      if (title) {
        await this.conversationsService.updateTitle(conversationId, title);
      }
    }

    return {
      userMessage,
      assistantMessage,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateDto: { title: string },
  ) {
    // Verify ownership
    await this.conversationsService.findOne(id, user.id);
    
    // Update title
    await this.conversationsService.updateTitle(id, updateDto.title);
    
    return {
      message: 'Conversation updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.conversationsService.remove(id, user.id);
  }


}


