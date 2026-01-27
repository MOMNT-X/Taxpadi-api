import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';

export class PromptDto {
  message: string;
}

export class PromptResponseDto {
  response: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('prompt')
  @HttpCode(HttpStatus.OK)
  async sendPrompt(@Body() promptDto: PromptDto): Promise<PromptResponseDto> {
    return await this.aiService.sendPromptToWebhook(promptDto.message);
  }
}
