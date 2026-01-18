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
    const aiResponse = await this.aiService.sendPromptToWebhook(
      createMessageDto.content,
    );

    // Extract ai_response from the webhook response
    const extractedResponse = this.extractAiResponse(aiResponse.response);

    // Save AI response (now contains extracted plain text)
    const assistantMessage = await this.messagesService.create(
      conversationId,
      'ASSISTANT',
      extractedResponse,
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.conversationsService.remove(id, user.id);
  }

  /**
   * Extracts the ai_response field from the webhook response JSON.
   * Tries multiple field names as fallbacks.
   */
  private extractAiResponse(responseString: string): string {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(responseString);

      // Try to extract ai_response field (primary format from Make.com webhook)
      if (parsed.ai_response && typeof parsed.ai_response === 'string') {
        this.logger.debug('Extracted ai_response field from webhook response');
        return parsed.ai_response;
      }

      // Fallback: try response field
      if (parsed.response && typeof parsed.response === 'string') {
        this.logger.debug('Extracted response field from webhook response');
        return parsed.response;
      }

      // Fallback: try other common field names
      const commonFields = ['text', 'message', 'output', 'result', 'data'];
      for (const field of commonFields) {
        if (parsed[field] && typeof parsed[field] === 'string') {
          this.logger.debug(`Extracted ${field} field from webhook response`);
          return parsed[field];
        }
      }

      // If no recognized field found, log warning and stringify object
      this.logger.warn(
        'Could not extract ai_response from webhook response, returning stringified object',
      );
      return JSON.stringify(parsed);
    } catch (error) {
      // If not JSON, return as-is (could be plain text response)
      this.logger.debug('Response is plain text, returning as-is');
      return responseString;
    }
  }
}


