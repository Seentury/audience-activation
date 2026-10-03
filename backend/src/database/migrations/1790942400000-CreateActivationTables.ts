import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivationTables1790942400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE activations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        audience_id UUID NOT NULL,
        audience_name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,

        status VARCHAR(16) NOT NULL DEFAULT 'Pending',
        error_message TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,

        CONSTRAINT fk_activations_audience
          FOREIGN KEY (audience_id)
          REFERENCES audiences(id)
          ON DELETE RESTRICT,

        CONSTRAINT chk_activations_status
          CHECK (
            status IN ('Pending', 'Processing', 'Success', 'Failed')
          ),

        CONSTRAINT chk_activations_message
          CHECK (char_length(trim(message)) > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE activation_recipients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        activation_id UUID NOT NULL,
        customer_id UUID NOT NULL,

        customer_name VARCHAR(255),
        phone VARCHAR(32),

        status VARCHAR(16) NOT NULL DEFAULT 'Pending',
        provider_message_id VARCHAR(255),
        error_message TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ,

        CONSTRAINT fk_activation_recipients_activation
          FOREIGN KEY (activation_id)
          REFERENCES activations(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_activation_recipients_customer
          FOREIGN KEY (customer_id)
          REFERENCES customers(id)
          ON DELETE RESTRICT,

        CONSTRAINT uq_activation_recipients_customer
          UNIQUE (activation_id, customer_id),

        CONSTRAINT chk_activation_recipients_status
          CHECK (
            status IN ('Pending', 'Processing', 'Success', 'Failed')
          )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_activations_audience_created
      ON activations(audience_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_activations_status_created
      ON activations(status, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_activation_recipients_customer
      ON activation_recipients(customer_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE activation_recipients');
    await queryRunner.query('DROP TABLE activations');
  }
}