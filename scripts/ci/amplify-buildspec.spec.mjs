import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const amplifyYmlPath = path.join(repoRoot, 'amplify.yml');

describe('amplify.yml', () => {
	const spec = readFileSync(amplifyYmlPath, 'utf8');

	it('exists at the repository root', () => {
		assert.ok(spec.length > 0);
	});

	it('uses Node 24 and a root workspace install/build for SSR', () => {
		assert.match(spec, /^\s*-\s*nvm use 24\s*$/m);
		assert.match(spec, /^\s*-\s*npm ci\s*$/m);
		assert.match(spec, /^\s*-\s*npm run build:production\s*$/m);
		assert.match(spec, /^\s*-?\s*appRoot:\s*apps\/web\s*$/m);
		assert.match(spec, /^\s*buildPath:\s*\/\s*$/m);
		assert.match(spec, /^\s*baseDirectory:\s*apps\/web\/\.next\s*$/m);
		assert.doesNotMatch(spec, /baseDirectory:\s*out\b/);
	});

	it('writes required frontend env into apps/web/.env.production and fails closed', () => {
		assert.match(spec, /env_file=apps\/web\/\.env\.production/);
		assert.match(spec, /NEXT_PUBLIC_USE_MOCKS/);
		assert.match(spec, /NEXT_PUBLIC_API_BASE_URL/);
		assert.match(spec, /API_BASE_URL/);
		assert.match(spec, /Missing required Amplify env/);
		assert.match(spec, /printenv/);
	});

	it('does not embed database URLs or AWS secrets', () => {
		assert.doesNotMatch(spec, /DATABASE_URL/);
		assert.doesNotMatch(spec, /DATABASE_ADMIN_URL/);
		assert.doesNotMatch(spec, /AWS_SECRET/);
		assert.doesNotMatch(spec, /AWS_ACCESS_KEY/);
	});
});
