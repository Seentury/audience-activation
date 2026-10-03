import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audience } from '../audiences/audience.entity';
import { AudienceMember } from '../audiences/audience-member.entity';
import { Customer } from '../customers/customer.entity';
import { SegmentController } from './segment.controller';
import { SegmentService } from './segment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Audience,
      Customer,
      AudienceMember,
    ]),
  ],
  controllers: [SegmentController],
  providers: [SegmentService],
})
export class SegmentModule {}