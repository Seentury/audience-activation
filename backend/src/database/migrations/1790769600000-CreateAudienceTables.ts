import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAudienceTables1790769600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE audiences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        phone VARCHAR(32),
        email VARCHAR(320),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE audience_members (
        audience_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT pk_audience_members
          PRIMARY KEY (audience_id, customer_id),

        CONSTRAINT fk_audience_members_audience
          FOREIGN KEY (audience_id)
          REFERENCES audiences(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_audience_members_customer
          FOREIGN KEY (customer_id)
          REFERENCES customers(id)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audience_members_customer_id
      ON audience_members(customer_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE audience_members');
    await queryRunner.query('DROP TABLE customers');
    await queryRunner.query('DROP TABLE audiences');
  }
}