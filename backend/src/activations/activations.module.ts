import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audience } from '../audiences/audience.entity';
import { AudienceMember } from '../audiences/audience-member.entity';
import { Customer } from '../customers/customer.entity';
import { Activation } from './activation.entity';
import { ActivationRecipient } from './activation-recipient.entity';
import { ActivationsController } from './activations.controller';
import { ActivationsService } from './activations.service';
import { MockSmsController } from './mock-sms.controller';
import { ActivationWorker } from './activation.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Audience,
      AudienceMember,
      Customer,
      Activation,
      ActivationRecipient,
    ]),
  ],
  controllers: [ActivationsController, MockSmsController],
  providers: [ActivationsService, ActivationWorker],
})
export class ActivationsModule {}
