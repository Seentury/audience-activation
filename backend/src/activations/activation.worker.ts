import { Injectable, Logger } from '@nestjs/common';
import type {
  BeforeApplicationShutdown,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { z } from 'zod';
import { Activation, ActivationStatus } from './activation.entity';
import { ActivationRecipient } from './activation-recipient.entity';

const smsResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    messageId: z.string().min(1).max(255),
  }),
  z.object({
    status: z.literal('failed'),
    error: z.string().min(1),
  }),
]);

type SmsResult = z.infer<typeof smsResultSchema>;

@Injectable()
export class ActivationWorker
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(ActivationWorker.name);

  private timer?: ReturnType<typeof setInterval>;
  private currentRun: Promise<void> | null = null;
  private stopping = false;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => {
      if (this.stopping || this.currentRun) {
        return;
      }

      this.currentRun = this.tick()
        .catch((error: unknown) => {
          this.logger.error(
            error instanceof Error ? error.message : String(error),
          );
        })
        .finally(() => {
          this.currentRun = null;
        });
    }, 2000);
  }

  async beforeApplicationShutdown(): Promise<void> {
    this.stopping = true;

    if (this.timer) {
      clearInterval(this.timer);
    }

    await this.currentRun;
  }

  private async tick(): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    let locked = false;

    try {
      await runner.connect();

      const result = await runner.query(
        'SELECT pg_try_advisory_lock(78231, 1) AS locked',
        [],
        true,
      );

      const rows = result.records as Array<{ locked: boolean }>;

      locked = rows[0]?.locked === true;

      if (!locked) {
        return;
      }

      const activation = await runner.manager.findOne(Activation, {
        where: {
          status: In([ActivationStatus.Pending, ActivationStatus.Processing]),
        },
        order: {
          createdAt: 'ASC',
          id: 'ASC',
        },
      });

      if (!activation) {
        return;
      }

      await this.processActivation(runner.manager, activation);
    } finally {
      try {
        if (locked) {
          await runner.query('SELECT pg_advisory_unlock(78231, 1)');
        }
      } finally {
        await runner.release();
      }
    }
  }

  private async processActivation(
    manager: EntityManager,
    activation: Activation,
  ): Promise<void> {
    await manager.update(Activation, activation.id, {
      status: ActivationStatus.Processing,
      startedAt: activation.startedAt ?? new Date(),
      errorMessage: null,
    });

    const recipients = await manager.find(ActivationRecipient, {
      where: { activationId: activation.id },
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    for (const recipient of recipients) {
      // กรณีเริ่มแอปใหม่ ให้ข้ามผู้รับที่ประมวลผลเสร็จแล้ว
      if (
        recipient.status === ActivationStatus.Success ||
        recipient.status === ActivationStatus.Failed
      ) {
        continue;
      }

      await manager.update(ActivationRecipient, recipient.id, {
        status: ActivationStatus.Processing,
      });

      const result = await this.sendSms(recipient, activation.message);

      await manager.update(ActivationRecipient, recipient.id, {
        status:
          result.status === 'success'
            ? ActivationStatus.Success
            : ActivationStatus.Failed,
        providerMessageId:
          result.status === 'success' ? result.messageId : null,
        errorMessage: result.status === 'failed' ? result.error : null,
        processedAt: new Date(),
      });
    }

    const failedCount = await manager.count(ActivationRecipient, {
      where: {
        activationId: activation.id,
        status: ActivationStatus.Failed,
      },
    });

    const hasFailed = failedCount > 0 || recipients.length === 0;

    await manager.update(Activation, activation.id, {
      status: hasFailed ? ActivationStatus.Failed : ActivationStatus.Success,
      errorMessage:
        recipients.length === 0
          ? 'No recipients'
          : failedCount > 0
            ? `${failedCount} recipient(s) failed`
            : null,
      completedAt: new Date(),
    });

    this.logger.log(
      `Activation ${activation.id}: ${hasFailed ? 'Failed' : 'Success'}`,
    );
  }

  private async sendSms(
    recipient: ActivationRecipient,
    message: string,
  ): Promise<SmsResult> {
    if (!recipient.phone) {
      return {
        status: 'failed',
        error: 'Missing phone number',
      };
    }

    if (!/^\+[1-9]\d{1,14}$/.test(recipient.phone)) {
      return {
        status: 'failed',
        error: 'Invalid phone number format',
      };
    }

    try {
      const response = await fetch(
        this.config.getOrThrow<string>('MOCK_SMS_URL'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId: recipient.id,
            phone: recipient.phone,
            message,
          }),
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) {
        return {
          status: 'failed',
          error: `SMS API returned HTTP ${response.status}`,
        };
      }

      const body: unknown = await response.json();
      const parsed = smsResultSchema.safeParse(body);

      if (!parsed.success) {
        return {
          status: 'failed',
          error: 'Invalid response from SMS API',
        };
      }

      return parsed.data;
    } catch (error: unknown) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
