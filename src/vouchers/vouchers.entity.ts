import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../customers/customers.entity';
import { SpecialOffer } from '../special-offers/special-offers.entity';

@Entity()
export class VoucherCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ name: 'special_offer_id' })
  specialOfferId: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => SpecialOffer)
  @JoinColumn({ name: 'special_offer_id' })
  specialOffer: SpecialOffer;

  @Column('timestamp')
  expirationDate: Date;

  @Column({ nullable: true })
  dateUsed: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
