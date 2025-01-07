import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { Customer } from './customers.entity';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customersService.create(createCustomerDto);

    // Map the customer entity to the response DTO without the updated at and created at fields
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    };
  }

  @Get(':email')
  @ApiOperation({ summary: 'Get a customer by email' })
  @ApiResponse({
    status: 200,
    description: 'Customer found',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('email') email: string): Promise<CustomerResponseDto> {
    const customer: Customer =
      await this.customersService.findOneByEmail(email);

    // Map the customer entity to the response DTO without the updated at and created at fields
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    };
  }
}
