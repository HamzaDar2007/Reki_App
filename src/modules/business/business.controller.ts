import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/guards';
import { BusinessGuard } from '../../common/guards';
import { CurrentUser } from '../auth/decorators';
import {
  BusinessLoginDto,
  BusinessRegisterDto,
  UpdateVenueStatusDto,
  CreateOfferDto,
  UpdateOfferDto,
  ToggleOfferDto,
} from './dto';
import { ForgotPasswordDto } from '../auth/dto';

@ApiTags('Business')
@Controller()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // ─── AUTH (under /auth/business) ───────────────────────

  @Post('auth/business/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Business login (email/password)' })
  @ApiBody({ type: BusinessLoginDto })
  @ApiOkResponse({ description: 'Business login success — tokens + venue list' })
  @ApiUnauthorizedResponse({ description: 'Invalid business credentials' })
  async login(@Body() dto: BusinessLoginDto) {
    return this.businessService.login(dto.email, dto.password);
  }

  @Post('auth/business/register')
  @ApiOperation({ summary: 'Business registration (apply to join REKI)' })
  @ApiBody({ type: BusinessRegisterDto })
  @ApiCreatedResponse({ description: 'Business application submitted — pending admin approval' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async register(@Body() dto: BusinessRegisterDto) {
    return this.businessService.register(dto);
  }

  @Post('auth/business/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Business forgot password' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({ description: 'Password reset email dispatched' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.businessService.forgotPassword(dto.email);
  }

  // ─── DASHBOARD ─────────────────────────────────────────

  @Get('business/dashboard/:venueId')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get venue dashboard (stats, vibe, weather)' })
  @ApiParam({ name: 'venueId', description: 'Venue UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Dashboard stats + live indicators for venue' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  @ApiForbiddenResponse({ description: 'Not authorized for this venue' })
  async getDashboard(
    @Param('venueId') venueId: string,
    @CurrentUser() user: any,
  ) {
    return this.businessService.getDashboard(venueId, user.id);
  }

  // ─── ANALYTICS ─────────────────────────────────────────

  @Get('business/analytics/:venueId')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get venue analytics (views, saves, clicks, redemptions)' })
  @ApiParam({ name: 'venueId', description: 'Venue UUID', format: 'uuid' })
  @ApiQuery({ name: 'period', required: false, description: 'today | week | month' })
  @ApiOkResponse({ description: 'Analytics metrics for the period' })
  @ApiForbiddenResponse({ description: 'Not authorized for this venue' })
  async getAnalytics(
    @Param('venueId') venueId: string,
    @CurrentUser() user: any,
    @Query('period') period?: string,
  ) {
    return this.businessService.getAnalytics(venueId, user.id, period);
  }

  // ─── VENUE STATUS ──────────────────────────────────────

  @Put('business/venues/:id/status')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update busyness + vibe (business owner)' })
  @ApiParam({ name: 'id', description: 'Venue UUID', format: 'uuid' })
  @ApiBody({ type: UpdateVenueStatusDto })
  @ApiOkResponse({ description: 'Venue status updated' })
  @ApiForbiddenResponse({ description: 'Not authorized for this venue' })
  async updateVenueStatus(
    @Param('id') venueId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateVenueStatusDto,
  ) {
    return this.businessService.updateVenueStatus(venueId, user.id, dto.busyness, dto.vibes);
  }

  @Get('business/venues/:id/status')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current venue status (busyness + vibe)' })
  @ApiParam({ name: 'id', description: 'Venue UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Current live busyness + vibe data' })
  async getVenueStatus(
    @Param('id') venueId: string,
    @CurrentUser() user: any,
  ) {
    return this.businessService.getVenueStatus(venueId, user.id);
  }

  // ─── OFFERS ────────────────────────────────────────────

  @Get('business/venues/:id/offers')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List venue offers (active + past)' })
  @ApiParam({ name: 'id', description: 'Venue UUID', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated offers owned by venue' })
  async getVenueOffers(
    @Param('id') venueId: string,
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.businessService.getVenueOffers(
      venueId,
      user.id,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Post('business/offers')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new offer' })
  @ApiBody({ type: CreateOfferDto })
  @ApiCreatedResponse({ description: 'Offer created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiForbiddenResponse({ description: 'Not authorized for this venue' })
  async createOffer(
    @CurrentUser() user: any,
    @Body() dto: CreateOfferDto,
  ) {
    return this.businessService.createOffer(dto.venueId, user.id, {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      validDays: dto.validDays,
      validTimeStart: dto.validTimeStart,
      validTimeEnd: dto.validTimeEnd,
      maxRedemptions: dto.maxRedemptions || 100,
      savingValue: dto.savingValue,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    } as any);
  }

  @Put('business/offers/:id')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an offer' })
  @ApiParam({ name: 'id', description: 'Offer UUID', format: 'uuid' })
  @ApiBody({ type: UpdateOfferDto })
  @ApiOkResponse({ description: 'Offer updated' })
  @ApiNotFoundResponse({ description: 'Offer not found' })
  @ApiForbiddenResponse({ description: 'Not authorized for this offer' })
  async updateOffer(
    @Param('id') offerId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.businessService.updateOffer(offerId, user.id, dto as any);
  }

  @Put('business/offers/:id/toggle')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle offer active/inactive' })
  @ApiParam({ name: 'id', description: 'Offer UUID', format: 'uuid' })
  @ApiBody({ type: ToggleOfferDto })
  @ApiOkResponse({ description: 'Offer isActive flag toggled' })
  async toggleOffer(
    @Param('id') offerId: string,
    @CurrentUser() user: any,
    @Body() dto: ToggleOfferDto,
  ) {
    return this.businessService.toggleOffer(offerId, user.id, dto.isActive);
  }

  @Delete('business/offers/:id')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an offer (soft delete)' })
  @ApiParam({ name: 'id', description: 'Offer UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'Offer soft-deleted' })
  @ApiNotFoundResponse({ description: 'Offer not found' })
  async deleteOffer(
    @Param('id') offerId: string,
    @CurrentUser() user: any,
  ) {
    return this.businessService.deleteOffer(offerId, user.id);
  }
}
