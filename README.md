## Description

Voucher Pool API with NestJS
A REST API built using NestJS and PostgreSQL for managing voucher pools. This API allows businesses to create and validate voucher codes for customers to receive special discounts.

## Features

- **Generate Voucher Codes** for each customer.
- **Validate Voucher Codes** with email and track usage.
- **Fetch Valid Voucher Codes** for a customer.
- Modular and scalable architecture.
- Follows best practices with TypeScript, ESLint, and Prettier.

## Project Structure

```plaintext
src/
├── customers/
│   ├── customer.entity.ts        # Customer entity definition
│   ├── customers.controller.ts   # REST endpoints for customers
│   ├── customers.module.ts       # NestJS module for customers
│   └── customers.service.ts      # Business logic for customers
├── special-offers/
│   ├── special-offer.entity.ts   # Special offer entity definition
│   ├── special-offers.controller.ts # REST endpoints for special offers
│   ├── special-offers.module.ts  # NestJS module for special offers
│   └── special-offers.service.ts # Business logic for special offers
├── vouchers/
│   ├── voucher.entity.ts         # Voucher entity definition
│   ├── vouchers.controller.ts    # REST endpoints for vouchers
│   ├── vouchers.module.ts        # NestJS module for vouchers
│   └── vouchers.service.ts       # Business logic for vouchers
```

### Prerequisites

- Node.js (v18 or later)
- PostgreSQL (v15 or later)
- Docker (optional, for running the database)

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Docker Setup

The project includes two Docker Compose configurations for different environments:

### Development Environment

```bash
# Start the development environment
docker-compose -f docker-compose.dev.yml up -d

# Stop the development environment
docker-compose -f docker-compose.dev.yml down
```

Features:

- Hot reload enabled
- Source code mounted as volume
- Swagger API docs available at http://localhost:3045/api-docs
- Node modules mounted as volume

#### API Documentation

The API documentation (Swagger UI) is available at:

```http
http://localhost:3045/api-docs
```

Note: The API documentation is only available in development mode (`NODE_ENV=development`).

### Production Environment

```bash
# Start the production environment
docker-compose up -d

# Stop the production environment
docker-compose down
```

Features:

- Optimized for production use
- No source code mounting
- No Swagger API docs
- No development dependencies

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
