import { ApiProperty } from '@nestjs/swagger';

export class SpecialOfferDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Summer Sale' })
  name: string;

  @ApiProperty({ example: 25.0 })
  discountPercentage: number;
}
