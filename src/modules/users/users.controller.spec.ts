import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: Partial<UsersService>;
  const user = { id: 'u-1', email: 'a@b.com' } as any;

  beforeEach(() => {
    service = {
      getPreferences: jest.fn().mockResolvedValue({ vibes: [], music: [] }),
      savePreferences: jest.fn().mockResolvedValue({ success: true }),
      getSavedVenues: jest.fn().mockResolvedValue([]),
      saveVenue: jest.fn().mockResolvedValue({ saved: true }),
      unsaveVenue: jest.fn().mockResolvedValue({ removed: true }),
      getRedemptions: jest.fn().mockResolvedValue({ redemptions: [], total: 0 }),
    };
    controller = new UsersController(service as UsersService);
  });

  it('getPreferences', async () => {
    await controller.getPreferences(user);
    expect(service.getPreferences).toHaveBeenCalledWith('u-1');
  });

  it('savePreferences', async () => {
    await controller.savePreferences(user, { vibes: ['Chill'], music: ['House'] });
    expect(service.savePreferences).toHaveBeenCalledWith('u-1', ['Chill'], ['House']);
  });

  it('updatePreferences', async () => {
    await controller.updatePreferences(user, { vibes: ['Party'], music: [] });
    expect(service.savePreferences).toHaveBeenCalledWith('u-1', ['Party'], []);
  });

  it('getSavedVenues', async () => {
    await controller.getSavedVenues(user);
    expect(service.getSavedVenues).toHaveBeenCalledWith('u-1');
  });

  it('saveVenue', async () => {
    await controller.saveVenue(user, 'v-1');
    expect(service.saveVenue).toHaveBeenCalledWith('u-1', 'v-1');
  });

  it('unsaveVenue', async () => {
    await controller.unsaveVenue(user, 'v-1');
    expect(service.unsaveVenue).toHaveBeenCalledWith('u-1', 'v-1');
  });

  it('getRedemptions with pagination', async () => {
    await controller.getRedemptions(user, '2', '5');
    expect(service.getRedemptions).toHaveBeenCalledWith('u-1', 2, 5);
  });

  it('getRedemptions defaults', async () => {
    await controller.getRedemptions(user);
    expect(service.getRedemptions).toHaveBeenCalledWith('u-1', 1, 10);
  });
});
