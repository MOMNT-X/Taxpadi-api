export class TaxResponseDto {
  taxType: string;
  taxableAmount: number;
  taxAmount: number;
  netAmount: number;
  rate: number;
  breakdown?: any;
}

