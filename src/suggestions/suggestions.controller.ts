import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  @Get()
  async getSuggestions() {
    // For now, return hardcoded suggestions
    // In the future, this could be dynamic based on user history, trending topics, etc.
    return {
      suggestions: [
        {
          title: 'Explain the new tax reform',
          category: 'education',
        },
        {
          title: 'Generate a tax report',
          category: 'reports',
        },
        {
          title: 'Generate a tax summary',
          category: 'reports',
        },
        {
          title: 'Calculate my monthly tax',
          category: 'calculator',
        },
        {
          title: 'Tax filing deadlines',
          category: 'information',
        },
      ],
    };
  }
}
