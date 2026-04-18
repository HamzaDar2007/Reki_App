import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BusinessService } from './business.service';
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
import { BusynessLevel } from '../../common/enums';
import { PushService } from '../push/push.service';
import { LiveGateway } from '../live/live.gateway';

describe('BusinessService', () => {
  let service: BusinessService;
  let bizUsersRepo: Record<string, jest.Mock>;
  let analyticsRepo: Record<string, jest.Mock>;
  let venuesRepo: Record<string, jest.Mock>;
  let offersRepo: Record<string, jest.Mock>;
  let redemptionsRepo: Record<string, jest.Mock>;
  let busynessRepo: Record<string, jest.Mock>;
  let vibesRepo: Record<string, jest.Mock>;
  let notificationsRepo: Record<string, jest.Mock>;
  let usersRepo: Record<string, jest.Mock>;
  let activityLogsRepo: Record<string, jest.Mock>;
  let jwtService: Record<string, jest.Mock>;
  let configService: Record<string, jest.Mock>;

  const mockBizUser = {
    id: 'biz-1',
    email: 'manager@alberts.com',
    name: 'John Smith',
    password: '$2b$10$hashed',
    venueId: 'venue-1',
    isApproved: true,
    isActive: true,
    venue: { id: 'venue-1', name: "Albert's Schloss", address: '27 Peter Street' },
  };

  const mockVenue = {
    id: 'venue-1',
    name: "Albert's Schloss",
    address: '27 Peter Street',
    openingHours: '12:00',
    closingTime: '02:00',
    isVerified: true,
    busyness: { level: 'busy', percentage: 85 },
    vibe: { tags: ['Party', 'Live Music'], musicGenre: ['House'] },
  };

  beforeEach(async () => {
    const mockUsersQB = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    bizUsersRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    analyticsRepo = { findOne: jest.fn(), find: jest.fn() };
    venuesRepo = { findOne: jest.fn(), count: jest.fn(), create: jest.fn(), save: jest.fn() };
    offersRepo = { findOne: jest.fn(), find: jest.fn(), findAndCount: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn() };
    redemptionsRepo = { find: jest.fn(), createQueryBuilder: jest.fn() };
    busynessRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    vibesRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    notificationsRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
    usersRepo = { find: jest.fn(), create: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn().mockReturnValue(mockUsersQB) };
    activityLogsRepo = { create: jest.fn(), save: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('biz-token') };
    configService = { get: jest.fn().mockReturnValue('test-secret') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: getRepositoryToken(BusinessUser), useValue: bizUsersRepo },
        { provide: getRepositoryToken(VenueAnalytics), useValue: analyticsRepo },
        { provide: getRepositoryToken(Venue), useValue: venuesRepo },
        { provide: getRepositoryToken(Offer), useValue: offersRepo },
        { provide: getRepositoryToken(Redemption), useValue: redemptionsRepo },
        { provide: getRepositoryToken(Busyness), useValue: busynessRepo },
        { provide: getRepositoryToken(Vibe), useValue: vibesRepo },
        { provide: getRepositoryToken(Notification), useValue: notificationsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(ActivityLog), useValue: activityLogsRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: PushService, useValue: { sendToUser: jest.fn().mockResolvedValue({ sent: true }), sendToUsers: jest.fn().mockResolvedValue({ totalUsers: 0, sent: 0, skipped: 0 }) } },
        { provide: LiveGateway, useValue: { broadcastBusynessUpdate: jest.fn(), broadcastVibeUpdate: jest.fn(), broadcastNewOffer: jest.fn(), broadcastNewRedemption: jest.fn(), broadcastNewSave: jest.fn() } },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
  });

  describe('login', () => {
    it('should return user + tokens for valid credentials', async () => {
      const hashed = await bcrypt.hash('business123', 10);
      bizUsersRepo.findOne.mockResolvedValue({ ...mockBizUser, password: hashed });
      activityLogsRepo.create.mockReturnValue({});
      activityLogsRepo.save.mockResolvedValue({});

      const result = await service.login('manager@alberts.com', 'business123');
      expect(result.user.email).toBe('manager@alberts.com');
      expect(result.user.role).toBe('business');
      expect(result.user.venue.name).toBe("Albert's Schloss");
      expect(result.tokens.accessToken).toBe('biz-token');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      bizUsersRepo.findOne.mockResolvedValue(null);
      await expect(service.login('bad@email.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for unapproved account', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      bizUsersRepo.findOne.mockResolvedValue({ ...mockBizUser, password: hashed, isApproved: false });
      await expect(service.login('manager@alberts.com', 'pass')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for deactivated account', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      bizUsersRepo.findOne.mockResolvedValue({ ...mockBizUser, password: hashed, isActive: false });
      await expect(service.login('manager@alberts.com', 'pass')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('register', () => {
    it('should register new business and return pending status', async () => {
      bizUsersRepo.findOne.mockResolvedValue(null);
      bizUsersRepo.create.mockReturnValue({ id: 'new-biz' });
      bizUsersRepo.save.mockResolvedValue({ id: 'new-biz' });
      venuesRepo.findOne.mockResolvedValue(null);
      venuesRepo.create.mockReturnValue({ id: 'new-venue', name: 'New Bar' });
      venuesRepo.save.mockResolvedValue({ id: 'new-venue', name: 'New Bar' });
      activityLogsRepo.create.mockReturnValue({});
      activityLogsRepo.save.mockResolvedValue({});

      const result = await service.register({
        email: 'new@bar.com',
        password: 'Pass1234',
        name: 'New Owner',
        venueName: 'New Bar',
        venueAddress: '123 Test St',
        venueCategory: 'bar',
      });
      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
    });

    it('should throw ConflictException for duplicate email', async () => {
      bizUsersRepo.findOne.mockResolvedValue(mockBizUser);
      await expect(
        service.register({ email: 'manager@alberts.com', password: 'Pass1234', name: 'X', venueName: 'Y', venueAddress: 'Z', venueCategory: 'bar' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('forgotPassword', () => {
    it('should return reset token for existing business user', async () => {
      bizUsersRepo.findOne.mockResolvedValue(mockBizUser);
      const result = await service.forgotPassword('manager@alberts.com');
      expect(result.message).toContain('reset link');
      expect(result.resetToken).toBe('biz-token');
    });

    it('should return generic message for non-existing email', async () => {
      bizUsersRepo.findOne.mockResolvedValue(null);
      const result = await service.forgotPassword('nope@test.com');
      expect(result.message).toContain('reset link');
    });
  });

  describe('updateVenueStatus', () => {
    it('should update busyness and vibes', async () => {
      bizUsersRepo.findOne.mockResolvedValue(mockBizUser);
      venuesRepo.findOne.mockResolvedValue(mockVenue);
      busynessRepo.findOne.mockResolvedValue({ venueId: 'venue-1', level: 'quiet', percentage: 25 });
      busynessRepo.save.mockImplementation((b) => Promise.resolve(b));
      vibesRepo.findOne.mockResolvedValue({ venueId: 'venue-1', tags: [] });
      vibesRepo.save.mockImplementation((v) => Promise.resolve(v));
      activityLogsRepo.create.mockReturnValue({});
      activityLogsRepo.save.mockResolvedValue({});
      usersRepo.find.mockResolvedValue([]);
      notificationsRepo.create.mockReturnValue({});
      notificationsRepo.save.mockResolvedValue({});

      const result = await service.updateVenueStatus('venue-1', 'biz-1', BusynessLevel.BUSY, ['Party', 'High Energy']);
      expect(result.success).toBe(true);
      expect(result.venue.busyness.level).toBe(BusynessLevel.BUSY);
    });
  });

  describe('getVenueStatus', () => {
    it('should return current busyness and vibe', async () => {
      bizUsersRepo.findOne.mockResolvedValue(mockBizUser);
      busynessRepo.findOne.mockResolvedValue({ level: 'busy', percentage: 85, updatedAt: new Date() });
      vibesRepo.findOne.mockResolvedValue({ tags: ['Party'], musicGenre: ['House'], updatedAt: new Date() });

      const result = await service.getVenueStatus('venue-1', 'biz-1');
      expect(result.busyness.level).toBe('busy');
      expect(result.vibe.tags).toContain('Party');
    });
  });

  describe('getVenueOffers', () => {
    it('should return active and past offers', async () => {
      bizUsersRepo.findOne.mockResolvedValue(mockBizUser);
      offersRepo.findAndCount.mockResolvedValue([
        [
          { id: 'o-1', title: 'Happy Hour', isActive: true, validDays: ['Mon'], validTimeStart: '17:00', validTimeEnd: '19:00', redemptionCount: 5 },
          { id: 'o-2', title: 'Old Deal', isActive: false, validDays: [], redemptionCount: 0 },
        ],
        2,
      ]);

      const result = await service.getVenueOffers('venue-1', 'biz-1');
      expect(result.activeDeals).toBeDefined();
      expect(result.upcomingAndPast).toBeDefined();
    });
  });

  describe('createOffer', () => {
    it('should create a new offer and log activity', async () => {
      bizUsersRepo.findOne.mockResolvedValue(mockBizUser);
      offersRepo.create.mockReturnValue({ id: 'new-offer', title: 'Test Offer', venueId: 'venue-1' });
      offersRepo.save.mockResolvedValue({ id: 'new-offer', title: 'Test Offer', venueId: 'venue-1' });
      activityLogsRepo.create.mockReturnValue({});
      activityLogsRepo.save.mockResolvedValue({});
      usersRepo.find.mockResolvedValue([]);
      notificationsRepo.create.mockReturnValue({});
      notificationsRepo.save.mockResolvedValue({});

      const result = await service.createOffer('venue-1', 'biz-1', {
        title: 'Test Offer',
        description: 'Test desc',
        type: '2-for-1' as any,
        validDays: ['Fri', 'Sat'],
        validTimeStart: '20:00',
        validTimeEnd: '23:00',
      } as any);
      expect(result.success).toBe(true);
    });
  });

  describe('toggleOffer', () => {
    it('should toggle offer active status', async () => {
      bizUsersRepo.findOne.mockResolvedValue(mockBizUser);
      offersRepo.findOne.mockResolvedValue({ id: 'o-1', venueId: 'venue-1', isActive: true });
      offersRepo.save.mockImplementation((o) => Promise.resolve(o));
      activityLogsRepo.create.mockReturnValue({});
      activityLogsRepo.save.mockResolvedValue({});

      const result = await service.toggleOffer('o-1', 'biz-1', false);
      expect(result.success).toBe(true);
      expect(result.offer.isActive).toBe(false);
    });
  });

  describe('deleteOffer', () => {
    it('should soft delete an offer', async () => {
      bizUsersRepo.findOne.mockResolvedValue(mockBizUser);
      offersRepo.findOne.mockResolvedValue({ id: 'o-1', venueId: 'venue-1' });
      offersRepo.delete.mockResolvedValue({ affected: 1 });
      activityLogsRepo.create.mockReturnValue({});
      activityLogsRepo.save.mockResolvedValue({});

      const result = await service.deleteOffer('o-1', 'biz-1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Offer deleted');
    });
  });
});
