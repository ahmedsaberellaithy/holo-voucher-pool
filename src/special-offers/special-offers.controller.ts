import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomThrottlerGuard } from '../common/guards/throttle.guard';
import { SpecialOffersService } from './special-offers.service';
import { SpecialOfferDto } from './dto/special-offer.dto';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get a special offer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found special offer',
    type: SpecialOfferDto,
  })
  @ApiResponse({ status: 404, description: 'Special offer not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.specialOffersService.findOne(id);
  }
}
