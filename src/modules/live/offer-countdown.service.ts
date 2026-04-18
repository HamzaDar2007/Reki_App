import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../offers/entities/offer.entity';
import { LiveGateway } from './live.gateway';

@Injectable()
export class OfferCountdownService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OfferCountdownService.name);
  private countdownInterval: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
    private readonly liveGateway: LiveGateway,
  ) {}

  onModuleInit() {
    // Check offer countdowns every 60 seconds
    this.countdownInterval = setInterval(() => this.checkOfferCountdowns(), 60000);
    this.logger.log('Offer countdown service started (checking every 60s)');
  }

  onModuleDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private async checkOfferCountdowns(): Promise<void> {
    try {
      const activeOffers = await this.offerRepository.find({
        where: { isActive: true },
        relations: ['venue'],
      });

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      for (const offer of activeOffers) {
        if (!offer.validTimeEnd || !offer.venue) continue;

        // Parse validTimeEnd (format: "HH:mm" or "23:00")
        const [endHour, endMin] = offer.validTimeEnd.split(':').map(Number);
        if (isNaN(endHour) || isNaN(endMin)) continue;

        const endTotalMin = endHour * 60 + endMin;
        const currentTotalMin = currentHours * 60 + currentMinutes;
        const remaining = endTotalMin - currentTotalMin;

        // Only broadcast at specific thresholds
        if (remaining === 30 || remaining === 15 || (remaining <= 5 && remaining > 0)) {
          this.liveGateway.broadcastOfferCountdown(offer.venueId, {
            offerId: offer.id,
            remainingMinutes: remaining,
            isUrgent: remaining <= 15,
          });
        }

        if (remaining <= 0 && remaining > -2) {
          // Just expired
          this.liveGateway.broadcastOfferExpired(offer.venueId, offer.id);
        }
      }
    } catch (error) {
      this.logger.error('Offer countdown check failed', error);
    }
  }
}
