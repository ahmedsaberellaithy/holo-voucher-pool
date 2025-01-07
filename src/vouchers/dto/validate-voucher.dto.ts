import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ValidVoucherDto {
  @ApiProperty({
    description: 'Voucher code to validate and use',
    example: 'SUMMER2024',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  code: string;

  @ApiProperty({
    description: 'Email of the customer using the voucher',
    example: 'customer@example.com',
  })
  @IsString()
  @IsEmail()
  email: string;
}
