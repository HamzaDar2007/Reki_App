import {
  Controller,
  Post,
  Delete,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto, UpdateNotificationPreferencesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Devices')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('devices/register')
  @ApiOperation({ summary: 'Register device for push notifications' })
  async registerDevice(@Request() req, @Body() dto: RegisterDeviceDto) {
    const device = await this.devicesService.registerDevice(req.user.id, dto);
    return { success: true, deviceId: device.id };
  }

  @Delete('devices/:deviceId')
  @ApiOperation({ summary: 'Deactivate device (on logout)' })
  async deactivateDevice(@Request() req, @Param('deviceId') deviceId: string) {
    await this.devicesService.deactivateDevice(deviceId, req.user.id);
    return { success: true };
  }

  @Get('users/notification-preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Request() req) {
    return this.devicesService.getPreferences(req.user.id);
  }

  @Put('users/notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences (6 types + quiet hours)' })
  async updatePreferences(
    @Request() req,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.devicesService.updatePreferences(req.user.id, dto);
  }
}
