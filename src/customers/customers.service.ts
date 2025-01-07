import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customers.entity';
import { EmailAlreadyExistsException } from './errors/EmailAlreadyExistsException';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: {
    name: string;
    email: string;
  }): Promise<Customer> {
    // validate the name and email that they are valid and not empty
    if (!createCustomerDto.name?.trim() || !createCustomerDto.email?.trim()) {
      throw new BadRequestException('Name and email are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createCustomerDto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    try {
      const customer = this.customersRepository.create(createCustomerDto);
      const savedCustomer = await this.customersRepository.save(customer);

      return savedCustomer;
    } catch (error) {
      // error code for unique constraint violation
      if (error.code === '23505') {
        // Assuming the unique constraint is on the 'email' column
        throw new EmailAlreadyExistsException(createCustomerDto.email);
      }
      throw error;
    }
  }
  async findOneByEmail(email: string): Promise<Customer> {
    const customer = await this.customersRepository.findOneBy({ email });
    if (!customer) {
      throw new NotFoundException(`Customer with email ${email} not found`);
    }
    return customer;
  }
}
