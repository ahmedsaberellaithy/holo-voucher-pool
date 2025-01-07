import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './customers.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmailAlreadyExistsException } from './errors/EmailAlreadyExistsException';

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: Repository<Customer>;

  const mockCustomer = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      jest.spyOn(repository, 'create').mockReturnValue(mockCustomer);
      jest.spyOn(repository, 'save').mockResolvedValue(mockCustomer);

      const result = await service.create({
        name: 'Test User',
        email: 'test@example.com',
      });

      expect(result).toEqual(mockCustomer);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should throw BadRequestException when name is empty', async () => {
      await expect(
        service.create({ name: '', email: 'test@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when email is empty', async () => {
      await expect(
        service.create({ name: 'Test User', email: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw EmailAlreadyExistsException when email already exists', async () => {
      jest.spyOn(repository, 'create').mockReturnValue(mockCustomer);
      jest.spyOn(repository, 'save').mockRejectedValue({ code: '23505' });

      await expect(
        service.create({
          name: 'Test User',
          email: 'test@example.com',
        }),
      ).rejects.toThrow(EmailAlreadyExistsException);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a customer by email', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockCustomer);

      const result = await service.findOneByEmail('test@example.com');
      expect(result).toEqual(mockCustomer);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.findOneByEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
