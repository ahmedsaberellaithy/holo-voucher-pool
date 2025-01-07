import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { NotFoundException } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  const mockCustomer = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 1000,
            limit: 10,
          },
        ]),
      ],
      controllers: [CustomersController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
        {
          provide: CustomersService,
          useValue: {
            create: jest.fn(),
            findOneByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'Test User',
        email: 'test@example.com',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockCustomer);

      const result = await controller.create(createCustomerDto);
      expect(result).toEqual(mockCustomer);
      expect(service.create).toHaveBeenCalledWith(createCustomerDto);
    });
  });

  describe('findOne', () => {
    it('should return a customer by email', async () => {
      jest.spyOn(service, 'findOneByEmail').mockResolvedValue(mockCustomer);

      const result = await controller.findOne('test@example.com');
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest
        .spyOn(service, 'findOneByEmail')
        .mockRejectedValue(
          new NotFoundException(
            `Customer with email nonexistent@example.com not found`,
          ),
        );

      await expect(
        controller.findOne('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
