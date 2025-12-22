import { MessageResponseDto } from '../../messages/dto/message-response.dto';

export class ConversationResponseDto {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: MessageResponseDto[];
}

