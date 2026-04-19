import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BusinessUser } from './entities/business-user.entity';
import { VenueAnalytics } from './entities/venue-analytics.entity';
import { Venue } from '../venues/entities/venue.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Redemption } from '../offers/entities/redemption.entity';
import { Busyness } from '../busyness/entities/busyness.entity';
import { Vibe } from '../vibes/entities/vibe.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { ActivityLog } from '../audit/entities/activity-log.entity';
import { BusynessLevel, BusynessPercentageMap, VenueCategory, NotificationType, ErrorCode } from '../../common/enums';
import { BusinessRegisterDto } from './dto';
import { PushService } from '../push/push.service';
import { LiveGateway } from '../live/live.gateway';
import { getBusynessColor } from '../../common/utils/distance.util';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessUser)
    private businessUsersRepository: Repository<BusinessUser>,
    @InjectRepository(VenueAnalytics)
    private venueAnalyticsRepository: Repository<VenueAnalytics>,
    @InjectRepository(Venue)
    private venuesRepository: Repository<Venue>,
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    @InjectRepository(Redemption)
    private redemptionsRepository: Repository<Redemption>,
    @InjectRepository(Busyness)
    private busynessRepository: Repository<Busyness>,
    @InjectRepository(Vibe)
    private vibesRepository: Repository<Vibe>,
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ActivityLog)
    private activityLogsRepository: Repository<ActivityLog>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private pushService: PushService,
    private liveGateway: LiveGateway,
  ) {}

  // ─── AUTH ──────────────────────────────────────────────

  async login(email: string, password: string) {
    const businessUser = await this.businessUsersRepository.findOne({
      where: { email },
      relations: ['venue'],
    });

    if (!businessUser || !(await bcrypt.compare(password, businessUser.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!businessUser.isApproved) {
      throw new ForbiddenException('Your account is pending approval');
    }

    if (!businessUser.isActive) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    const tokens = await this.generateTokens(businessUser);

    // Log activity
    await this.logActivity(businessUser.id, 'business', 'BUSINESS_LOGIN', 'business_user', businessUser.id);

    return {
      user: {
        id: businessUser.id,
        email: businessUser.email,
        name: businessUser.name,
        role: 'business',
        venue: businessUser.venue
          ? {
              id: businessUser.venue.id,
              name: businessUser.venue.name,
              address: businessUser.venue.address,
            }
          : null,
      },
      tokens,
    };
  }

  async register(dto: BusinessRegisterDto) {
    const existing = await this.businessUsersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Create the venue first
    const venue = this.venuesRepository.create({
      name: dto.venueName,
      address: dto.venueAddress,
      city: 'Manchester',
      area: dto.venueAddress.split(',').pop()?.trim() || 'Manchester',
      category: (dto.venueCategory as VenueCategory) || VenueCategory.BAR,
      lat: 53.4808,
      lng: -2.2426,
      priceLevel: 2,
      openingHours: '18:00',
      closingTime: '02:00',
      isLive: false,
      tags: [],
      rating: 0,
    });
    const savedVenue = await this.venuesRepository.save(venue);

    // Create busyness + vibe records for the new venue
    const busyness = this.busynessRepository.create({
      venueId: savedVenue.id,
      level: BusynessLevel.QUIET,
      percentage: 25,
    });
    await this.busynessRepository.save(busyness);

    const vibe = this.vibesRepository.create({
      venueId: savedVenue.id,
      tags: [],
      musicGenre: [],
    });
    await this.vibesRepository.save(vibe);

    // Create business user
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const businessUser = this.businessUsersRepository.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      venueId: savedVenue.id,
      phone: dto.phone,
      isApproved: true, // MVP: auto-approve
    });
    await this.businessUsersRepository.save(businessUser);

    return {
      success: true,
      message: 'Business registered and approved. You can now log in.',
      status: 'approved',
    };
  }

  async forgotPassword(email: string) {
    const businessUser = await this.businessUsersRepository.findOne({ where: { email } });
    if (!businessUser) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = this.jwtService.sign(
      { sub: businessUser.id, type: 'business-password-reset' },
      {
        secret: this.configService.get<string>('app.jwt.secret'),
        expiresIn: '15m',
      },
    );

    return {
      message: 'If the email exists, a reset link has been sent.',
      resetToken, // DEV ONLY
    };
  }

  // ─── DASHBOARD ─────────────────────────────────────────

  async getDashboard(venueId: string, businessUserId: string) {
    await this.verifyOwnership(venueId, businessUserId);

    const venue = await this.venuesRepository.findOne({
      where: { id: venueId },
      relations: ['busyness', 'vibe'],
    });
    if (!venue) throw new NotFoundException('Venue not found');

    const analytics = await this.getTodayAnalytics(venueId);
    const busynessChange = await this.calculateBusynessChange(venueId, venue.busyness?.percentage || 0);

    // Count active users who saved this venue
    const savedByUsers = await this.usersRepository
      .createQueryBuilder('user')
      .where(':venueId = ANY(user.savedVenues)', { venueId })
      .getCount();

    return {
      venue: {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        openUntil: venue.closingTime || '2:00 AM',
        isLive: this.isVenueLive(venue),
        isVerified: true,
      },
      stats: {
        liveBusyness: {
          percentage: venue.busyness?.percentage || 0,
          change: busynessChange,
          level: venue.busyness?.level || 'quiet',
        },
        avgDwellTime: {
          minutes: analytics?.avgDwellTime || 0,
          change: analytics?.dwellTimeChange || '→',
          comparedTo: 'yesterday average',
        },
      },
      vibeStatus: {
        label: venue.vibe?.tags?.[0] || 'No vibe set',
        description: venue.vibe?.description || '',
        tags: venue.vibe?.tags || [],
        activeUsers: savedByUsers,
      },
      engagement: {
        vibeChecks: {
          score: Number(venue.vibe?.vibeCheckScore) || 0,
          responses: venue.vibe?.responseCount || 0,
          period: 'last 30m',
          trend: (Number(venue.vibe?.vibeCheckScore) || 0) >= 4.0 ? 'STRONG' : 'MODERATE',
        },
        socialShares: {
          count: analytics?.socialShares || 0,
          sources: 'Instagram & REKI feed',
          change: analytics?.socialSharesChange || '→',
        },
      },
      weather: this.getMockWeather(),
    };
  }

  // ─── ANALYTICS ─────────────────────────────────────────

  async getAnalytics(venueId: string, businessUserId: string, period?: string) {
    await this.verifyOwnership(venueId, businessUserId);

    const analytics = await this.getTodayAnalytics(venueId);

    return {
      views: { total: analytics?.totalViews || 0, change: '+15%' },
      saves: { total: analytics?.totalSaves || 0, change: '+8%' },
      offerClicks: { total: analytics?.offerClicks || 0, change: '+22%' },
      redemptions: { total: analytics?.redemptions || 0, change: '+5%' },
    };
  }

  // ─── VENUE STATUS ──────────────────────────────────────

  async updateVenueStatus(
    venueId: string,
    businessUserId: string,
    busynessLevel: BusynessLevel,
    vibes?: string[],
  ) {
    await this.verifyOwnership(venueId, businessUserId);

    const percentage = BusynessPercentageMap[busynessLevel];

    // Update busyness
    let busyness = await this.busynessRepository.findOne({ where: { venueId } });
    if (!busyness) {
      busyness = this.busynessRepository.create({ venueId });
    }
    busyness.level = busynessLevel;
    busyness.percentage = percentage;
    busyness.updatedBy = businessUserId;
    await this.busynessRepository.save(busyness);

    // Update vibes if provided
    if (vibes) {
      let vibe = await this.vibesRepository.findOne({ where: { venueId } });
      const previousTags = vibe?.tags || [];
      if (!vibe) {
        vibe = this.vibesRepository.create({ venueId });
      }
      vibe.tags = vibes;
      vibe.updatedBy = businessUserId;
      await this.vibesRepository.save(vibe);

      // Detect new "Live Music" tag → trigger live performance notification
      const liveTagAdded = vibes.some((v) => v.toLowerCase().includes('live music'))
        && !previousTags.some((t) => t.toLowerCase().includes('live music'));
      if (liveTagAdded) {
        await this.triggerLivePerformanceAlert(venueId);
      }
    }

    // Log activity
    await this.logActivity(businessUserId, 'business', 'STATUS_UPDATE', 'venue', venueId, {
      busyness: busynessLevel,
      percentage,
      vibes,
    });

    // Trigger vibe alert if busyness >= 80%
    if (percentage >= 80) {
      await this.triggerVibeAlert(venueId);
    }

    // ── WEEK 9: Broadcast real-time updates ──
    const venue = await this.venuesRepository.findOne({ where: { id: venueId } });
    const city = venue?.city?.toLowerCase() || 'manchester';
    const ragColor = getBusynessColor(percentage);
    this.liveGateway.broadcastBusynessUpdate(city, venueId, {
      level: busynessLevel,
      percentage,
      ragColor,
      vibeTags: vibes,
    });

    return {
      success: true,
      message: 'Status updated! Updates are shared with REKI community.',
      venue: {
        busyness: { level: busynessLevel, percentage },
        vibe: { tags: vibes || [] },
      },
    };
  }

  async getVenueStatus(venueId: string, businessUserId: string) {
    await this.verifyOwnership(venueId, businessUserId);

    const busyness = await this.busynessRepository.findOne({ where: { venueId } });
    const vibe = await this.vibesRepository.findOne({ where: { venueId } });

    return {
      busyness: {
        level: busyness?.level || 'quiet',
        percentage: busyness?.percentage || 0,
        lastUpdated: busyness?.lastUpdated || null,
      },
      vibe: {
        tags: vibe?.tags || [],
        musicGenre: vibe?.musicGenre || [],
        lastUpdated: vibe?.lastUpdated || null,
      },
    };
  }

  // ─── OFFERS ────────────────────────────────────────────

  async getVenueOffers(venueId: string, businessUserId: string, page = 1, limit = 20) {
    await this.verifyOwnership(venueId, businessUserId);

    const [offers, total] = await this.offersRepository.findAndCount({
      where: { venueId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const activeDeals = offers
      .filter((o) => o.isActive)
      .map((o) => ({
        id: o.id,
        title: o.title,
        schedule: this.formatSchedule(o),
        redemptionCount: o.redemptionCount,
        isActive: true,
      }));

    const upcomingAndPast = offers
      .filter((o) => !o.isActive)
      .map((o) => ({
        id: o.id,
        title: o.title,
        schedule: this.formatSchedule(o),
        statusLabel: o.expiresAt && new Date(o.expiresAt) < new Date() ? 'Expired' : 'Currently disabled',
        isActive: false,
      }));

    return {
      activeDeals,
      upcomingAndPast,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async createOffer(
    venueId: string,
    businessUserId: string,
    data: Partial<Offer>,
  ) {
    await this.verifyOwnership(venueId, businessUserId);

    const offer = this.offersRepository.create({
      ...data,
      venueId,
      isActive: true,
      redemptionCount: 0,
    });
    const saved = await this.offersRepository.save(offer);

    // Log activity
    await this.logActivity(businessUserId, 'business', 'OFFER_CREATED', 'offer', saved.id, {
      title: saved.title,
      venueId,
    });

    // Notify users who saved this venue
    const venueName = (await this.venuesRepository.findOne({ where: { id: venueId } }))?.name || 'Venue';
    await this.notifySavedUsers(venueId, {
      type: NotificationType.OFFER_CONFIRMATION,
      title: `New offer at ${venueName}!`,
      message: saved.title,
      offerId: saved.id,
    });

    // ── WEEK 9: Broadcast new offer to city feed ──
    const offerVenue = await this.venuesRepository.findOne({ where: { id: venueId } });
    const city = offerVenue?.city?.toLowerCase() || 'manchester';
    this.liveGateway.broadcastNewOffer(city, venueId, {
      venueName,
      title: saved.title,
    });

    return { success: true, offer: saved };
  }

  async updateOffer(offerId: string, businessUserId: string, data: Partial<Offer>) {
    const offer = await this.offersRepository.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');

    await this.verifyOwnership(offer.venueId, businessUserId);

    Object.assign(offer, data);
    const saved = await this.offersRepository.save(offer);

    return { success: true, offer: saved };
  }

  async toggleOffer(offerId: string, businessUserId: string, isActive: boolean) {
    const offer = await this.offersRepository.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');

    await this.verifyOwnership(offer.venueId, businessUserId);

    offer.isActive = isActive;
    const saved = await this.offersRepository.save(offer);

    return { success: true, offer: { id: saved.id, isActive: saved.isActive } };
  }

  async deleteOffer(offerId: string, businessUserId: string) {
    const offer = await this.offersRepository.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');

    await this.verifyOwnership(offer.venueId, businessUserId);

    // Soft delete — mark as inactive + set expiresAt to now
    offer.isActive = false;
    offer.expiresAt = new Date();
    await this.offersRepository.save(offer);

    return { success: true, message: 'Offer deleted' };
  }

  // ─── HELPERS ───────────────────────────────────────────

  private async generateTokens(businessUser: BusinessUser) {
    const payload = { sub: businessUser.id, email: businessUser.email, role: 'business', venueId: businessUser.venueId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.secret'),
      expiresIn: this.configService.get<string>('app.jwt.expiration') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('app.jwt.refreshExpiration') as any,
    });

    return { accessToken, refreshToken };
  }

  private async verifyOwnership(venueId: string, businessUserId: string) {
    const businessUser = await this.businessUsersRepository.findOne({
      where: { id: businessUserId },
    });

    if (!businessUser || businessUser.venueId !== venueId) {
      throw new ForbiddenException({
        code: ErrorCode.VENUE_NOT_OWNED,
        message: "You don't have permission to manage this venue",
      });
    }
  }

  private async getTodayAnalytics(venueId: string): Promise<VenueAnalytics | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.venueAnalyticsRepository.findOne({
      where: { venueId, date: today },
    });
  }

  async calculateBusynessChange(venueId: string, currentPercent: number): Promise<string> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayAnalytics = await this.venueAnalyticsRepository.findOne({
      where: { venueId, date: yesterdayStr },
    });

    if (!yesterdayAnalytics) return '→';

    const diff = currentPercent - yesterdayAnalytics.liveBusynessPercent;
    if (diff > 0) return `+${diff}%`;
    if (diff < 0) return `${diff}%`;
    return '→';
  }

  private isVenueLive(venue: Venue): boolean {
    if (!venue.openingHours || !venue.closingTime) return false;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (venue.openingHours > venue.closingTime) {
      return currentTime >= venue.openingHours || currentTime <= venue.closingTime;
    }
    return currentTime >= venue.openingHours && currentTime <= venue.closingTime;
  }

  private getMockWeather() {
    return {
      message: 'Manchester Weather: Heavy rain expected at 11 PM. Historical data suggests +15% dwell time increase.',
      icon: 'rain',
      temperature: 8,
      condition: 'Overcast',
    };
  }

  private formatSchedule(offer: Offer): string {
    if (!offer.validDays || offer.validDays.length === 0) return 'Anytime';
    if (offer.validDays.length === 7) return `Daily, ${offer.validTimeStart}-${offer.validTimeEnd}`;
    return `${offer.validDays.join(', ')}, ${offer.validTimeStart}-${offer.validTimeEnd}`;
  }

  private async triggerVibeAlert(venueId: string) {
    const venue = await this.venuesRepository.findOne({ where: { id: venueId } });
    if (!venue) return;

    // Find users who saved this venue
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where(':venueId = ANY(user.savedVenues)', { venueId })
      .getMany();

    const notifications = users.map((user) =>
      this.notificationsRepository.create({
        userId: user.id,
        type: NotificationType.VIBE_ALERT,
        title: `${venue.name} is peaking!`,
        message: `🔥 High Vibe Alert\n80%+ capacity reached. Grab your spot!`,
        icon: 'fire',
        venueId,
      }),
    );

    if (notifications.length > 0) {
      await this.notificationsRepository.save(notifications);

      // ── WEEK 9: Send push notifications to saved users ──
      await this.pushService.sendToUsers(
        users.map((u) => u.id),
        NotificationType.VIBE_ALERT,
        {
          title: `🔥 ${venue.name} is peaking!`,
          body: '80%+ capacity reached. Grab your spot!',
          data: { type: 'VIBE_ALERT', venueId, deepLink: `reki://venue/${venueId}` },
        },
      );
    }
  }

  /**
   * Trigger live performance notification when "Live Music" tag is newly added.
   */
  private async triggerLivePerformanceAlert(venueId: string) {
    const venue = await this.venuesRepository.findOne({ where: { id: venueId } });
    if (!venue) return;

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where(':venueId = ANY(user.savedVenues)', { venueId })
      .getMany();

    const notifications = users.map((user) =>
      this.notificationsRepository.create({
        userId: user.id,
        type: NotificationType.LIVE_PERFORMANCE,
        title: `Live at ${venue.name}!`,
        message: `🎵 New live set starting soon. Head down for the best spot!`,
        icon: '🎵',
        venueId,
      }),
    );

    if (notifications.length > 0) {
      await this.notificationsRepository.save(notifications);
    }
  }

  private async notifySavedUsers(
    venueId: string,
    data: { type: NotificationType; title: string; message: string; offerId?: string },
  ) {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where(':venueId = ANY(user.savedVenues)', { venueId })
      .getMany();

    const notifications = users.map((user) =>
      this.notificationsRepository.create({
        userId: user.id,
        type: data.type,
        title: data.title,
        message: data.message,
        venueId,
        offerId: data.offerId,
      }),
    );

    if (notifications.length > 0) {
      await this.notificationsRepository.save(notifications);
    }
  }

  private async logActivity(
    actorId: string,
    actorRole: string,
    action: string,
    target: string,
    targetId?: string,
    details?: Record<string, unknown>,
  ) {
    const log = this.activityLogsRepository.create({
      actorId,
      actorRole,
      action,
      target,
      targetId,
      details,
    });
    await this.activityLogsRepository.save(log);
  }

  async findBusinessUserById(id: string): Promise<BusinessUser | null> {
    return this.businessUsersRepository.findOne({
      where: { id },
      relations: ['venue'],
    });
  }

  async findBusinessUserByEmail(email: string): Promise<BusinessUser | null> {
    return this.businessUsersRepository.findOne({
      where: { email },
      relations: ['venue'],
    });
  }
}
