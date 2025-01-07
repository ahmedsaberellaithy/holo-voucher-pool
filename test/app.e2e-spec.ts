import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Pool } from 'pg';

describe('End2End testing for Vouchers API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Wait for PostgreSQL to be ready
    const pool = new Pool({
      host: process.env.PSQL_DB_HOST,
      port: parseInt(process.env.PSQL_DB_PORT),
      user: process.env.PSQL_DB_USER,
      password: process.env.PSQL_DB_PASSWORD,
      database: process.env.PSQL_DB_NAME,
    });

    let retries = 5;
    while (retries > 0) {
      try {
        await pool.query('SELECT 1');
        break;
      } catch (error) {
        console.log('Waiting for PostgreSQL...', {
          status: 'waiting',
          error: error,
        });
        retries -= 1;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    await pool.end();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    console.log('PostgreSQL is ready!, starting testing...');
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('Customers API', () => {
    const validCustomer = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    describe('POST /customers', () => {
      it('should create a new customer', () => {
        return request(app.getHttpServer())
          .post('/customers')
          .send(validCustomer)
          .expect(201)
          .expect((res) => {
            expect(res.body).toEqual({
              id: expect.any(Number),
              name: validCustomer.name,
              email: validCustomer.email,
            });
          });
      });

      it('should fail if email is already taken', async () => {
        await request(app.getHttpServer())
          .post('/customers')
          .send(validCustomer);

        return request(app.getHttpServer())
          .post('/customers')
          .send(validCustomer)
          .expect(409);
      });

      it('should fail with invalid email format', () => {
        return request(app.getHttpServer())
          .post('/customers')
          .send({
            name: 'Invalid',
            email: 'not-an-email',
          })
          .expect(400);
      });
    });

    describe('GET /customers/:email', () => {
      it('should get customer by email', async () => {
        await request(app.getHttpServer())
          .post('/customers')
          .send(validCustomer);

        return request(app.getHttpServer())
          .get(`/customers/${validCustomer.email}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toEqual({
              id: expect.any(Number),
              name: validCustomer.name,
              email: validCustomer.email,
            });
          });
      });

      it('should return 404 for non-existent email', () => {
        return request(app.getHttpServer())
          .get('/customers/nonexistent@example.com')
          .expect(404);
      });
    });
  });

  describe('Special Offers API', () => {
    const validSpecialOffer = {
      name: 'Summer Sale',
      discountPercentage: 20,
    };

    describe('POST /special-offers', () => {
      it('should create a new special offer', () => {
        return request(app.getHttpServer())
          .post('/special-offers')
          .send(validSpecialOffer)
          .expect(201)
          .expect((res) => {
            expect(res.body).toEqual({
              id: expect.any(Number),
              name: validSpecialOffer.name,
              discountPercentage: expect.closeTo(
                validSpecialOffer.discountPercentage,
                2,
              ),
            });
          });
      });

      it('should fail with invalid discount percentage', () => {
        return request(app.getHttpServer())
          .post('/special-offers')
          .send({
            ...validSpecialOffer,
            discountPercentage: 101,
          })
          .expect(400);
      });
    });

    describe('GET /special-offers', () => {
      it('should get all special offers', async () => {
        await request(app.getHttpServer())
          .post('/special-offers')
          .send(validSpecialOffer);

        return request(app.getHttpServer())
          .get('/special-offers')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toMatchObject({
              id: expect.any(Number),
              name: validSpecialOffer.name,
              discountPercentage: `${validSpecialOffer.discountPercentage.toFixed(2)}`,
            });
          });
      });
    });
  });

  describe('Vouchers API', () => {
    const validCustomer = {
      name: 'Ahmed Saber',
      email: 'saber@example.com',
    };

    const validSpecialOffer = {
      name: 'Winter Sale',
      discountPercentage: 25,
    };

    let specialOfferId: number;

    beforeEach(async () => {
      // Create customer and special offer for voucher tests
      await request(app.getHttpServer()).post('/customers').send(validCustomer);

      // Create customer with no vouchers for no vouchers test
      await request(app.getHttpServer()).post('/customers').send({
        name: 'No-voucher Customer',
        email: 'novouchers@example.com',
      });

      const specialOfferResponse = await request(app.getHttpServer())
        .post('/special-offers')
        .send(validSpecialOffer);

      specialOfferId = specialOfferResponse.body.id;
    });

    describe('POST /vouchers/generate', () => {
      it('should generate a new voucher', () => {
        const generateVoucherDto = {
          email: validCustomer.email,
          specialOfferId: specialOfferId,
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
        };

        return request(app.getHttpServer())
          .post('/vouchers/generate')
          .send(generateVoucherDto)
          .expect(201)
          .expect((res) => {
            expect(res.body).toEqual({
              code: expect.any(String),
              discountPercentage: `${validSpecialOffer.discountPercentage.toFixed(2)}`,
              expirationDate: expect.any(String),
              specialOfferName: validSpecialOffer.name,
            });
          });
      });

      it('should fail with non-existent customer', () => {
        const generateVoucherDto = {
          email: 'nonexistent@example.com',
          specialOfferId: specialOfferId,
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
        };

        return request(app.getHttpServer())
          .post('/vouchers/generate')
          .send(generateVoucherDto)
          .expect(404);
      });
    });

    describe('POST /vouchers', () => {
      it('should validate and use a voucher', async () => {
        // First generate a voucher
        const generateVoucherDto = {
          email: validCustomer.email,
          specialOfferId: specialOfferId,
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
        };

        const generatedVoucher = await request(app.getHttpServer())
          .post('/vouchers/generate')
          .send(generateVoucherDto);

        // Then validate and use it
        return request(app.getHttpServer())
          .post('/vouchers')
          .send({
            code: generatedVoucher.body.code,
            email: validCustomer.email,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toEqual({
              discountPercentage: `${validSpecialOffer.discountPercentage.toFixed(2)}`,
            });
          });
      });

      it('should fail with invalid voucher code', () => {
        return request(app.getHttpServer())
          .post('/vouchers')
          .send({
            code: 'INVALID-CODE',
            email: validCustomer.email,
          })
          .expect(404);
      });
    });

    describe('GET /vouchers/customer', () => {
      it('should get all vouchers for a customer', async () => {
        // First generate a voucher
        const generateVoucherDto = {
          email: validCustomer.email,
          specialOfferId: specialOfferId,
          expirationDate: new Date(Date.now() + 86400000).toISOString(),
        };

        await request(app.getHttpServer())
          .post('/vouchers/generate')
          .send(generateVoucherDto);

        // Then get all vouchers
        return request(app.getHttpServer())
          .get(`/vouchers/customer?email=${validCustomer.email}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toEqual({
              code: expect.any(String),
              discountPercentage: `${validSpecialOffer.discountPercentage.toFixed(2)}`,
              expirationDate: expect.any(String),
              specialOfferName: validSpecialOffer.name,
            });
          });
      });

      it('should return empty array for customer with no vouchers', async () => {
        return request(app.getHttpServer())
          .get('/vouchers/customer?email=novouchers@example.com')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toEqual(0);
          });
      });

      it('should return error for non exitsting customer', () => {
        return request(app.getHttpServer())
          .get('/vouchers/customer?email=non-existing@example.com')
          .expect(404);
      });
    });
  });
});
