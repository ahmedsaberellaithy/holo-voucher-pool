import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the customer' })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the customer',
  })
  email: string;
}
