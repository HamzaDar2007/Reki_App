import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Redemption } from '../offers/entities/redemption.entity';
import { paginate } from '../../common/dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Redemption)
    private redemptionsRepository: Repository<Redemption>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // === Preferences ===

  async getPreferences(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return {
      preferences: user.preferences || { vibes: [], music: [] },
      hasPreferences: !!user.preferences,
    };
  }

  async savePreferences(userId: string, vibes: string[], music: string[]) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.preferences = { vibes, music };
    await this.usersRepository.save(user);

    return { preferences: user.preferences };
  }

  // === Saved Venues ===

  async getSavedVenues(userId: string): Promise<string[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user.savedVenues || [];
  }

  async saveVenue(userId: string, venueId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const venues = user.savedVenues || [];
    if (!venues.includes(venueId)) {
      venues.push(venueId);
      user.savedVenues = venues;
      await this.usersRepository.save(user);
    }

    return { saved: true, savedVenues: user.savedVenues };
  }

  async unsaveVenue(userId: string, venueId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.savedVenues = (user.savedVenues || []).filter((id) => id !== venueId);
    await this.usersRepository.save(user);

    return { saved: false, savedVenues: user.savedVenues };
  }

  // === Redemptions ===

  async getRedemptions(userId: string, page = 1, limit = 10) {
    const [redemptions, total] = await this.redemptionsRepository.findAndCount({
      where: { userId },
      relations: ['offer', 'venue'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { redemptions, ...paginate(redemptions, total, page, limit).pagination };
  }
}
