import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[]; // Array of file URLs
}

