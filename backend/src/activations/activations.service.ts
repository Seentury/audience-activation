import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Audience } from '../audiences/audience.entity';
import { AudienceMember } from '../audiences/audience-member.entity';
import { Customer } from '../customers/customer.entity';
import { Activation, ActivationStatus } from './activation.entity';
import { ActivationRecipient } from './activation-recipient.entity';
import type { CreateActivationDto } from './dto/create-activation.dto';

@Injectable()
export class ActivationsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateActivationDto) {
    return this.dataSource.transaction(
      'REPEATABLE READ',
      async (manager) => {
        const audience = await manager.findOneBy(Audience, {
          id: dto.audienceId,
        });

        if (!audience) {
          throw new NotFoundException('Audience not found');
        }

        const customers = await manager
          .getRepository(Customer)
          .createQueryBuilder('customer')
          .innerJoin(
            AudienceMember,
            'member',
            'member.customerId = customer.id',
          )
          .where('member.audienceId = :audienceId', {
            audienceId: audience.id,
          })
          .getMany();

        if (customers.length === 0) {
          throw new BadRequestException('Audience has no customers');
        }

        const activation = await manager.save(
          Activation,
          manager.create(Activation, {
            audienceId: audience.id,
            audienceName: audience.name,
            message: dto.message,
            status: ActivationStatus.Pending,
          }),
        );

        const recipients = customers.map((customer) =>
          manager.create(ActivationRecipient, {
            activationId: activation.id,
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone,
            status: ActivationStatus.Pending,
          }),
        );

        await manager.save(ActivationRecipient, recipients);

        return {
          ...activation,
          recipientCount: recipients.length,
        };
      },
    );
  }

  findAll(): Promise<Activation[]> {
    return this.dataSource.getRepository(Activation).find({
      order: {
        createdAt: 'DESC',
        id: 'ASC',
      },
    });
  }

  async findOne(id: string) {
    return this.dataSource.transaction(
      'REPEATABLE READ',
      async (manager) => {
        const activation = await manager.findOneBy(Activation, { id });

        if (!activation) {
          throw new NotFoundException('Activation not found');
        }

        const recipients = await manager.find(ActivationRecipient, {
          where: { activationId: id },
          order: { createdAt: 'ASC', id: 'ASC' },
        });

        return {
          ...activation,
          recipientCount: recipients.length,
          recipients,
        };
      },
    );
  }
}