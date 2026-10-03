import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Audience } from './audience.entity';
import type { UpsertAudienceDto } from './dto/upsert-audience.dto';

@Injectable()
export class AudiencesService {
  constructor(
    @InjectRepository(Audience)
    private readonly audienceRepository: Repository<Audience>,
  ) {}

  findAll(): Promise<Audience[]> {
    return this.audienceRepository.find({
      order: {
        createdAt: 'DESC',
        id: 'ASC',
      },
    });
  }

  async upsert(dto: UpsertAudienceDto): Promise<Audience> {
    await this.audienceRepository.upsert(
      {
        externalId: dto.externalId,
        name: dto.name,
        description: dto.description ?? null,
      },
      ['externalId'],
    );

    return this.audienceRepository.findOneByOrFail({
      externalId: dto.externalId,
    });
  }
}