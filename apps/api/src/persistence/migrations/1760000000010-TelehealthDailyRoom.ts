import {type MigrationInterface, type QueryRunner} from 'typeorm';

export class TelehealthDailyRoom1760000000010 implements MigrationInterface {
	name = 'TelehealthDailyRoom1760000000010';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "telehealth_sessions"
			ADD "daily_room_name" character varying(128)
		`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "telehealth_sessions"
			DROP COLUMN "daily_room_name"
		`);
	}
}
