import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SegmentService } from './segment.service';

@Controller('webhooks/segment')
export class SegmentController {
  constructor(
    private readonly segmentService: SegmentService,
  ) {}

  @Post()
  @HttpCode(200)
  receive(@Body() body: unknown) {
    return this.segmentService.receive(body);
  }
}