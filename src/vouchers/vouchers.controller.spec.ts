import { Test, TestingModule } from '@nestjs/testing';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { UnauthorizedException } from '@nestjs/common';
import { VoucherCode } from './vouchers.entity';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

describe('VouchersController', () => {
  let controller: VouchersController;
  let service: VouchersService;

  const mockVoucher = {
    id: 1,
    code: 'TEST123',
    customer: {
      id: 1,
      email: 'test@example.com',
    },
    specialOffer: {
      id: 1,
      name: 'Summer Sale',
      discountPercentage: 25.0,
    },
    expirationDate: new Date('2024-12-31'),
    dateUsed: null,
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
      controllers: [VouchersController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
        {
          provide: VouchersService,
          useValue: {
            generateVoucher: jest.fn(),
            validateAndUseVoucher: jest.fn(),
            findAllByCustomerEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VouchersController>(VouchersController);
    service = module.get<VouchersService>(VouchersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('validateVoucher', () => {
    it('should validate and use a voucher successfully', async () => {
      jest.spyOn(service, 'validateAndUseVoucher').mockResolvedValue(25.0);

      const result = await controller.validateAndUseVoucher({
        code: 'TEST123',
        email: 'test@example.com',
      });
      expect(result).toEqual({ discountPercentage: 25.0 });
    });

    it('should throw UnauthorizedException when voucher is invalid', async () => {
      jest
        .spyOn(service, 'validateAndUseVoucher')
        .mockRejectedValue(new UnauthorizedException());

      await expect(
        controller.validateAndUseVoucher({
          code: 'INVALID',
          email: 'test@example.com',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getCustomerVouchers', () => {
    it('should return customer vouchers', async () => {
      const mockVouchers = [mockVoucher];
      jest
        .spyOn(service, 'findAllByCustomerEmail')
        .mockResolvedValue(mockVouchers as VoucherCode[]);

      const result = await controller.getCustomerVouchers('test@example.com');
      expect(result).toEqual(
        mockVouchers.map((voucher) => ({
          code: voucher.code,
          discountPercentage: voucher.specialOffer.discountPercentage,
          expirationDate: voucher.expirationDate,
          specialOfferName: voucher.specialOffer.name,
        })),
      );
    });
  });
});
