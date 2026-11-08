import {type MigrationInterface, type QueryRunner} from 'typeorm';

const TABLE = 'practice_memberships';
const PERSONA_CHECK = 'practice_memberships_persona_key_check';

export class MembershipDisplayIdentity1760000000013 implements MigrationInterface {
	name = 'MembershipDisplayIdentity1760000000013';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "${TABLE}"
				ADD COLUMN "display_name" character varying(120),
				ADD COLUMN "credential" character varying(16),
				ADD COLUMN "persona_key" character varying(40)
		`);
		await queryRunner.query(`
			ALTER TABLE "${TABLE}"
				ADD CONSTRAINT "${PERSONA_CHECK}" CHECK (
					"persona_key" IS NULL OR "persona_key" IN (
						'provider-jordan-ellis',
						'nurse-riley-park',
						'patient-avery-quinn'
					)
				)
		`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "${TABLE}" DROP CONSTRAINT IF EXISTS "${PERSONA_CHECK}"`);
		await queryRunner.query(`
			ALTER TABLE "${TABLE}"
				DROP COLUMN IF EXISTS "persona_key",
				DROP COLUMN IF EXISTS "credential",
				DROP COLUMN IF EXISTS "display_name"
		`);
	}
}
