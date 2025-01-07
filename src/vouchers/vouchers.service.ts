import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ): Promise<VoucherCode> {
    return this.vouchersRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const customer = await this.customersService.findOneByEmail(email);
        const specialOffer =
          await this.specialOffersService.findOne(specialOfferId);

        const code = this.generateUniqueCode();
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);

        const voucher = transactionalEntityManager.create(VoucherCode, {
          code,
          customer,
          specialOffer,
          expirationDate,
        });

        return transactionalEntityManager.save(VoucherCode, voucher);
      },
    );
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
        const specialOffer = await this.specialOffersService.findOne(
          voucher.specialOfferId,
        );

        if (customer.id !== voucher.customerId) {
          throw new UnauthorizedException(
            'This voucher belongs to another customer',
          );
        }

        if (voucher.dateUsed) {
          throw new UnauthorizedException('This voucher has already been used');
        }

        if (voucher.expirationDate < new Date()) {
          throw new UnauthorizedException('This voucher has expired');
        }

        voucher.dateUsed = new Date();
        await transactionalEntityManager.save(VoucherCode, voucher);

        return specialOffer.discountPercentage;
      },
    );
  }

  async findAllByCustomerEmail(email: string): Promise<VoucherCode[]> {
    return this.vouchersRepository.find({
      where: { customer: { email } },
      relations: ['specialOffer'],
    });
  }
}
