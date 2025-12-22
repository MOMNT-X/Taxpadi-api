export class AiQueryDto {
  prompt: string;
  context: Array<{
    role: string;
    content: string;
  }>;
  conversationId: string;
}

