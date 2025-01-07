import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the customer',
  })
  id: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the customer',
  })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the customer',
  })
  email: string;
}
