import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VenueCategory } from '../../../common/enums';

export class CreateVenueDto {
  @ApiProperty({ example: 'The Blue Moon Bar' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Oxford Road, Manchester' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'Manchester' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'City Centre' })
  @IsNotEmpty()
  @IsString()
  area: string;

  @ApiProperty({ example: 'bar', enum: VenueCategory })
  @IsNotEmpty()
  @IsString()
  category: VenueCategory;

  @ApiProperty({ example: 53.4808 })
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -2.2426 })
  @IsNotEmpty()
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ example: 2, minimum: 1, maximum: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  priceLevel?: number;

  @ApiProperty({ example: '18:00' })
  @IsNotEmpty()
  @IsString()
  openingHours: string;

  @ApiProperty({ example: '02:00' })
  @IsNotEmpty()
  @IsString()
  closingTime: string;

  @ApiPropertyOptional({ example: ['Chill', 'Party'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: ['https://example.com/image1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
