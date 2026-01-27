import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { AiQueryDto } from "./dto/ai-query.dto";
import { AiResponseDto } from "./dto/ai-response.dto";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly webhookUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>("ai.makeWebhookUrl");
    this.timeout = this.configService.get<number>("ai.timeout") || 30000;
    this.retryAttempts =
      this.configService.get<number>("ai.retryAttempts") || 3;

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Extracts the ai_response from webhook response
   */
  private extractAiResponse(responseData: any): string {
    try {
      let parsed = responseData;

      // If responseData is a string, sanitize and parse it
      if (typeof responseData === "string") {
        // Remove control characters that break JSON.parse
        // This handles \r\n, \n, \r, and other control characters
        const sanitized = responseData
          .replace(/\r\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t');

        this.logger.debug(`Sanitized string for parsing`);
        parsed = JSON.parse(sanitized);
      }

      // Extract ai_response field
      if (parsed && typeof parsed === "object" && "ai_response" in parsed) {
        this.logger.debug(`Successfully extracted ai_response field`);
        // The ai_response may have escaped newlines, so unescape them
        const aiResponse = parsed.ai_response;
        return typeof aiResponse === "string" 
          ? aiResponse.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
          : String(aiResponse);
      }

      // If no ai_response field, return the whole response as string
      this.logger.warn(`No ai_response field found, returning raw response`);
      return typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    } catch (error) {
      this.logger.error(`Failed to extract ai_response: ${error.message}`);
      this.logger.debug(`Raw data that failed: ${typeof responseData === "string" ? responseData.substring(0, 200) : JSON.stringify(responseData).substring(0, 200)}`);
      
      // Last resort: try regex extraction
      if (typeof responseData === "string") {
        const match = responseData.match(/"ai_response"\s*:\s*"([^"]*)"/);
        if (match && match[1]) {
          this.logger.log(`Extracted ai_response using regex fallback`);
          return match[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        }
      }
      
      // Return raw data as final fallback
      return typeof responseData === "string"
        ? responseData
        : JSON.stringify(responseData);
    }
  }

  async queryMakeWebhook(query: AiQueryDto): Promise<AiResponseDto> {
    const payload = {
      prompt: query.prompt,
      context: query.context,
      conversationId: query.conversationId,
      attachments: query.attachments,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.logger.log(
          `Attempting Make.com webhook call (attempt ${attempt}/${this.retryAttempts})`
        );

        const response = await this.axiosInstance.post(
          this.webhookUrl,
          payload
        );

        const responseData = response.data;

        this.logger.debug(`Raw response data type: ${typeof responseData}`);
        this.logger.debug(
          `Raw response data: ${JSON.stringify(responseData).substring(0, 200)}`
        );

        // Extract ai_response from the webhook response
        const extractedResponse = this.extractAiResponse(responseData);

        this.logger.log(
          `Extracted AI response: ${extractedResponse.substring(0, 100)}...`
        );

        return { response: extractedResponse };
      } catch (error: any) {
        lastError = error;

        if (error.code === "ECONNABORTED") {
          this.logger.warn(
            `Webhook timeout on attempt ${attempt}/${this.retryAttempts}`
          );
        } else if (error.response) {
          this.logger.error(
            `Webhook error response: ${error.response.status} - ${error.response.statusText}`
          );
        } else {
          this.logger.error(
            `Webhook error on attempt ${attempt}/${this.retryAttempts}: ${error.message}`
          );
        }

        if (attempt < this.retryAttempts) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          this.logger.log(`Retrying after ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      `All ${this.retryAttempts} attempts to call Make.com webhook failed`
    );

    const fallbackErrorMessage =
      "Connection timed out. Please check your internet connection and try again later.";

    this.logger.log(
      `Returning fallback error message to user: ${fallbackErrorMessage}`
    );
    return { response: fallbackErrorMessage };
  }

  async sendPromptToWebhook(message: string): Promise<AiResponseDto> {
    const payload = {
      message,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.logger.log(
          `Attempting Make.com webhook call with prompt (attempt ${attempt}/${this.retryAttempts})`
        );

        const response = await this.axiosInstance.post(
          this.webhookUrl,
          payload
        );

        const responseData = response.data;

        this.logger.debug(`Raw response data type: ${typeof responseData}`);
        this.logger.debug(
          `Raw response data: ${JSON.stringify(responseData).substring(0, 200)}`
        );

        // Extract ai_response from the webhook response
        const extractedResponse = this.extractAiResponse(responseData);

        this.logger.log(
          `Extracted AI response: ${extractedResponse.substring(0, 100)}...`
        );

        return { response: extractedResponse };
      } catch (error: any) {
        lastError = error;

        if (error.code === "ECONNABORTED") {
          this.logger.warn(
            `Webhook timeout on attempt ${attempt}/${this.retryAttempts}`
          );
        } else if (error.response) {
          this.logger.error(
            `Webhook error response: ${error.response.status} - ${error.response.statusText}`
          );
        } else {
          this.logger.error(
            `Webhook error on attempt ${attempt}/${this.retryAttempts}: ${error.message}`
          );
        }

        if (attempt < this.retryAttempts) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          this.logger.log(`Retrying after ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      `All ${this.retryAttempts} attempts to call Make.com webhook failed`
    );

    const fallbackErrorMessage =
      "Connection timed out. Please check your internet connection and try again later.";

    this.logger.log(
      `Returning fallback error message to user: ${fallbackErrorMessage}`
    );
    return { response: fallbackErrorMessage };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}