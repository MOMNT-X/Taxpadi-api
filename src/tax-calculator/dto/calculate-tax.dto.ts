import { IsEnum, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export enum TaxType {
  VAT = 'VAT',
  PAYE = 'PAYE',
  CIT = 'CIT',
  PIT = 'PIT',
  CGT = 'CGT',
}

export class CalculateTaxDto {
  @IsEnum(TaxType)
  taxType: TaxType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

