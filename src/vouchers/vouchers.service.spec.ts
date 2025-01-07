import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VouchersService } from './vouchers.service';
import { VoucherCode } from './vouchers.entity';
import { CustomersService } from '../customers/customers.service';
import { SpecialOffersService } from '../special-offers/special-offers.service';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { Customer } from 'src/customers/customers.entity';
import { SpecialOffer } from 'src/special-offers/special-offers.entity';

describe('VouchersService', () => {
  let service: VouchersService;
  let voucherRepository: Repository<VoucherCode>;
  let customersService: CustomersService;
  let specialOffersService: SpecialOffersService;

  const mockCustomer = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockSpecialOffer = {
    id: 1,
    name: 'Test Offer',
    discountPercentage: 25.0,
  };

  const mockVoucher = {
    id: 1,
    code: 'TEST123',
    customer: mockCustomer,
    specialOffer: mockSpecialOffer,
    expirationDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    dateUsed: null,
    customerId: 1,
    specialOfferId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VouchersService,
        {
          provide: getRepositoryToken(VoucherCode),
          useValue: {
            manager: {
              transaction: jest.fn((cb) =>
                cb({
                  findOne: jest.fn(),
                  create: jest.fn(),
                  save: jest.fn(),
                }),
              ),
            },
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: CustomersService,
          useValue: {
            findOneByEmail: jest.fn(),
          },
        },
        {
          provide: SpecialOffersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VouchersService>(VouchersService);
    voucherRepository = module.get<Repository<VoucherCode>>(
      getRepositoryToken(VoucherCode),
    );
    customersService = module.get<CustomersService>(CustomersService);
    specialOffersService =
      module.get<SpecialOffersService>(SpecialOffersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateVoucher', () => {
    const expirationDate = new Date('2024-12-31');

    it('should generate a new voucher successfully', async () => {
      jest
        .spyOn(customersService, 'findOneByEmail')
        .mockResolvedValue(mockCustomer as Customer);
      jest
        .spyOn(specialOffersService, 'findOne')
        .mockResolvedValue(mockSpecialOffer as SpecialOffer);
      jest
        .spyOn(voucherRepository, 'create')
        .mockReturnValue(mockVoucher as VoucherCode);
      jest
        .spyOn(voucherRepository, 'save')
        .mockResolvedValue(mockVoucher as VoucherCode);

      const result = await service.generateVoucher(
        'test@example.com',
        1,
        expirationDate,
      );

      expect(result).toEqual({
        code: mockVoucher.code,
        discountPercentage: mockSpecialOffer.discountPercentage,
        expirationDate: mockVoucher.expirationDate,
        specialOfferName: mockSpecialOffer.name,
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest.spyOn(customersService, 'findOneByEmail').mockResolvedValue(null);

      await expect(
        service.generateVoucher('nonexistent@example.com', 1, expirationDate),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when special offer not found', async () => {
      jest
        .spyOn(customersService, 'findOneByEmail')
        .mockResolvedValue(mockCustomer as Customer);
      jest.spyOn(specialOffersService, 'findOne').mockResolvedValue(null);

      await expect(
        service.generateVoucher('test@example.com', 999, expirationDate),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateAndUseVoucher', () => {
    it('should validate and use voucher successfully', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValue(mockVoucher),
          save: jest.fn().mockResolvedValue({
            id: 1,
            code: 'TEST123',
            customer: mockCustomer,
            specialOffer: mockSpecialOffer,
            expirationDate: new Date(
              new Date().setMonth(new Date().getMonth() + 1),
            ),
            customerId: 1,
            specialOfferId: 1,
            dateUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
          }),
        });
      });

      jest
        .spyOn(voucherRepository.manager, 'transaction')
        .mockImplementation(transactionMock);
      jest
        .spyOn(customersService, 'findOneByEmail')
        .mockResolvedValue(mockCustomer as Customer);
      jest
        .spyOn(specialOffersService, 'findOne')
        .mockResolvedValue(mockSpecialOffer as SpecialOffer);

      const result = await service.validateAndUseVoucher(
        'TEST123',
        'test@example.com',
      );
      expect(result).toBe(25.0);
    });

    it('should throw NotFoundException when voucher not found', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValue(null),
        });
      });

      jest
        .spyOn(voucherRepository.manager, 'transaction')
        .mockImplementation(transactionMock);

      await expect(
        service.validateAndUseVoucher('INVALID', 'test@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when voucher belongs to another customer', async () => {
      const differentCustomer = {
        email: 'test2@example.com',
        name: 'Test User 2',
        id: 2,
      };

      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValue(mockVoucher),
        });
      });

      jest
        .spyOn(voucherRepository.manager, 'transaction')
        .mockImplementation(transactionMock);
      jest
        .spyOn(customersService, 'findOneByEmail')
        .mockResolvedValue(differentCustomer as Customer);

      await expect(
        service.validateAndUseVoucher('TEST123', 'other@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when voucher is already used', async () => {
      const usedVoucher = {
        id: 1,
        code: 'TEST123',
        customer: mockCustomer,
        specialOffer: mockSpecialOffer,
        expirationDate: new Date(
          new Date().setMonth(new Date().getMonth() + 1),
        ),
        customerId: 1,
        specialOfferId: 1,
        dateUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };

      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValue(usedVoucher),
        });
      });

      jest
        .spyOn(voucherRepository.manager, 'transaction')
        .mockImplementation(transactionMock);
      jest
        .spyOn(customersService, 'findOneByEmail')
        .mockResolvedValue(mockCustomer as Customer);
      jest
        .spyOn(specialOffersService, 'findOne')
        .mockResolvedValue(mockSpecialOffer as SpecialOffer);

      await expect(
        service.validateAndUseVoucher('TEST123', 'test@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw GoneException when voucher is expired', async () => {
      const expiredVoucher = {
        id: 1,
        code: 'TEST123',
        customer: mockCustomer,
        specialOffer: mockSpecialOffer,
        dateUsed: null,
        customerId: 1,
        specialOfferId: 1,
        expirationDate: new Date('2020-01-01'),
      };

      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValue(expiredVoucher),
        });
      });

      jest
        .spyOn(voucherRepository.manager, 'transaction')
        .mockImplementation(transactionMock);
      jest
        .spyOn(customersService, 'findOneByEmail')
        .mockResolvedValue(mockCustomer as Customer);
      jest
        .spyOn(specialOffersService, 'findOne')
        .mockResolvedValue(mockSpecialOffer as SpecialOffer);

      await expect(
        service.validateAndUseVoucher('TEST123', 'test@example.com'),
      ).rejects.toThrow(GoneException);
    });
  });

  describe('findAllByCustomerEmail', () => {
    it('should return all vouchers for a customer', async () => {
      jest
        .spyOn(customersService, 'findOneByEmail')
        .mockResolvedValue(mockCustomer as Customer);
      jest
        .spyOn(voucherRepository, 'find')
        .mockResolvedValue([mockVoucher] as VoucherCode[]);

      const result = await service.findAllByCustomerEmail('test@example.com');
      expect(result).toEqual([mockVoucher]);
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest.spyOn(customersService, 'findOneByEmail').mockResolvedValue(null);

      await expect(
        service.findAllByCustomerEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
