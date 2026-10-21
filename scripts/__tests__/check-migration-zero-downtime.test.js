'use strict';

const { checkMigrationSource } = require('../check-migration-zero-downtime');

const EXPAND = `
import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddCol1 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "ref" VARCHAR(64)\`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "ref"\`);
  }
}
`;

const DROP_IN_UP = `
export class DropUsers1 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE users');
  }
  public async down(): Promise<void> {}
}
`;

describe('migration zero-downtime policy', () => {
  it('allows expand-only up() even when down() drops the column', () => {
    const result = checkMigrationSource(EXPAND, 'AddCol.ts');
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('fails when up() drops a table', () => {
    const result = checkMigrationSource(DROP_IN_UP, 'DropUsers.ts');
    expect(result.ok).toBe(false);
    expect(result.violations[0].kind).toBe('DROP_TABLE');
  });

  it('allows a documented zero-downtime exception', () => {
    const source = `${DROP_IN_UP}\n// zero-downtime-exception: one-time cleanup of unused table`;
    expect(checkMigrationSource(source).ok).toBe(true);
  });
});
