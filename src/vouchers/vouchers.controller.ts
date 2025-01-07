import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CustomThrottlerGuard } from '../common/guards/throttle.guard';
import { VouchersService } from './vouchers.service';
import {
  GenerateVoucherDto,
  VoucherResponseDto,
} from './dto/generate-voucher.dto';
import { ValidVoucherDto } from './dto/validate-voucher.dto';

@ApiTags('vouchers')
@UseGuards(CustomThrottlerGuard)
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new voucher for a customer' })
  @ApiResponse({
    status: 201,
    description: 'Voucher generated successfully',
    type: VoucherResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found or Special offer not found',
  })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async generateVoucher(
    @Body() generateVoucherDto: GenerateVoucherDto,
  ): Promise<VoucherResponseDto> {
    const voucher = await this.vouchersService.generateVoucher(
      generateVoucherDto.email,
      generateVoucherDto.specialOfferId,
      generateVoucherDto.expirationDate,
    );

    return {
      code: voucher.code,
      discountPercentage: voucher.discountPercentage,
      expirationDate: voucher.expirationDate,
      specialOfferName: voucher.specialOfferName,
    };
  }

  @Post('')
  @ApiOperation({ summary: 'Validate and use a voucher' })
  @ApiResponse({
    status: 200,
    description: 'Voucher validated & activated successfully',
    schema: {
      properties: {
        discountPercentage: {
          type: 'number',
          example: 25.0,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid voucher ownership',
  })
  @ApiResponse({
    status: 400,
    description: 'This voucher has already been used',
  })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async validateAndUseVoucher(
    @Body() validateVoucherDto: ValidVoucherDto,
  ): Promise<{ discountPercentage: number }> {
    const discountPercentage = await this.vouchersService.validateAndUseVoucher(
      validateVoucherDto.code,
      validateVoucherDto.email,
    );
    return { discountPercentage };
  }

  @Get('customer')
  @ApiOperation({ summary: 'Get all vouchers for a customer' })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of customer vouchers',
    type: [VoucherResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async getCustomerVouchers(
    @Query('email') email: string,
  ): Promise<VoucherResponseDto[]> {
    const vouchers = await this.vouchersService.findAllByCustomerEmail(email);

    return vouchers.map((voucher) => ({
      code: voucher.code,
      discountPercentage: voucher.specialOffer.discountPercentage,
      expirationDate: voucher.expirationDate,
      specialOfferName: voucher.specialOffer.name,
    }));
  }
}
