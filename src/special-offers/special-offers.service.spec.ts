import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecialOffersService } from './special-offers.service';
import { SpecialOffer } from './special-offers.entity';
import { NotFoundException } from '@nestjs/common';

describe('SpecialOffersService', () => {
  let service: SpecialOffersService;
  let repository: Repository<SpecialOffer>;

  const mockSpecialOffer = {
    id: 1,
    name: 'Summer Sale',
    discountPercentage: 25.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecialOffersService,
        {
          provide: getRepositoryToken(SpecialOffer),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SpecialOffersService>(SpecialOffersService);
    repository = module.get<Repository<SpecialOffer>>(
      getRepositoryToken(SpecialOffer),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of special offers', async () => {
      const mockOffers = [mockSpecialOffer];
      jest.spyOn(repository, 'find').mockResolvedValue(mockOffers);

      const result = await service.findAll();
      expect(result).toEqual(mockOffers);
    });
  });

  describe('findOne', () => {
    it('should return a special offer by id', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockSpecialOffer);

      const result = await service.findOne(1);
      expect(result).toEqual(mockSpecialOffer);
    });

    it('should throw NotFoundException when special offer not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
