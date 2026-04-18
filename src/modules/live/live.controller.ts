import { Controller, Sse, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Observable, interval, map } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards';
import { LiveGateway } from './live.gateway';

interface MessageEvent {
  data: string | object;
  type?: string;
}

@ApiTags('Live')
@ApiBearerAuth()
@Controller('live')
@UseGuards(JwtAuthGuard)
export class LiveController {
  constructor(private readonly liveGateway: LiveGateway) {}

  @Sse('feed')
  @ApiOperation({ summary: 'SSE fallback: live feed updates (heartbeat every 30s)' })
  @ApiQuery({ name: 'city', required: false, example: 'manchester' })
  feedStream(@Query('city') city?: string): Observable<MessageEvent> {
    // SSE fallback: sends heartbeat every 30 seconds
    // Real data pushed via WebSocket; this is the polling fallback
    return interval(30000).pipe(
      map(() => ({
        data: JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          city: city || 'manchester',
        }),
      })),
    );
  }

  @Sse('venue/:venueId')
  @ApiOperation({ summary: 'SSE fallback: live venue detail updates' })
  venueStream(@Param('venueId') venueId: string): Observable<MessageEvent> {
    return interval(30000).pipe(
      map(() => ({
        data: JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          venueId,
          currentlyViewing: this.liveGateway.getVenueViewerCount(venueId),
        }),
      })),
    );
  }

  @Sse('map')
  @ApiOperation({ summary: 'SSE fallback: live map marker updates' })
  @ApiQuery({ name: 'city', required: false, example: 'manchester' })
  mapStream(@Query('city') city?: string): Observable<MessageEvent> {
    return interval(30000).pipe(
      map(() => ({
        data: JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          city: city || 'manchester',
        }),
      })),
    );
  }
}
