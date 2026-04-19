import { Controller, Get, Post, Param, Body, UseGuards, NotFoundException, BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { JwtAuthGuard } from '../auth/guards';
import { NoGuestGuard } from '../../common/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../users/entities/user.entity';
import { ErrorCode } from '../../common/enums';
import { CacheTTL, NoCache } from '../../common/interceptors/cache-headers.interceptor';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get(':id')
  @CacheTTL(120)
  @ApiOperation({ summary: 'Get offer detail by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const offer = await this.offersService.findById(id);
    if (!offer) {
      throw new NotFoundException({ code: ErrorCode.OFFER_NOT_FOUND, message: 'Offer not found' });
    }

    const status = this.offersService.getOfferStatus(offer);

    return {
      offer: {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        type: offer.type,
        venue: offer.venue
          ? { name: offer.venue.name, address: `${offer.venue.area}, ${offer.venue.city}` }
          : null,
        validDays: offer.validDays,
        validTimeStart: offer.validTimeStart,
        validTimeEnd: offer.validTimeEnd,
        savingValue: Number(offer.savingValue) || 0,
        currency: 'GBP',
        status,
        isActive: offer.isActive,
        isAvailableNow: this.offersService.isOfferAvailableNow(offer),
        expiresAt: offer.expiresAt,
      },
    };
  }

  @Post(':id/claim')
  @NoCache()
  @UseGuards(JwtAuthGuard, NoGuestGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim offer — generates voucher code + QR' })
  async claim(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const offer = await this.offersService.findById(id);
    if (!offer) {
      throw new NotFoundException({ code: ErrorCode.OFFER_NOT_FOUND, message: 'Offer not found' });
    }

    if (!this.offersService.isOfferAvailableNow(offer)) {
      throw new BadRequestException({ code: ErrorCode.OFFER_NOT_VALID_NOW, message: 'This offer is not available right now' });
    }

    // Check if user already has an active claim for this offer today
    const existingClaim = await this.offersService.findActiveClaimByUser(id, user.id);
    if (existingClaim) {
      return {
        voucherCode: existingClaim.voucherCode,
        qrCodeData: existingClaim.qrCodeData,
        transactionId: existingClaim.transactionId,
        status: existingClaim.status,
        message: 'You already have an active claim for this offer',
      };
    }

    const redemption = await this.offersService.claimOffer(id, user.id, offer.venueId);

    return {
      voucherCode: redemption.voucherCode,
      qrCodeData: redemption.qrCodeData,
      transactionId: redemption.transactionId,
      status: redemption.status,
    };
  }

  @Post(':id/redeem')
  @NoCache()
  @UseGuards(JwtAuthGuard, NoGuestGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem a claimed offer' })
  async redeem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { voucherCode: string },
    @CurrentUser() user: User,
  ) {
    const offer = await this.offersService.findById(id);
    if (!offer) {
      throw new NotFoundException({ code: ErrorCode.OFFER_NOT_FOUND, message: 'Offer not found' });
    }

    // Find the claim by voucher code
    const claim = await this.offersService.findClaimByVoucherCode(body.voucherCode);
    if (!claim) {
      throw new NotFoundException({ code: ErrorCode.OFFER_NOT_FOUND, message: 'Invalid voucher code' });
    }

    if (claim.userId !== user.id) {
      throw new BadRequestException({ code: ErrorCode.FORBIDDEN, message: 'This voucher does not belong to you' });
    }

    if (claim.status === 'redeemed') {
      throw new BadRequestException({
        code: ErrorCode.ALREADY_REDEEMED,
        message: "You've already redeemed this offer tonight.",
      });
    }

    const savingValue = this.offersService.calculateSaving(offer);
    const redeemed = await this.offersService.redeemOffer(claim.id, savingValue);

    return {
      status: 'redeemed',
      venueName: offer.venue?.name,
      offerTitle: offer.title,
      transactionId: redeemed.transactionId,
      redeemedAt: redeemed.redeemedAt,
      savingValue: Number(redeemed.savingValue),
      currency: redeemed.currency,
    };
  }

  @Post(':id/wallet-pass')
  @UseGuards(JwtAuthGuard, NoGuestGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Apple Wallet pass for claimed offer' })
  async walletPass(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    // Apple Wallet .pkpass generation requires Apple Developer certs
    // Returning pass data structure that can be used when certs are configured
    const offer = await this.offersService.findById(id);
    if (!offer) {
      throw new NotFoundException({ code: ErrorCode.OFFER_NOT_FOUND, message: 'Offer not found' });
    }

    const claim = await this.offersService.findActiveClaimByUser(id, user.id);
    if (!claim) {
      throw new BadRequestException('You must claim this offer first');
    }

    return {
      passType: 'coupon',
      headerField: offer.venue?.name || 'REKI Venue',
      primaryField: offer.title,
      secondaryField: `Valid: ${offer.validTimeStart} - ${offer.validTimeEnd}`,
      auxiliaryField: claim.voucherCode,
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: `reki://offer/${id}/${claim.voucherCode}`,
      },
      expiresAt: offer.expiresAt,
      location: offer.venue
        ? { lat: offer.venue.lat, lng: offer.venue.lng }
        : null,
      message: 'Apple Wallet .pkpass generation requires Apple Developer certificates. Pass data returned for integration.',
    };
  }
}
