import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AiQueryDto } from './dto/ai-query.dto';
import { AiResponseDto } from './dto/ai-response.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly webhookUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('ai.makeWebhookUrl');
    this.timeout = this.configService.get<number>('ai.timeout') || 30000;
    this.retryAttempts = this.configService.get<number>('ai.retryAttempts') || 3;

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async queryMakeWebhook(query: AiQueryDto): Promise<AiResponseDto> {
    const payload = {
      prompt: query.prompt,
      context: query.context,
      conversationId: query.conversationId,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.logger.log(
          `Attempting Make.com webhook call (attempt ${attempt}/${this.retryAttempts})`,
        );

        const response = await this.axiosInstance.post(
          this.webhookUrl,
          payload,
        );

        // Handle response - adjust based on Make.com webhook response format
        const responseData = response.data;

        // If Make.com returns the response directly
        if (typeof responseData === 'string') {
          return { response: responseData };
        }

        // If Make.com returns an object with a response field
        if (responseData.response) {
          return { response: responseData.response };
        }

        // If Make.com returns an object with a message field
        if (responseData.message) {
          return { response: responseData.message };
        }

        // Default: stringify the entire response
        return {
          response: JSON.stringify(responseData),
        };
      } catch (error: any) {
        lastError = error;

        if (error.code === 'ECONNABORTED') {
          this.logger.warn(
            `Webhook timeout on attempt ${attempt}/${this.retryAttempts}`,
          );
        } else if (error.response) {
          this.logger.error(
            `Webhook error response: ${error.response.status} - ${error.response.statusText}`,
          );
        } else {
          this.logger.error(
            `Webhook error on attempt ${attempt}/${this.retryAttempts}: ${error.message}`,
          );
        }

        // If this is not the last attempt, wait before retrying (exponential backoff)
        if (attempt < this.retryAttempts) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
          this.logger.log(`Retrying after ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retry attempts failed
    this.logger.error(
      `All ${this.retryAttempts} attempts to call Make.com webhook failed`,
    );
    throw new HttpException(
      'Failed to get AI response. Please try again later.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

