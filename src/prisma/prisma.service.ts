import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * PrismaService
 * For Prisma v7+ the datasource URLs are provided via `prisma.config.ts` for tooling.
 * For runtime, pass a direct connection URL (or accelerateUrl/adapter) to the PrismaClient constructor.
 * We pass the `DIRECT_URL` (if present) to the client here. Use `PRISMA_ACCELERATE_URL` if using Prisma Accelerate.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Provide runtime datasource override to PrismaClient. Cast to `any` to avoid strict typing
    // issues with the constructor signature across Prisma versions.
    const directUrl =
      process.env.DIRECT_URL || process.env.DATABASE_URL || undefined;
    
    super(
      (directUrl
        ? { 
            datasources: { 
              db: { 
                url: directUrl 
              } 
            },
            log: [
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          }
        : {
            log: [
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          }) as any
    );
  }

  async onModuleInit() {
    this.logger.log('Attempting to connect to database...');
    try {
      await this.$connect();
      this.logger.log('✓ Database connection established');
    } catch (error) {
      this.logger.error('✗ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

