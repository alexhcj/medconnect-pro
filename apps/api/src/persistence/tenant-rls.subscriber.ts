import {EventSubscriber, type EntitySubscriberInterface, type QueryRunner} from 'typeorm';
import {tenantAls} from '../tenancy/tenant-als.js';

const applying = new WeakSet<QueryRunner>();
const skipGuc = /^(start\s+transaction|begin|commit|rollback|savepoint|release\s+savepoint|select\s+set_config\()/i;

@EventSubscriber()
export class TenantRlsSubscriber implements EntitySubscriberInterface {
	async beforeQuery(event: {query: string; queryRunner: QueryRunner}): Promise<void> {
		if (skipGuc.test(event.query.trim()) || applying.has(event.queryRunner)) {
			return;
		}
		applying.add(event.queryRunner);
		try {
			const practiceId = tenantAls.getStore()?.practiceId ?? '';
			await event.queryRunner.query(`SELECT set_config('app.current_practice_id', $1, false)`, [
				practiceId,
			]);
		} finally {
			applying.delete(event.queryRunner);
		}
	}
}
