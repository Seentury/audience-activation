import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AudiencesService } from './audiences.service';
import { UpsertAudienceDto } from './dto/upsert-audience.dto';

@Controller('audiences')
export class AudiencesController {
  constructor(
    private readonly audiencesService: AudiencesService,
  ) {}

  @Get()
  findAll() {
    return this.audiencesService.findAll();
  }

  @Post()
  @HttpCode(200)
  upsert(@Body() dto: UpsertAudienceDto) {
    return this.audiencesService.upsert(dto);
  }
}