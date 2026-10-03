import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { Audience } from './audience.entity';
import { AudienceMember } from './audience-member.entity';
import { AudiencesController } from './audiences.controller';
import { AudiencesService } from './audiences.service';
import { AudienceCustomersController } from './audience-customers.controller';
import { AudienceCustomersService } from './audience-customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Audience,
      Customer,
      AudienceMember,
    ]),
  ],
  controllers: [
    AudiencesController,
    AudienceCustomersController,
  ],
  providers: [
    AudiencesService,
    AudienceCustomersService,
  ],
})
export class AudiencesModule {}