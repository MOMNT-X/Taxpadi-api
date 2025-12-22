import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  makeWebhookUrl: process.env.MAKE_WEBHOOK_URL || 'https://hook.us2.make.com/b3knf77hvqztm22ki6t2ejgx441mlf64',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
}));

