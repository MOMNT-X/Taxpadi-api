import { IsString, IsOptional, IsArray } from 'class-validator';

export class AiQueryDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsArray()
  context?: Array<{ role: string; content: string }>;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[]; // Array of file URLs
}

