import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

