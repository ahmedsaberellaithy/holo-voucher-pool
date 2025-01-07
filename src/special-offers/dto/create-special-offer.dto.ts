import { ApiProperty } from '@nestjs/swagger';

export class CreateSpecialOfferDto {
  @ApiProperty({
    description: 'Name of the special offer',
    example: 'Summer Sale',
  })
  name: string;

  @ApiProperty({
    description: 'Discount percentage for the offer',
    minimum: 0,
    maximum: 100,
    example: 20,
  })
  discountPercentage: number;
}
