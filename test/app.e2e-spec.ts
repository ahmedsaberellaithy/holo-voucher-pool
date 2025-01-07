import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Pool } from 'pg';

describe('AppController (e2e)', () => {
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

    // Initialize app after DB is ready
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    console.log('Running test...===========>');
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/customers', () => {
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
        // First create a customer
        await request(app.getHttpServer())
          .post('/customers')
          .send(validCustomer);

        // Try to create another customer with same email
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
        // First create a customer
        await request(app.getHttpServer())
          .post('/customers')
          .send(validCustomer);

        // Then retrieve the customer
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

      it('should be rate limited', async () => {
        await request(app.getHttpServer())
          .post('/customers')
          .send(validCustomer);

        // Make multiple requests in quick succession
        const multipleRequests = Array(10)
          .fill(null)
          .map(() =>
            request(app.getHttpServer()).get(
              `/customers/${validCustomer.email}`,
            ),
          );

        const responses = await Promise.all(multipleRequests);
        expect(responses.some((res) => res.status === 429)).toBeTruthy();
      });
    });
  });

  describe('Special Offers', () => {
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
            discountPercentage: 101, // Invalid: > 100%
          })
          .expect(400);
      });

      it('should be rate limited', async () => {
        // Make multiple requests in quick succession
        const requests = Array(10)
          .fill(null)
          .map(() =>
            request(app.getHttpServer())
              .post('/special-offers')
              .send(validSpecialOffer),
          );

        const responses = await Promise.all(requests);
        expect(responses.some((res) => res.status === 429)).toBeTruthy();
      });
    });

    describe('GET /special-offers', () => {
      it('should get all special offers', async () => {
        // First create a special offer
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

      it('should be rate limited', async () => {
        // Make multiple requests in quick succession
        const requests = Array(10)
          .fill(null)
          .map(() => request(app.getHttpServer()).get('/special-offers'));

        const responses = await Promise.all(requests);
        expect(responses.some((res) => res.status === 429)).toBeTruthy();
      });
    });
  });
});
