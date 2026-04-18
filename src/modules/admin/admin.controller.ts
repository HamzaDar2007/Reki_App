import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform overview stats (admin only)' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('stats/location')
  @ApiOperation({ summary: 'Get location-related stats (admin only)' })
  async getLocationStats() {
    return this.adminService.getLocationStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('users/:id/activity')
  @ApiOperation({ summary: 'Get user activity — login history, redemptions (admin only)' })
  async getUserActivity(@Param('id') id: string) {
    const result = await this.adminService.getUserActivity(id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return result;
  }

  // ─── WEEK 4 ADMIN ENDPOINTS ───────────────────────────

  @Get('venues')
  @ApiOperation({ summary: 'List all venues with status (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVenues(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getVenues(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('venues/:id/logs')
  @ApiOperation({ summary: 'Get busyness/vibe update logs for a venue (admin only)' })
  async getVenueLogs(@Param('id') id: string) {
    return this.adminService.getVenueLogs(id);
  }

  @Get('offers')
  @ApiOperation({ summary: 'List all offers across venues (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllOffers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllOffers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('offers/redemptions')
  @ApiOperation({ summary: 'Get redemption logs (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRedemptionLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getRedemptionLogs(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('activity-logs')
  @ApiOperation({ summary: 'Get all activity logs (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getActivityLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getActivityLogs(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get all notification logs (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getNotifications(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getNotifications(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('stats/realtime')
  @ApiOperation({ summary: 'Get real-time stats — WebSocket connections, push analytics (admin only)' })
  async getRealTimeStats() {
    return this.adminService.getRealTimeStats();
  }

  @Get('stats/offline')
  @ApiOperation({ summary: 'Get offline sync stats (admin only)' })
  async getOfflineStats() {
    return this.adminService.getOfflineStats();
  }
}
