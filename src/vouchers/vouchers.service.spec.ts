import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository /* , EntityManager */ } from 'typeorm';
import { VouchersService } from './vouchers.service';
import { VoucherCode } from './vouchers.entity';
import { CustomersService } from '../customers/customers.service';
import { SpecialOffersService } from '../special-offers/special-offers.service';
import {
  NotFoundException /* , UnauthorizedException */,
} from '@nestjs/common';
// import { Customer } from 'src/customers/customers.entity';
// import { SpecialOffer } from 'src/special-offers/special-offers.entity';

describe('VouchersService', () => {
  let service: VouchersService;
  let voucherRepository: Repository<VoucherCode>;
  let customersService: CustomersService;
  // let specialOffersService: SpecialOffersService;

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
    expirationDate: new Date('2024-12-31'),
    dateUsed: null,
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
    // specialOffersService = module.get<SpecialOffersService>(SpecialOffersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateVoucher', () => {
    // it('should generate a new voucher successfully', async () => {
    //   jest
    //     .spyOn(customersService, 'findOneByEmail')
    //     .mockResolvedValue(mockCustomer as Customer);
    //   jest
    //     .spyOn(specialOffersService, 'findOne')
    //     .mockResolvedValue(mockSpecialOffer as SpecialOffer);
    //   jest
    //     .spyOn(voucherRepository.manager, 'transaction')
    //     .mockImplementation((isolationLevel, runInTransaction) => {
    //       const transactionManager = {
    //         ...jest.createMockFromModule<EntityManager>('typeorm'),
    //         create: jest.fn().mockReturnValue(mockVoucher),
    //         save: jest.fn().mockResolvedValue(mockVoucher),
    //       } as unknown as EntityManager;
    //       return runInTransaction(transactionManager);
    //     });

    //   const result = await service.generateVoucher('test@example.com', 1);
    //   expect(result).toEqual(mockVoucher);
    // });

    it('should throw NotFoundException when customer not found', async () => {
      jest
        .spyOn(customersService, 'findOneByEmail')
        .mockRejectedValue(
          new NotFoundException(
            'Customer with email nonexistent@example.com not found',
          ),
        );

      await expect(
        service.generateVoucher('nonexistent@example.com', 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // describe('validateAndUseVoucher', () => {
  // it('should validate and use voucher successfully', async () => {
  //   const validVoucher = { ...mockVoucher };
  //   jest
  //     .spyOn(voucherRepository.manager, 'transaction')
  //     .mockImplementation((isolationLevel, runInTransaction) => {
  //       const transactionManager = {
  //         ...jest.createMockFromModule<EntityManager>('typeorm'),
  //         findOne: jest.fn().mockResolvedValue(validVoucher),
  //         save: jest
  //           .fn()
  //           .mockResolvedValue({ ...validVoucher, dateUsed: new Date() }),
  //       } as unknown as EntityManager;
  //       return runInTransaction(transactionManager);
  //     });

  //   const result = await service.validateAndUseVoucher(
  //     'TEST123',
  //     'test@example.com',
  //   );
  //   expect(result).toBe(25.0);
  // });

  //   it('should throw UnauthorizedException when voucher is already used', async () => {
  //     const usedVoucher = { ...mockVoucher, dateUsed: new Date() };
  //     jest
  //       .spyOn(voucherRepository.manager, 'transaction')
  //       .mockImplementation((isolationLevel, runInTransaction) => {
  //         const transactionManager = {
  //           findOne: jest.fn().mockResolvedValue(usedVoucher),
  //         } as unknown as EntityManager;
  //         return runInTransaction(transactionManager);
  //       });

  //     await expect(
  //       service.validateAndUseVoucher('TEST123', 'test@example.com'),
  //     ).rejects.toThrow(UnauthorizedException);
  //   });

  //   it('should throw UnauthorizedException when voucher is expired', async () => {
  //     const expiredVoucher = {
  //       ...mockVoucher,
  //       expirationDate: new Date('2020-01-01'),
  //     };
  //     jest
  //       .spyOn(voucherRepository.manager, 'transaction')
  //       .mockImplementation((isolationLevel, runInTransaction) => {
  //         const transactionManager = {
  //           findOne: jest.fn().mockResolvedValue(expiredVoucher),
  //         } as unknown as EntityManager;
  //         return runInTransaction(transactionManager);
  //       });

  //     await expect(
  //       service.validateAndUseVoucher('TEST123', 'test@example.com'),
  //     ).rejects.toThrow(UnauthorizedException);
  //   });
  // });

  describe('findAllByCustomerEmail', () => {
    it('should return all vouchers for a customer', async () => {
      const mockVouchers = [mockVoucher];
      jest
        .spyOn(voucherRepository, 'find')
        .mockResolvedValue(mockVouchers as VoucherCode[]);

      const result = await service.findAllByCustomerEmail('test@example.com');
      expect(result).toEqual(mockVouchers);
    });
  });
});
