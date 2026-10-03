import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ActivationsService } from './activations.service';
import { CreateActivationDto } from './dto/create-activation.dto';

@Controller('activations')
export class ActivationsController {
  constructor(
    private readonly activationsService: ActivationsService,
  ) {}

  @Post()
  @HttpCode(202)
  create(@Body() dto: CreateActivationDto) {
    return this.activationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.activationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.activationsService.findOne(id);
  }
}