import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflowsDir = path.join(repoRoot, '.github', 'workflows');

function readWorkflow(name) {
	return readFileSync(path.join(workflowsDir, name), 'utf8');
}

const ci = readWorkflow('ci.yml');
const previewStatus = readWorkflow('preview-status.yml');
const apiImage = readWorkflow('api-image.yml');

describe('preview delivery workflows', () => {
	it('keeps quality CI and preview status free of AWS deploy credentials', () => {
		for (const [name, yaml] of [
			['ci.yml', ci],
			['preview-status.yml', previewStatus],
		]) {
			assert.doesNotMatch(yaml, /AWS_PRODUCTION_ROLE_ARN/, `${name} must not assume the production OIDC role`);
			assert.doesNotMatch(yaml, /github_preview_role_arn/, `${name} must not assume the preview OIDC role`);
			assert.doesNotMatch(yaml, /configure-aws-credentials/, `${name} must not configure AWS credentials`);
			assert.doesNotMatch(yaml, /amazon-ecr-login/, `${name} must not log in to ECR`);
			assert.doesNotMatch(yaml, /docker push/, `${name} must not push images`);
		}
	});

	it('pushes the API image on main only', () => {
		assert.match(apiImage, /name: API image/);
		assert.match(apiImage, /branches:\s*\[main\]/);
		assert.doesNotMatch(apiImage, /pull_request:/);
		assert.match(apiImage, /AWS_PRODUCTION_ROLE_ARN/);
		assert.match(apiImage, /docker push/);
	});

	it('advertises the Amplify preview URL after CI without deploying Amplify', () => {
		assert.match(previewStatus, /name: Preview status/);
		assert.match(previewStatus, /workflow_run:/);
		assert.match(previewStatus, /workflows:\s*\[CI\]/);
		assert.match(previewStatus, /AMPLIFY_APP_ID/);
		assert.match(previewStatus, /medconnect-preview-status/);
		assert.match(previewStatus, /pr-\$\{prNumber\}/);
		assert.match(previewStatus, /shared/);
		assert.doesNotMatch(previewStatus, /aws amplify/i);
		assert.doesNotMatch(previewStatus, /start-job/i);
		assert.doesNotMatch(previewStatus, /createDeployment/i);
		assert.doesNotMatch(previewStatus, /amplify start/i);
	});
});
