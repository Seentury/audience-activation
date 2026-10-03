import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { UpsertCustomerDto } from '../customers/dto/upsert-customer.dto';
import { AudienceCustomersService } from './audience-customers.service';

@Controller('audiences/:audienceId/customers')
export class AudienceCustomersController {
  constructor(
    private readonly audienceCustomersService: AudienceCustomersService,
  ) {}

  @Post()
  @HttpCode(200)
  addCustomer(
    @Param('audienceId', ParseUUIDPipe) audienceId: string,
    @Body() dto: UpsertCustomerDto,
  ) {
    return this.audienceCustomersService.addCustomer(audienceId, dto);
  }

  @Get()
  findCustomers(
    @Param('audienceId', ParseUUIDPipe) audienceId: string,
  ) {
    return this.audienceCustomersService.findCustomers(audienceId);
  }
}