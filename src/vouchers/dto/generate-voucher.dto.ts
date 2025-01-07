import { ApiProperty } from '@nestjs/swagger';

export class GenerateVoucherDto {
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 1 })
  specialOfferId: number;
}

export class VoucherResponseDto {
  @ApiProperty({ example: 'ABC123XY' })
  code: string;

  @ApiProperty({ example: 25.0 })
  discountPercentage: number;

  @ApiProperty()
  expirationDate: Date;
}
