import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vibe } from './entities/vibe.entity';

@Injectable()
export class VibesService {
  constructor(
    @InjectRepository(Vibe)
    private vibesRepository: Repository<Vibe>,
  ) {}

  async findByVenueId(venueId: string): Promise<Vibe | null> {
    return this.vibesRepository.findOne({ where: { venueId } });
  }

  /**
   * Update vibe tags + music — replaces current values.
   * Called by business owner from Screen 13.
   */
  async updateVibe(
    venueId: string,
    tags: string[],
    musicGenre?: string[],
    updatedBy?: string,
  ): Promise<Vibe> {
    let vibe = await this.vibesRepository.findOne({ where: { venueId } });

    if (!vibe) {
      vibe = this.vibesRepository.create({ venueId });
    }

    vibe.tags = tags;
    if (musicGenre) vibe.musicGenre = musicGenre;
    if (updatedBy) vibe.updatedBy = updatedBy;

    return this.vibesRepository.save(vibe);
  }

  /**
   * Time-based vibe scheduling (for demo).
   * Returns dynamic vibe based on current hour:
   *   6PM-8PM  → Chill, Dim Lighting
   *   8PM-10PM → Moderate Energy, Live Music
   *  10PM-2AM  → High Energy, Packed, House Music
   *  Other     → Chill (default daytime)
   */
  getScheduledVibe(hour: number): { tags: string[]; musicGenre: string[]; description: string } {
    if (hour >= 18 && hour < 20) {
      return {
        tags: ['Chill', 'Intimate'],
        musicGenre: ['Lo-fi', 'Vinyl'],
        description: 'Early evening — chill vibes and dim lighting',
      };
    }
    if (hour >= 20 && hour < 22) {
      return {
        tags: ['Live Music', 'Party'],
        musicGenre: ['Indie', 'R&B'],
        description: 'Live music and moderate energy building up',
      };
    }
    if (hour >= 22 || hour < 2) {
      return {
        tags: ['High Energy', 'Packed', 'Late Night'],
        musicGenre: ['House', 'Techno'],
        description: 'Peak hours — high energy and packed dance floors',
      };
    }
    // Daytime default
    return {
      tags: ['Chill'],
      musicGenre: ['Lo-fi'],
      description: 'Daytime — relaxed atmosphere',
    };
  }
}
