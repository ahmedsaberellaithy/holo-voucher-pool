import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecialOffersService } from './special-offers.service';
import { SpecialOffersController } from './special-offers.controller';
import { SpecialOffer } from './special-offers.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpecialOffer])],
  providers: [SpecialOffersService],
  controllers: [SpecialOffersController],
  exports: [SpecialOffersService],
})
export class SpecialOffersModule {}
