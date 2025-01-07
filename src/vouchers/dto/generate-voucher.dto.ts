import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class GenerateVoucherDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  specialOfferId: number;

  @ApiProperty({ example: '2025-12-31' })
  @IsDate()
  @IsNotEmpty()
  expirationDate: Date;
}

export class VoucherResponseDto {
  @ApiProperty({ example: 'ABC123XY' })
  code: string;

  @ApiProperty({ example: 25.0 })
  discountPercentage: number;

  @ApiProperty({ example: '2025-12-31' })
  expirationDate: Date;

  @ApiProperty({ example: 'Special Offer Name' })
  specialOfferName: string;
}
