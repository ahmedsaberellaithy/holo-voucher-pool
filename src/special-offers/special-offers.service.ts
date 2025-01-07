import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findAll(): Promise<SpecialOffer[]> {
    return this.specialOffersRepository.find();
  }

  async findOne(id: number): Promise<SpecialOffer> {
    const offer = await this.specialOffersRepository.findOneBy({ id });
    if (!offer) {
      throw new NotFoundException(`Special offer with ID ${id} not found`);
    }
    return offer;
  }

  async create(createSpecialOfferDto: CreateSpecialOfferDto) {
    const specialOffer = this.specialOffersRepository.create(
      createSpecialOfferDto,
    );
    await this.specialOffersRepository.save(specialOffer);

    return specialOffer;
  }
}
