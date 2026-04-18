import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards';
import { NoGuestGuard } from '../../common/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from './entities/user.entity';
import { UpdatePreferencesDto } from './dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user preferences' })
  async getPreferences(@CurrentUser() user: User) {
    return this.usersService.getPreferences(user.id);
  }

  @Post('preferences')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Save user preferences (onboarding)' })
  async savePreferences(@CurrentUser() user: User, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.savePreferences(user.id, dto.vibes, dto.music);
  }

  @Put('preferences')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Update user preferences' })
  async updatePreferences(@CurrentUser() user: User, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.savePreferences(user.id, dto.vibes, dto.music);
  }

  @Get('saved-venues')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Get saved venues list' })
  async getSavedVenues(@CurrentUser() user: User) {
    return this.usersService.getSavedVenues(user.id);
  }

  @Post('saved-venues/:venueId')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Save a venue' })
  async saveVenue(@CurrentUser() user: User, @Param('venueId') venueId: string) {
    return this.usersService.saveVenue(user.id, venueId);
  }

  @Delete('saved-venues/:venueId')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Unsave a venue' })
  async unsaveVenue(@CurrentUser() user: User, @Param('venueId') venueId: string) {
    return this.usersService.unsaveVenue(user.id, venueId);
  }

  @Get('redemptions')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Get redemption history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRedemptions(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getRedemptions(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }
}
