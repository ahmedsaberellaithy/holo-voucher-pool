import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomThrottlerGuard } from '../common/guards/throttle.guard';
import { SpecialOffersService } from './special-offers.service';
import { SpecialOfferDto } from './dto/special-offer.dto';
import { CreateSpecialOfferDto } from './dto/create-special-offer.dto';

@ApiTags('special-offers')
@UseGuards(CustomThrottlerGuard)
@Controller('special-offers')
export class SpecialOffersController {
  constructor(private readonly specialOffersService: SpecialOffersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all special offers' })
  @ApiResponse({
    status: 200,
    description: 'List of all special offers',
    type: [SpecialOfferDto],
  })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  findAll() {
    return this.specialOffersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new special offer' })
  @ApiResponse({
    status: 201,
    description: 'The special offer has been successfully created',
    type: SpecialOfferDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  create(@Body() createSpecialOfferDto: CreateSpecialOfferDto) {
    return this.specialOffersService.create(createSpecialOfferDto);
  }
}
