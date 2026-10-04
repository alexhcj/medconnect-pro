import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';
import {
	MIGRATE_COMMAND,
	deployEcsService,
	imageUri,
	parseArgs,
	previousTaskDefinitionArn,
	toRegisterPayload,
	withImage,
	withMigrateCommand,
} from './ecs-deploy.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflowsDir = path.join(repoRoot, '.github', 'workflows');

function readWorkflow(name) {
	return readFileSync(path.join(workflowsDir, name), 'utf8');
}

const ci = readWorkflow('ci.yml');
const productionDeploy = readWorkflow('production-deploy.yml');

const sampleTask = {
	family: 'medconnect-production-api',
	taskDefinitionArn: 'arn:aws:ecs:us-east-1:123:task-definition/medconnect-production-api:4',
	revision: 4,
	status: 'ACTIVE',
	registeredAt: '2026-01-01T00:00:00.000Z',
	executionRoleArn: 'arn:aws:iam::123:role/medconnect-production-api-execution',
	taskRoleArn: 'arn:aws:iam::123:role/medconnect-production-api-task',
	networkMode: 'awsvpc',
	requiresCompatibilities: ['FARGATE'],
	cpu: '256',
	memory: '512',
	containerDefinitions: [
		{
			name: 'api',
			image: '123.dkr.ecr.us-east-1.amazonaws.com/medconnect-api:old',
			command: ['node', 'apps/api/dist/main.js'],
			healthCheck: {command: ['CMD-SHELL', 'true']},
		},
	],
};

describe('production delivery workflows', () => {
	it('keeps quality CI free of AWS deploy credentials', () => {
		assert.doesNotMatch(ci, /AWS_PRODUCTION_ROLE_ARN/);
		assert.doesNotMatch(ci, /configure-aws-credentials/);
		assert.doesNotMatch(ci, /environment:\s*production/);
		assert.doesNotMatch(ci, /ecs-deploy/);
	});

	it('deploys production ECS from main after CI and not from pull requests', () => {
		assert.match(productionDeploy, /name: Production deploy/);
		assert.match(productionDeploy, /workflow_run:/);
		assert.match(productionDeploy, /workflows:\s*\[CI\]/);
		assert.match(productionDeploy, /head_branch == 'main'/);
		assert.doesNotMatch(productionDeploy, /pull_request:/);
		assert.match(productionDeploy, /environment:\s*production/);
		assert.match(productionDeploy, /AWS_PRODUCTION_ROLE_ARN/);
		assert.match(productionDeploy, /id-token:\s*write/);
		assert.match(productionDeploy, /ecs-deploy\.mjs/);
		assert.match(productionDeploy, /service preview-api/);
		assert.match(productionDeploy, /service production-api/);
		assert.match(productionDeploy, /PRODUCTION_API_URL/);
		assert.match(productionDeploy, /\/health/);
		assert.match(productionDeploy, /\/ready/);
		assert.match(productionDeploy, /workflow_dispatch:/);
		assert.match(productionDeploy, /confirm_migration_revert/);
	});

	it('does not publish Amplify or store long-lived AWS access keys', () => {
		assert.doesNotMatch(productionDeploy, /aws amplify/i);
		assert.doesNotMatch(productionDeploy, /start-job/i);
		assert.doesNotMatch(productionDeploy, /createDeployment/i);
		assert.doesNotMatch(productionDeploy, /AWS_ACCESS_KEY_ID/);
		assert.doesNotMatch(productionDeploy, /AWS_SECRET_ACCESS_KEY/);
	});
});

describe('ecs-deploy task definition rewrite', () => {
	it('swaps the image and strips register-only fields', () => {
		const image = imageUri('123.dkr.ecr.us-east-1.amazonaws.com', 'medconnect-api', 'abc123');
		const next = withImage(sampleTask, image);
		assert.equal(next.containerDefinitions[0].image, image);
		assert.equal(next.family, 'medconnect-production-api');
		assert.equal(next.taskDefinitionArn, undefined);
		assert.equal(next.revision, undefined);
		assert.ok(next.containerDefinitions[0].healthCheck);
		assert.equal(toRegisterPayload(sampleTask).status, undefined);
	});

	it('uses the image migrate entrypoint and removes healthCheck', () => {
		const migrate = withMigrateCommand(withImage(sampleTask, 'registry/medconnect-api:sha'), {
			revert: false,
		});
		assert.deepEqual(migrate.containerDefinitions[0].command, MIGRATE_COMMAND);
		assert.equal(migrate.containerDefinitions[0].healthCheck, undefined);
		const revert = withMigrateCommand(sampleTask, {revert: true});
		assert.deepEqual(revert.containerDefinitions[0].command, [...MIGRATE_COMMAND, '--revert']);
	});

	it('selects the previous family revision', () => {
		const listed = [
			'arn:aws:ecs:us-east-1:123:task-definition/medconnect-production-api:4',
			'arn:aws:ecs:us-east-1:123:task-definition/medconnect-production-api:3',
			'arn:aws:ecs:us-east-1:123:task-definition/medconnect-production-api:2',
		];
		assert.equal(previousTaskDefinitionArn(listed[0], listed), listed[1]);
		assert.equal(previousTaskDefinitionArn('missing', listed), listed[0]);
	});

	it('requires an image tag for deploy and forbids revert on deploy', () => {
		assert.throws(() => parseArgs(['--service', 'production-api', '--action', 'deploy']), /image-tag/);
		assert.throws(
			() =>
				parseArgs([
					'--service',
					'production-api',
					'--action',
					'deploy',
					'--image-tag',
					'sha',
					'--revert-migrations',
				]),
			/revert-migrations/,
		);
		assert.equal(
			parseArgs(['--service', 'preview-api', '--action', 'dry-run']).action,
			'dry-run',
		);
	});

	it('dry-run describes revisions without mutating ECS', async () => {
		const calls = [];
		const runAws = async (args) => {
			calls.push(args);
			if (args[1] === 'describe-services') {
				return {
					services: [
						{
							taskDefinition: sampleTask.taskDefinitionArn,
							networkConfiguration: {
								awsvpcConfiguration: {
									subnets: ['subnet-1'],
									securityGroups: ['sg-1'],
									assignPublicIp: 'DISABLED',
								},
							},
						},
					],
				};
			}
			if (args[1] === 'describe-task-definition') {
				return {taskDefinition: sampleTask};
			}
			if (args[1] === 'list-task-definitions') {
				return {
					taskDefinitionArns: [
						sampleTask.taskDefinitionArn,
						'arn:aws:ecs:us-east-1:123:task-definition/medconnect-production-api:3',
					],
				};
			}
			throw new Error(`unexpected aws ${args.join(' ')}`);
		};

		const result = await deployEcsService({
			args: parseArgs(['--service', 'production-api', '--action', 'dry-run']),
			runAws,
			log() {},
		});
		assert.equal(result.dryRun, true);
		assert.equal(result.currentArn, sampleTask.taskDefinitionArn);
		assert.equal(
			result.rollbackArn,
			'arn:aws:ecs:us-east-1:123:task-definition/medconnect-production-api:3',
		);
		assert.equal(
			calls.some((args) => args.includes('register-task-definition') || args.includes('update-service')),
			false,
		);
	});
});
