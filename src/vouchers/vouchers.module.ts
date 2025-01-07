import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import { VoucherCode } from './vouchers.entity';
import { CustomersModule } from '../customers/customers.module';
import { SpecialOffersModule } from '../special-offers/special-offers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoucherCode]),
    CustomersModule,
    SpecialOffersModule,
  ],
  providers: [VouchersService],
  controllers: [VouchersController],
})
export class VouchersModule {}
