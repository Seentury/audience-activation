import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScheduledAtToActivations1791196407719 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE activations
    ADD COLUMN scheduled_at TIMESTAMPTZ NULL
  `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE activations
    DROP COLUMN scheduled_at
  `);
}

}
