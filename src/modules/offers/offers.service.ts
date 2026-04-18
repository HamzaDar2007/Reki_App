import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { Redemption } from './entities/redemption.entity';
import { OfferStatus, RedemptionStatus } from '../../common/enums';
import { generateVoucherCode, generateTransactionId } from '../../common/utils/generators.util';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    @InjectRepository(Redemption)
    private redemptionsRepository: Repository<Redemption>,
  ) {}

  async findById(id: string): Promise<Offer | null> {
    return this.offersRepository.findOne({ where: { id }, relations: ['venue'] });
  }

  async findByVenueId(venueId: string): Promise<Offer[]> {
    return this.offersRepository.find({ where: { venueId } });
  }

  /**
   * Get available offers for a venue (active + valid right now).
   */
  async findAvailableByVenueId(venueId: string): Promise<Offer[]> {
    const offers = await this.offersRepository.find({
      where: { venueId, isActive: true },
    });
    return offers.filter((offer) => this.isOfferAvailableNow(offer));
  }

  /**
   * Check if an offer is currently available based on all rules:
   * 1. isActive must be true
   * 2. Current day must be in validDays
   * 3. Current time must be between validTimeStart and validTimeEnd
   * 4. redemptionCount < maxRedemptions
   * 5. Current date < expiresAt (if set)
   */
  isOfferAvailableNow(offer: Offer): boolean {
    const now = new Date();

    // Rule 1: must be active
    if (!offer.isActive) return false;

    // Rule 2: check valid day
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = days[now.getDay()];
    if (offer.validDays && offer.validDays.length > 0 && !offer.validDays.includes(today)) {
      return false;
    }

    // Rule 3: check valid time window
    if (offer.validTimeStart && offer.validTimeEnd) {
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Handle overnight offers (e.g., 22:00 - 02:00)
      if (offer.validTimeStart > offer.validTimeEnd) {
        if (currentTime < offer.validTimeStart && currentTime > offer.validTimeEnd) {
          return false;
        }
      } else {
        if (currentTime < offer.validTimeStart || currentTime > offer.validTimeEnd) {
          return false;
        }
      }
    }

    // Rule 4: max redemptions not reached
    if (offer.redemptionCount >= offer.maxRedemptions) return false;

    // Rule 5: not expired
    if (offer.expiresAt && now > new Date(offer.expiresAt)) return false;

    return true;
  }

  /**
   * Determine offer status:
   * - active: isActive=true AND within valid dates/times
   * - inactive: isActive=false (toggled off)
   * - expired: expiresAt < now
   * - upcoming: validTimeStart > current time (today&#39;s schedule not yet started)
   */
  getOfferStatus(offer: Offer): OfferStatus {
    const now = new Date();

    if (!offer.isActive) return OfferStatus.INACTIVE;

    if (offer.expiresAt && now > new Date(offer.expiresAt)) return OfferStatus.EXPIRED;

    if (offer.redemptionCount >= offer.maxRedemptions) return OfferStatus.EXPIRED;

    if (offer.validTimeStart) {
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      // Check if today is a valid day
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = days[now.getDay()];
      const isValidDay = !offer.validDays || offer.validDays.length === 0 || offer.validDays.includes(today);

      if (isValidDay && currentTime < offer.validTimeStart) {
        return OfferStatus.UPCOMING;
      }
    }

    if (this.isOfferAvailableNow(offer)) return OfferStatus.ACTIVE;

    return OfferStatus.INACTIVE;
  }

  /**
   * Calculate saving value based on offer type.
   */
  calculateSaving(offer: Offer): number {
    return offer.savingValue ? Number(offer.savingValue) : 0;
  }

  /**
   * Claim an offer — create a redemption with voucher code.
   */
  async claimOffer(offerId: string, userId: string, venueId: string): Promise<Redemption> {
    const redemption = this.redemptionsRepository.create({
      offerId,
      userId,
      venueId,
      voucherCode: generateVoucherCode(),
      qrCodeData: JSON.stringify({ offerId, userId, timestamp: Date.now() }),
      status: RedemptionStatus.ACTIVE,
      transactionId: generateTransactionId(),
      savingValue: 0, // will be set on redeem
    });

    return this.redemptionsRepository.save(redemption);
  }

  /**
   * Find an active (unredeemed) claim by user for a specific offer.
   */
  async findActiveClaimByUser(offerId: string, userId: string): Promise<Redemption | null> {
    return this.redemptionsRepository.findOne({
      where: { offerId, userId, status: RedemptionStatus.ACTIVE },
    });
  }

  /**
   * Find a claim by voucher code.
   */
  async findClaimByVoucherCode(voucherCode: string): Promise<Redemption | null> {
    return this.redemptionsRepository.findOne({
      where: { voucherCode },
      relations: ['offer'],
    });
  }

  /**
   * Redeem a claimed offer.
   */
  async redeemOffer(redemptionId: string, savingValue: number): Promise<Redemption> {
    const redemption = await this.redemptionsRepository.findOne({
      where: { id: redemptionId },
    });

    if (!redemption) throw new Error('Redemption not found');

    redemption.status = RedemptionStatus.REDEEMED;
    redemption.redeemedAt = new Date();
    redemption.savingValue = savingValue;

    // Increment offer redemption count
    await this.offersRepository.increment({ id: redemption.offerId }, 'redemptionCount', 1);

    return this.redemptionsRepository.save(redemption);
  }
}
