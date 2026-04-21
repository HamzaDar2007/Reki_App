import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards';
import { NoGuestGuard } from '../../common/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from './entities/user.entity';
import { UpdatePreferencesDto } from './dto';

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiOkResponse({ description: 'User preferences (vibes + music tags)' })
  async getPreferences(@CurrentUser() user: User) {
    return this.usersService.getPreferences(user.id);
  }

  @Post('preferences')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Save user preferences (onboarding)' })
  @ApiBody({ type: UpdatePreferencesDto })
  @ApiCreatedResponse({ description: 'Preferences saved' })
  @ApiBadRequestResponse({ description: 'Invalid tag IDs' })
  @ApiForbiddenResponse({ description: 'Guest users cannot save preferences' })
  async savePreferences(@CurrentUser() user: User, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.savePreferences(user.id, dto.vibes, dto.music);
  }

  @Put('preferences')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiBody({ type: UpdatePreferencesDto })
  @ApiOkResponse({ description: 'Preferences updated' })
  @ApiForbiddenResponse({ description: 'Guest users cannot update preferences' })
  async updatePreferences(@CurrentUser() user: User, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.savePreferences(user.id, dto.vibes, dto.music);
  }

  @Get('saved-venues')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Get saved venues list' })
  @ApiOkResponse({ description: 'Array of saved venues with full detail' })
  @ApiForbiddenResponse({ description: 'Guest users cannot access saved venues' })
  async getSavedVenues(@CurrentUser() user: User) {
    return this.usersService.getSavedVenues(user.id);
  }

  @Post('saved-venues/:venueId')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Save a venue' })
  @ApiParam({ name: 'venueId', description: 'Venue UUID to save', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Venue saved to user bookmarks' })
  @ApiForbiddenResponse({ description: 'Guest users cannot save venues' })
  async saveVenue(@CurrentUser() user: User, @Param('venueId') venueId: string) {
    return this.usersService.saveVenue(user.id, venueId);
  }

  @Delete('saved-venues/:venueId')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Unsave a venue' })
  @ApiParam({ name: 'venueId', description: 'Venue UUID to unsave', format: 'uuid' })
  @ApiOkResponse({ description: 'Venue removed from bookmarks' })
  @ApiForbiddenResponse({ description: 'Guest users cannot modify saved venues' })
  async unsaveVenue(@CurrentUser() user: User, @Param('venueId') venueId: string) {
    return this.usersService.unsaveVenue(user.id, venueId);
  }

  @Get('redemptions')
  @UseGuards(NoGuestGuard)
  @ApiOperation({ summary: 'Get redemption history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated list of past redemptions' })
  @ApiForbiddenResponse({ description: 'Guest users cannot access redemption history' })
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
