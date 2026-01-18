import { Injectable } from '@nestjs/common';
import { CalculateTaxDto, TaxType } from './dto/calculate-tax.dto';
import { TaxResponseDto } from './dto/tax-response.dto';

@Injectable()
export class TaxCalculatorService {
  // VAT rate: 7.5% (standard rate in Nigeria)
  private readonly VAT_RATE = 0.075;

  // PAYE Tax Brackets (2025 rates - approximate)
  private readonly PAYE_BRACKETS = [
    { min: 0, max: 300000, rate: 0.07 }, // 7%
    { min: 300000, max: 600000, rate: 0.11 }, // 11%
    { min: 600000, max: 1100000, rate: 0.15 }, // 15%
    { min: 1100000, max: 1600000, rate: 0.19 }, // 19%
    { min: 1600000, max: 3200000, rate: 0.21 }, // 21%
    { min: 3200000, max: Infinity, rate: 0.24 }, // 24%
  ];

  // Company Income Tax rate: 30% for large companies
  private readonly CIT_RATE = 0.3;

  // Capital Gains Tax rate: 10%
  private readonly CGT_RATE = 0.1;

  calculateVAT(amount: number): TaxResponseDto {
    const taxAmount = amount * this.VAT_RATE;
    const netAmount = amount - taxAmount;

    return {
      taxType: TaxType.VAT,
      taxableAmount: amount,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      rate: this.VAT_RATE * 100,
      breakdown: {
        grossAmount: amount,
        vatRate: this.VAT_RATE * 100,
        vatAmount: parseFloat(taxAmount.toFixed(2)),
      },
    };
  }

  calculatePAYE(annualIncome: number): TaxResponseDto {
    let totalTax = 0;
    const breakdown: any[] = [];
    let remainingIncome = annualIncome;

    for (const bracket of this.PAYE_BRACKETS) {
      if (remainingIncome <= 0) break;

      const taxableInBracket = Math.min(
        remainingIncome,
        bracket.max === Infinity ? remainingIncome : bracket.max - bracket.min,
      );

      if (taxableInBracket > 0) {
        const taxInBracket = taxableInBracket * bracket.rate;
        totalTax += taxInBracket;

        breakdown.push({
          bracket: `₦${bracket.min.toLocaleString()} - ₦${
            bracket.max === Infinity ? '∞' : bracket.max.toLocaleString()
          }`,
          taxableAmount: parseFloat(taxableInBracket.toFixed(2)),
          rate: bracket.rate * 100,
          taxAmount: parseFloat(taxInBracket.toFixed(2)),
        });

        remainingIncome -= taxableInBracket;
      }
    }

    const netAmount = annualIncome - totalTax;

    return {
      taxType: TaxType.PAYE,
      taxableAmount: annualIncome,
      taxAmount: parseFloat(totalTax.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      rate: (totalTax / annualIncome) * 100,
      breakdown,
    };
  }

  calculateCIT(profit: number): TaxResponseDto {
    const taxAmount = profit * this.CIT_RATE;
    const netAmount = profit - taxAmount;

    return {
      taxType: TaxType.CIT,
      taxableAmount: profit,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      rate: this.CIT_RATE * 100,
      breakdown: {
        profit,
        citRate: this.CIT_RATE * 100,
        citAmount: parseFloat(taxAmount.toFixed(2)),
      },
    };
  }

  calculatePIT(annualIncome: number): TaxResponseDto {
    // Personal Income Tax uses the same brackets as PAYE
    return this.calculatePAYE(annualIncome);
  }

  calculateCGT(gain: number): TaxResponseDto {
    const taxAmount = gain * this.CGT_RATE;
    const netAmount = gain - taxAmount;

    return {
      taxType: TaxType.CGT,
      taxableAmount: gain,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      rate: this.CGT_RATE * 100,
      breakdown: {
        capitalGain: gain,
        cgtRate: this.CGT_RATE * 100,
        cgtAmount: parseFloat(taxAmount.toFixed(2)),
      },
    };
  }

  calculate(dto: CalculateTaxDto): TaxResponseDto {
    switch (dto.taxType) {
      case TaxType.VAT:
        return this.calculateVAT(dto.amount);
      case TaxType.PAYE:
        return this.calculatePAYE(dto.amount);
      case TaxType.CIT:
        return this.calculateCIT(dto.amount);
      case TaxType.PIT:
        return this.calculatePIT(dto.amount);
      case TaxType.CGT:
        return this.calculateCGT(dto.amount);
      default:
        throw new Error(`Unsupported tax type: ${dto.taxType}`);
    }
  }
}


