import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { Venue } from './entities/venue.entity';
import { VenueAnalytics } from '../business/entities/venue-analytics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Venue, VenueAnalytics])],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
