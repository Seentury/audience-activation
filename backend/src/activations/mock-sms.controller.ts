import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { setTimeout as delay } from 'node:timers/promises';

class SendMockSmsDto {
  @IsUUID()
  requestId!: string;

  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/)
  phone!: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(1600)
  message!: string;
}

@Controller('mock-sms')
export class MockSmsController {
  @Post('send')
  @HttpCode(200)
  async send(@Body() dto: SendMockSmsDto) {
    await delay(1000);

    // ใช้เบอร์ลงท้าย 0000 เพื่อทดสอบกรณีส่งไม่สำเร็จ
    if (dto.phone.endsWith('0000')) {
      return {
        status: 'failed',
        error: 'MOCK_PROVIDER_REJECTED',
      };
    }

    return {
      status: 'success',
      messageId: `mock_${dto.requestId}`,
    };
  }
}