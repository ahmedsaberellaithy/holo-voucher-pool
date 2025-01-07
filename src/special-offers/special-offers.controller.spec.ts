import { Test, TestingModule } from '@nestjs/testing';
import { SpecialOffersController } from './special-offers.controller';
import { SpecialOffersService } from './special-offers.service';
import { NotFoundException } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from '../common/guards/throttle.guard';

describe('SpecialOffersController', () => {
  let controller: SpecialOffersController;
  let service: SpecialOffersService;

  const mockSpecialOffer = {
    id: 1,
    name: 'Summer Sale',
    discountPercentage: 25.0,
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
      controllers: [SpecialOffersController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
        {
          provide: SpecialOffersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: CustomThrottlerGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<SpecialOffersController>(SpecialOffersController);
    service = module.get<SpecialOffersService>(SpecialOffersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of special offers', async () => {
      const mockOffers = [mockSpecialOffer];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockOffers);

      const result = await controller.findAll();
      expect(result).toEqual(mockOffers);
    });
  });

  describe('findOne', () => {
    it('should return a special offer by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSpecialOffer);

      const result = await controller.findOne(1);
      expect(result).toEqual(mockSpecialOffer);
    });

    it('should throw NotFoundException when special offer not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
