import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import type { UpsertCustomerDto } from '../customers/dto/upsert-customer.dto';
import { Audience } from './audience.entity';
import { AudienceMember } from './audience-member.entity';

@Injectable()
export class AudienceCustomersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async addCustomer(
    audienceId: string,
    dto: UpsertCustomerDto,
  ): Promise<Customer> {
    return this.dataSource.transaction(async (manager) => {
      const audience = await manager.findOneBy(Audience, {
        id: audienceId,
      });

      if (!audience) {
        throw new NotFoundException('Audience not found');
      }

      const customerRepository = manager.getRepository(Customer);

      await customerRepository.upsert(
        {
          externalId: dto.externalId,
          name: dto.name ?? null,
          phone: dto.phone ?? null,
          email: dto.email ?? null,
        },
        ['externalId'],
      );

      const customer = await customerRepository.findOneByOrFail({
        externalId: dto.externalId,
      });

      await manager
        .createQueryBuilder()
        .insert()
        .into(AudienceMember)
        .values({
          audienceId,
          customerId: customer.id,
        })
        .orIgnore()
        .execute();

      return customer;
    });
  }

  async findCustomers(audienceId: string): Promise<Customer[]> {
    const audience = await this.dataSource
      .getRepository(Audience)
      .findOneBy({ id: audienceId });

    if (!audience) {
      throw new NotFoundException('Audience not found');
    }

    return this.dataSource
      .getRepository(Customer)
      .createQueryBuilder('customer')
      .innerJoin(
        AudienceMember,
        'member',
        'member.customerId = customer.id',
      )
      .where('member.audienceId = :audienceId', { audienceId })
      .orderBy('member.joinedAt', 'DESC')
      .addOrderBy('customer.id', 'ASC')
      .getMany();
  }
}