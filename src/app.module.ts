import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { SpecialOffersModule } from './special-offers/special-offers.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { ThrottlerModule } from '@nestjs/throttler';

const DEFAULT_THROTTLE_TTL = 1000; // 1 second
const DEFAULT_THROTTLE_LIMIT = 10; // 10 requests per second

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.PSQL_DB_HOST || 'localhost',
        port: parseInt(process.env.PSQL_DB_PORT, 10) || 5432,
        username: process.env.PSQL_DB_USER,
        password: process.env.PSQL_DB_PASSWORD,
        database: process.env.PSQL_DB_NAME,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL, 10) || DEFAULT_THROTTLE_TTL,
        limit:
          parseInt(process.env.THROTTLE_LIMIT, 10) || DEFAULT_THROTTLE_LIMIT,
      },
    ]),
    CustomersModule,
    SpecialOffersModule,
    VouchersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
