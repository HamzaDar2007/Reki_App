import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';

describe('BusinessController', () => {
  let controller: BusinessController;
  let service: Partial<BusinessService>;
  const user = { id: 'u-1' } as any;

  beforeEach(() => {
    service = {
      login: jest.fn().mockResolvedValue({ user: {}, tokens: {} }),
      register: jest.fn().mockResolvedValue({ user: {}, tokens: {} }),
      forgotPassword: jest.fn().mockResolvedValue({ message: 'ok' }),
      getDashboard: jest.fn().mockResolvedValue({ venue: {} }),
      getAnalytics: jest.fn().mockResolvedValue({ views: 0 }),
      updateVenueStatus: jest.fn().mockResolvedValue({ success: true }),
      getVenueStatus: jest.fn().mockResolvedValue({ busyness: {}, vibe: {} }),
      getVenueOffers: jest.fn().mockResolvedValue({ active: [], past: [] }),
      createOffer: jest.fn().mockResolvedValue({ id: 'o-1' }),
      updateOffer: jest.fn().mockResolvedValue({ id: 'o-1' }),
      toggleOffer: jest.fn().mockResolvedValue({ isActive: false }),
      deleteOffer: jest.fn().mockResolvedValue({ success: true }),
      createVenue: jest.fn().mockResolvedValue({ success: true, venue: { id: 'v-new' } }),
      getMyVenues: jest.fn().mockResolvedValue({
        venues: [{
          id: 'v-1',
          name: 'The Blue Moon Bar',
          images: ['https://example.com/image1.jpg'],
          lat: 53.4808,
          lng: -2.2426,
          priceLevel: 2,
          openingHours: '18:00',
          closingTime: '02:00',
          tags: ['Chill', 'Party'],
          rating: 4.0,
          isLive: false,
          busyness: { level: 'quiet', percentage: 25 },
          vibe: { tags: [] },
        }],
        total: 1,
      }),
    };
    controller = new BusinessController(service as BusinessService);
  });

  it('login', async () => {
    await controller.login({ email: 'a@b.com', password: 'pass' } as any);
    expect(service.login).toHaveBeenCalledWith('a@b.com', 'pass');
  });

  it('register', async () => {
    const dto = { email: 'a@b.com', password: 'pass', businessName: 'Bar' } as any;
    await controller.register(dto);
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('forgotPassword', async () => {
    await controller.forgotPassword({ email: 'a@b.com' });
    expect(service.forgotPassword).toHaveBeenCalledWith('a@b.com');
  });

  it('getDashboard', async () => {
    await controller.getDashboard('v-1', user);
    expect(service.getDashboard).toHaveBeenCalledWith('v-1', 'u-1');
  });

  it('getAnalytics', async () => {
    await controller.getAnalytics('v-1', user, 'week');
    expect(service.getAnalytics).toHaveBeenCalledWith('v-1', 'u-1', 'week');
  });

  it('updateVenueStatus', async () => {
    await controller.updateVenueStatus('v-1', user, { busyness: 'busy', vibes: ['Chill'] } as any);
    expect(service.updateVenueStatus).toHaveBeenCalledWith('v-1', 'u-1', 'busy', ['Chill']);
  });

  it('getVenueStatus', async () => {
    await controller.getVenueStatus('v-1', user);
    expect(service.getVenueStatus).toHaveBeenCalledWith('v-1', 'u-1');
  });

  it('getVenueOffers', async () => {
    await controller.getVenueOffers('v-1', user);
    expect(service.getVenueOffers).toHaveBeenCalledWith('v-1', 'u-1', 1, 20);
  });

  it('createOffer', async () => {
    const dto = {
      venueId: 'v-1', title: 'Deal', description: 'desc', type: '2-for-1',
      validDays: ['monday'], validTimeStart: '17:00', validTimeEnd: '19:00',
      maxRedemptions: 50, savingValue: 5, expiresAt: null,
    } as any;
    await controller.createOffer(user, dto);
    expect(service.createOffer).toHaveBeenCalled();
  });

  it('updateOffer', async () => {
    await controller.updateOffer('o-1', user, { title: 'Updated' } as any);
    expect(service.updateOffer).toHaveBeenCalled();
  });

  it('toggleOffer', async () => {
    await controller.toggleOffer('o-1', user, { isActive: false } as any);
    expect(service.toggleOffer).toHaveBeenCalledWith('o-1', 'u-1', false);
  });

  it('deleteOffer', async () => {
    await controller.deleteOffer('o-1', user);
    expect(service.deleteOffer).toHaveBeenCalledWith('o-1', 'u-1');
  });

  it('createVenue — passes dto and user id to service', async () => {
    const dto = {
      name: 'The Blue Moon Bar',
      address: '123 Oxford Road, Manchester',
      city: 'Manchester',
      area: 'City Centre',
      category: 'bar',
      lat: 53.4808,
      lng: -2.2426,
      priceLevel: 2,
      openingHours: '18:00',
      closingTime: '02:00',
      tags: ['Chill', 'Party'],
      images: ['https://example.com/image1.jpg'],
    } as any;

    const result = await controller.createVenue(user, dto);
    expect(service.createVenue).toHaveBeenCalledWith('u-1', dto);
    expect(result.success).toBe(true);
    expect(result.venue.id).toBe('v-new');
  });

  it('getMyVenues — returns venues with images field', async () => {
    const result = await controller.getMyVenues(user);
    expect(service.getMyVenues).toHaveBeenCalledWith('u-1');
    expect(result.total).toBe(1);
    expect(result.venues[0]).toHaveProperty('images');
    expect(result.venues[0].images).toEqual(['https://example.com/image1.jpg']);
  });
});

