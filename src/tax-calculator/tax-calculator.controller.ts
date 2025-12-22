import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TaxCalculatorService } from './tax-calculator.service';
import { CalculateTaxDto } from './dto/calculate-tax.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tax-calculator')
@UseGuards(JwtAuthGuard)
export class TaxCalculatorController {
  constructor(private taxCalculatorService: TaxCalculatorService) {}

  @Post('calculate')
  async calculate(@Body() calculateTaxDto: CalculateTaxDto) {
    return this.taxCalculatorService.calculate(calculateTaxDto);
  }
}

