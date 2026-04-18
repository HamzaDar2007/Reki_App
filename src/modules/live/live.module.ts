import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveGateway } from './live.gateway';
import { LiveController } from './live.controller';
import { OfferCountdownService } from './offer-countdown.service';
import { Offer } from '../offers/entities/offer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offer])],
  controllers: [LiveController],
  providers: [LiveGateway, OfferCountdownService],
  exports: [LiveGateway],
})
export class LiveModule {}
