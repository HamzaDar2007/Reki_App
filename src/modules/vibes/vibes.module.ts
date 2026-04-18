import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VibesService } from './vibes.service';
import { Vibe } from './entities/vibe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vibe])],
  providers: [VibesService],
  exports: [VibesService],
})
export class VibesModule {}
