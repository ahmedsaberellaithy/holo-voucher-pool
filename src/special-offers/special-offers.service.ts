import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecialOffer } from './special-offers.entity';
import { CreateSpecialOfferDto } from './dto/create-special-offer.dto';

@Injectable()
export class SpecialOffersService {
  constructor(
    @InjectRepository(SpecialOffer)
    private specialOffersRepository: Repository<SpecialOffer>,
  ) {}

  async findAll(): Promise<
    Array<{
      id: number;
      name: string;
      discountPercentage: number;
    }>
  > {
    const specialOffers = await this.specialOffersRepository.find();

    return specialOffers.map((specialOffers) => ({
      id: specialOffers.id,
      name: specialOffers.name,
      discountPercentage: specialOffers.discountPercentage,
    }));
  }

  async findOne(id: number): Promise<SpecialOffer> {
    const offer = await this.specialOffersRepository.findOneBy({ id });
    if (!offer) {
      throw new NotFoundException(`Special offer with ID ${id} not found`);
    }
    return offer;
  }

  async create(createSpecialOfferDto: CreateSpecialOfferDto): Promise<{
    id: number;
    name: string;
    discountPercentage: number;
  }> {
    // Validate required fields
    if (!createSpecialOfferDto.name?.trim()) {
      throw new BadRequestException('Name is required');
    }

    // Validate discount percentage range
    if (
      createSpecialOfferDto.discountPercentage < 0 ||
      createSpecialOfferDto.discountPercentage > 100
    ) {
      throw new BadRequestException(
        'Discount percentage must be between 0 and 100',
      );
    }

    const newOffer = this.specialOffersRepository.create(createSpecialOfferDto);
    const specialOffer = await this.specialOffersRepository.save(newOffer);

    return {
      id: specialOffer.id,
      name: specialOffer.name,
      discountPercentage: specialOffer.discountPercentage,
    };
  }
}
