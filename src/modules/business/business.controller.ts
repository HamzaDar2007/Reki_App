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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  async login(@Body() dto: BusinessLoginDto) {
    return this.businessService.login(dto.email, dto.password);
  }

  @Post('auth/business/register')
  @ApiOperation({ summary: 'Business registration (apply to join REKI)' })
  async register(@Body() dto: BusinessRegisterDto) {
    return this.businessService.register(dto);
  }

  @Post('auth/business/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Business forgot password' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.businessService.forgotPassword(dto.email);
  }

  // ─── DASHBOARD ─────────────────────────────────────────

  @Get('business/dashboard/:venueId')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get venue dashboard (stats, vibe, weather)' })
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
  @ApiQuery({ name: 'period', required: false, description: 'today | week | month' })
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
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
  async deleteOffer(
    @Param('id') offerId: string,
    @CurrentUser() user: any,
  ) {
    return this.businessService.deleteOffer(offerId, user.id);
  }
}
