import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../customers/customers.entity';
import { SpecialOffer } from '../special-offers/special-offers.entity';

@Entity()
export class VoucherCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @ManyToOne(() => Customer, { nullable: false })
  customer: Customer;

  @ManyToOne(() => SpecialOffer, { nullable: false })
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
