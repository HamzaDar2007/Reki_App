import { Controller, Get, Param, Query, Post, NotFoundException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { ErrorCode } from '../../common/enums';

@ApiTags('Venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @ApiOperation({ summary: 'List venues with filters + pagination + personalization' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'atmosphere', required: false, description: 'quiet | lively | packed' })
  @ApiQuery({ name: 'vibe', required: false, description: 'Comma-separated vibe tags' })
  @ApiQuery({ name: 'priceLevel', required: false, type: Number })
  @ApiQuery({ name: 'priceMin', required: false, type: Number })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, description: 'recommended | busyness | distance' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'User latitude for distance calc' })
  @ApiQuery({ name: 'lng', required: false, type: Number, description: 'User longitude for distance calc' })
  async findAll(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('atmosphere') atmosphere?: string,
    @Query('vibe') vibe?: string,
    @Query('priceLevel') priceLevel?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Req() req?: any,
  ) {
    // Get user preferences if authenticated
    const userPreferences = req?.user?.preferences || null;

    const result = await this.venuesService.findAll(
      {
        city,
        category,
        atmosphere,
        vibe,
        priceLevel: priceLevel ? Number(priceLevel) : undefined,
        priceMin: priceMin ? Number(priceMin) : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
        sort,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        userLat: lat ? Number(lat) : undefined,
        userLng: lng ? Number(lng) : undefined,
      },
      userPreferences,
    );

    return {
      ...result,
      city: city || 'Manchester',
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search venues by name, area, or tags' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'city', required: false })
  async search(@Query('q') q: string, @Query('city') city?: string) {
    const venues = await this.venuesService.search(q, city);
    return { venues, count: venues.length };
  }

  @Get('filter-options')
  @ApiOperation({ summary: 'Get available filter options for a city' })
  @ApiQuery({ name: 'city', required: false })
  async getFilterOptions(@Query('city') city?: string) {
    return this.venuesService.getFilterOptions(city);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Top 5 trending venues by busyness' })
  @ApiQuery({ name: 'city', required: false })
  async getTrending(@Query('city') city?: string) {
    return this.venuesService.getTrending(city);
  }

  @Get('map-markers')
  @ApiOperation({ summary: 'Get map marker data for all venues' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'User latitude for distance' })
  @ApiQuery({ name: 'lng', required: false, type: Number, description: 'User longitude for distance' })
  async getMapMarkers(
    @Query('city') city?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.venuesService.getMapMarkers(
      city,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue detail by ID' })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  async findOne(
    @Param('id') id: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const venue = await this.venuesService.findById(
      id,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
    );
    if (!venue) {
      throw new NotFoundException({
        code: ErrorCode.VENUE_NOT_FOUND,
        message: 'Venue not found',
      });
    }
    return venue;
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Track venue view' })
  async trackView(@Param('id') id: string) {
    await this.venuesService.trackView(id);
    return { success: true };
  }
}
