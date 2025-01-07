import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { VoucherCode } from './vouchers.entity';
import { CustomersService } from '../customers/customers.service';
import { SpecialOffersService } from '../special-offers/special-offers.service';
import * as crypto from 'crypto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(VoucherCode)
    private vouchersRepository: Repository<VoucherCode>,
    private customersService: CustomersService,
    private specialOffersService: SpecialOffersService,
  ) {}

  private generateUniqueCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(
      crypto.randomBytes(8),
      (byte) => chars[byte % chars.length],
    ).join('');
  }

  async generateVoucher(
    email: string,
    specialOfferId: number,
    expirationDate: Date,
  ): Promise<{
    code: string;
    discountPercentage: number;
    expirationDate: Date;
    specialOfferName: string;
  }> {
    const customer = await this.customersService.findOneByEmail(email);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const specialOffer =
      await this.specialOffersService.findOne(specialOfferId);

    if (!specialOffer) {
      throw new NotFoundException('Special offer not found');
    }

    const code = this.generateUniqueCode();

    const voucher = this.vouchersRepository.create({
      code,
      customer,
      specialOffer,
      expirationDate,
    });

    const savedVoucher = await this.vouchersRepository.save(voucher);

    return {
      code: savedVoucher.code,
      discountPercentage: specialOffer.discountPercentage,
      expirationDate: savedVoucher.expirationDate,
      specialOfferName: specialOffer.name,
    };
  }

  async validateAndUseVoucher(code: string, email: string): Promise<number> {
    return this.vouchersRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const voucher = await transactionalEntityManager.findOne(VoucherCode, {
          where: { code },
          select: [
            'id',
            'code',
            'dateUsed',
            'expirationDate',
            'customerId',
            'specialOfferId',
          ],
          lock: { mode: 'pessimistic_write' },
        });

        if (!voucher) {
          throw new NotFoundException('Voucher not found');
        }

        const customer = await this.customersService.findOneByEmail(email);
        if (!customer) {
          throw new NotFoundException('Customer not found');
        }

        if (customer.id !== voucher.customerId) {
          throw new UnauthorizedException(
            'This voucher belongs to another customer',
          );
        }

        const specialOffer = await this.specialOffersService.findOne(
          voucher.specialOfferId,
        );
        if (!specialOffer) {
          throw new NotFoundException('Special offer not found');
        }

        if (voucher.dateUsed) {
          throw new BadRequestException('This voucher has already been used');
        }

        if (voucher.expirationDate < new Date()) {
          // not sure if 410 Gone is the best choice here
          throw new GoneException('This voucher has expired');
        }

        voucher.dateUsed = new Date();
        await transactionalEntityManager.save(VoucherCode, voucher);

        return specialOffer.discountPercentage;
      },
    );
  }

  async findAllByCustomerEmail(email: string): Promise<VoucherCode[]> {
    const customer = await this.customersService.findOneByEmail(email);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.vouchersRepository.find({
      where: {
        customerId: customer.id,
        dateUsed: IsNull(),
      },
      relations: ['specialOffer'],
      select: {
        specialOffer: {
          name: true,
          discountPercentage: true,
        },
      },
    });
  }
}
