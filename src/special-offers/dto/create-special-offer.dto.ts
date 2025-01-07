import { ApiProperty } from '@nestjs/swagger';

export class CreateSpecialOfferDto {
  @ApiProperty({
    description: 'Name of the special offer',
    example: 'Summer Sale',
  })
  name: string;

  @ApiProperty({
    description: 'Detailed description of the special offer',
    example: 'Get 20% off on all summer items',
  })
  description: string;

  @ApiProperty({
    description: 'Discount percentage for the offer',
    minimum: 0,
    maximum: 100,
    example: 20,
  })
  discountPercentage: number;

  @ApiProperty({
    description: 'Start date of the special offer',
    example: '2024-03-01T00:00:00Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of the special offer',
    example: '2024-03-31T23:59:59Z',
  })
  endDate: Date;
}
