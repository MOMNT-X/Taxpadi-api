import { Module } from '@nestjs/common';
import { TaxCalculatorService } from './tax-calculator.service';
import { TaxCalculatorController } from './tax-calculator.controller';

@Module({
  controllers: [TaxCalculatorController],
  providers: [TaxCalculatorService],
  exports: [TaxCalculatorService],
})
export class TaxCalculatorModule {}

