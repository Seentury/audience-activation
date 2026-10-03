import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Audience } from '../audiences/audience.entity';
import { AudienceMember } from '../audiences/audience-member.entity';
import { Customer } from '../customers/customer.entity';
import { segmentEventSchema } from './segment-event.schema';

@Injectable()
export class SegmentService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async receive(body: unknown) {
    const parsed = segmentEventSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid Segment audience event',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const event = parsed.data;
    const personas = event.context.personas;
    const traits = event.traits;
    const isMember = traits[personas.computation_key];

    if (typeof isMember !== 'boolean') {
      throw new BadRequestException(
        `traits.${personas.computation_key} must be a boolean`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const audienceRepository = manager.getRepository(Audience);
      const customerRepository = manager.getRepository(Customer);

      // สร้างกลุ่มหากยังไม่มี โดยเก็บชื่อเดิมไว้ถ้ามีอยู่แล้ว
      await manager
        .createQueryBuilder()
        .insert()
        .into(Audience)
        .values({
          externalId: personas.computation_id,
          name: personas.computation_key,
        })
        .orIgnore()
        .execute();

      const audience = await audienceRepository.findOneByOrFail({
        externalId: personas.computation_id,
      });

      // อัปเดตเฉพาะข้อมูลลูกค้าที่ส่งมา
      await customerRepository.upsert(
        {
          externalId: event.userId,
          ...(traits.name !== undefined
            ? { name: traits.name }
            : {}),
          ...(traits.phone !== undefined
            ? { phone: traits.phone }
            : {}),
          ...(traits.email !== undefined
            ? { email: traits.email }
            : {}),
        },
        ['externalId'],
      );

      const customer = await customerRepository.findOneByOrFail({
        externalId: event.userId,
      });

      if (isMember) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(AudienceMember)
          .values({
            audienceId: audience.id,
            customerId: customer.id,
          })
          .orIgnore()
          .execute();
      } else {
        await manager.getRepository(AudienceMember).delete({
          audienceId: audience.id,
          customerId: customer.id,
        });
      }

      return {
        status: 'ok',
        audienceId: audience.id,
        customerId: customer.id,
        membership: isMember ? 'included' : 'excluded',
      };
    });
  }
}