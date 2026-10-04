#!/usr/bin/env node
/**
 * Deploy or roll back a MedConnect API ECS service from GitHub Actions (INFRA-011).
 * Does not publish Amplify. Secrets stay in the task definition; this script never prints them.
 */

import {execFile as execFileCallback} from 'node:child_process';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';

const execFile = promisify(execFileCallback);

export const API_CONTAINER = 'api';
export const MIGRATE_COMMAND = ['node', 'apps/api/dist/persistence/run-migrations.js'];
export const REGISTER_STRIP_KEYS = [
	'taskDefinitionArn',
	'revision',
	'status',
	'requiresAttributes',
	'compatibilities',
	'registeredAt',
	'registeredBy',
	'deregisteredAt',
];

export function parseArgs(argv, env = process.env) {
	const args = {
		cluster: 'medconnect',
		service: '',
		action: 'deploy',
		imageTag: '',
		taskDefinition: '',
		repositoryName: 'medconnect-api',
		revertMigrations: false,
		waitSeconds: Number(env.ECS_DEPLOY_WAIT_SECONDS || 600),
	};

	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		const next = argv[i + 1];
		if (token === '--cluster' && next) {
			args.cluster = next;
			i += 1;
		} else if (token === '--service' && next) {
			args.service = next;
			i += 1;
		} else if (token === '--action' && next) {
			args.action = next;
			i += 1;
		} else if (token === '--image-tag' && next) {
			args.imageTag = next;
			i += 1;
		} else if (token === '--task-definition' && next) {
			args.taskDefinition = next;
			i += 1;
		} else if (token === '--repository-name' && next) {
			args.repositoryName = next;
			i += 1;
		} else if (token === '--wait-seconds' && next) {
			args.waitSeconds = Number(next);
			i += 1;
		} else if (token === '--revert-migrations') {
			args.revertMigrations = true;
		}
	}

	if (!['deploy', 'rollback', 'dry-run'].includes(args.action)) {
		throw new Error(`Unsupported action: ${args.action}`);
	}
	if (!args.service) {
		throw new Error('--service is required');
	}
	if (args.action === 'deploy' && !args.imageTag) {
		throw new Error('--image-tag is required for deploy');
	}
	if (args.revertMigrations && args.action === 'deploy') {
		throw new Error('--revert-migrations is not allowed on deploy; use rollback');
	}
	return args;
}

export function toRegisterPayload(taskDefinition) {
	const payload = structuredClone(taskDefinition);
	for (const key of REGISTER_STRIP_KEYS) {
		delete payload[key];
	}
	return payload;
}

export function apiContainer(taskDefinition) {
	const payload = toRegisterPayload(taskDefinition);
	const container =
		payload.containerDefinitions?.find((entry) => entry.name === API_CONTAINER) ??
		payload.containerDefinitions?.[0];
	if (!container) {
		throw new Error('Task definition has no container definitions');
	}
	return {payload, container};
}

export function withImage(taskDefinition, image) {
	const {payload, container} = apiContainer(taskDefinition);
	container.image = image;
	return payload;
}

export function withMigrateCommand(taskDefinition, {revert = false} = {}) {
	const {payload, container} = apiContainer(taskDefinition);
	container.command = revert ? [...MIGRATE_COMMAND, '--revert'] : [...MIGRATE_COMMAND];
	delete container.healthCheck;
	return payload;
}

export function ecrRegistryFromImage(image) {
	const slash = String(image).indexOf('/');
	if (slash <= 0) {
		throw new Error(`Cannot parse ECR registry from image ${image}`);
	}
	return image.slice(0, slash);
}

export function imageUri(registry, repositoryName, tag) {
	return `${registry}/${repositoryName}:${tag}`;
}

export function previousTaskDefinitionArn(currentArn, listedNewestFirst) {
	const list = listedNewestFirst.filter(Boolean);
	const index = list.indexOf(currentArn);
	if (index >= 0) {
		return list[index + 1] ?? null;
	}
	return list.find((arn) => arn !== currentArn) ?? null;
}

export function networkFromService(service) {
	const net = service.networkConfiguration?.awsvpcConfiguration;
	if (!net?.subnets?.length) {
		throw new Error('Service has no awsvpc network configuration');
	}
	return {
		awsvpcConfiguration: {
			subnets: net.subnets,
			securityGroups: net.securityGroups ?? [],
			assignPublicIp: net.assignPublicIp ?? 'DISABLED',
		},
	};
}

export function createAwsRunner(exec = execFile) {
	return async function runAws(args, {json = true} = {}) {
		const {stdout} = await exec('aws', args, {
			encoding: 'utf8',
			maxBuffer: 20 * 1024 * 1024,
		});
		if (!json || !String(stdout).trim()) {
			return stdout;
		}
		return JSON.parse(stdout);
	};
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function waitForImage(runAws, {repositoryName, imageTag, waitSeconds}) {
	const deadline = Date.now() + waitSeconds * 1000;
	let lastError = null;
	while (Date.now() < deadline) {
		try {
			await runAws([
				'ecr',
				'describe-images',
				'--repository-name',
				repositoryName,
				'--image-ids',
				`imageTag=${imageTag}`,
			]);
			return;
		} catch (error) {
			lastError = error;
			await sleep(5000);
		}
	}
	throw new Error(
		`Timed out waiting for ${repositoryName}:${imageTag}. ${lastError instanceof Error ? lastError.message : lastError}`,
	);
}

async function withCliInputJson(payload, run) {
	const dir = await mkdtemp(path.join(tmpdir(), 'ecs-deploy-'));
	const file = path.join(dir, 'input.json');
	try {
		await writeFile(file, JSON.stringify(payload));
		return await run(`file://${file.replaceAll('\\', '/')}`);
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
}

async function registerTaskDefinition(runAws, payload) {
	const registered = await withCliInputJson(payload, (fileUri) =>
		runAws(['ecs', 'register-task-definition', '--cli-input-json', fileUri]),
	);
	const arn = registered.taskDefinition?.taskDefinitionArn;
	if (!arn) {
		throw new Error('register-task-definition did not return a taskDefinitionArn');
	}
	return arn;
}

async function runMigrateTask(runAws, {cluster, taskDefinitionArn, network}) {
	const started = await withCliInputJson(
		{
			cluster,
			taskDefinition: taskDefinitionArn,
			launchType: 'FARGATE',
			networkConfiguration: network,
		},
		(fileUri) => runAws(['ecs', 'run-task', '--cli-input-json', fileUri]),
	);
	const failures = started.failures ?? [];
	if (failures.length > 0) {
		throw new Error(`RunTask failed: ${JSON.stringify(failures)}`);
	}
	const taskArn = started.tasks?.[0]?.taskArn;
	if (!taskArn) {
		throw new Error('RunTask did not return a task ARN');
	}
	await runAws(['ecs', 'wait', 'tasks-stopped', '--cluster', cluster, '--tasks', taskArn], {
		json: false,
	});
	const described = await runAws(['ecs', 'describe-tasks', '--cluster', cluster, '--tasks', taskArn]);
	const container = described.tasks?.[0]?.containers?.[0];
	const exitCode = container?.exitCode;
	if (exitCode !== 0) {
		throw new Error(
			`Migrate task ${taskArn} exited ${exitCode ?? 'unknown'} (${container?.reason ?? described.tasks?.[0]?.stoppedReason ?? 'no reason'})`,
		);
	}
}

async function describeLatestFamily(runAws, family) {
	const listed = await runAws([
		'ecs',
		'list-task-definitions',
		'--family-prefix',
		family,
		'--sort',
		'DESC',
		'--max-items',
		'20',
	]);
	return listed.taskDefinitionArns ?? [];
}

export async function deployEcsService(options) {
	const args = options.args ?? parseArgs(options.argv ?? process.argv.slice(2), options.env);
	const runAws = options.runAws ?? createAwsRunner();
	const log = options.log ?? console.log;

	const described = await runAws([
		'ecs',
		'describe-services',
		'--cluster',
		args.cluster,
		'--services',
		args.service,
	]);
	const service = described.services?.[0];
	if (!service?.taskDefinition) {
		throw new Error(`Service ${args.service} was not found in cluster ${args.cluster}`);
	}

	const currentArn = service.taskDefinition;
	const currentTask = (
		await runAws(['ecs', 'describe-task-definition', '--task-definition', currentArn])
	).taskDefinition;
	const family = currentTask.family;
	const familyArns = await describeLatestFamily(runAws, family);
	const latestArn = familyArns[0] ?? currentArn;
	const latestTask =
		latestArn === currentArn
			? currentTask
			: (await runAws(['ecs', 'describe-task-definition', '--task-definition', latestArn]))
					.taskDefinition;
	const currentImage = apiContainer(currentTask).container.image;
	const registry = ecrRegistryFromImage(currentImage);
	const intendedImage = args.imageTag
		? imageUri(registry, args.repositoryName, args.imageTag)
		: currentImage;
	const rollbackArn = args.taskDefinition || previousTaskDefinitionArn(currentArn, familyArns);
	const network = networkFromService(service);

	log(
		JSON.stringify(
			{
				action: args.action,
				cluster: args.cluster,
				service: args.service,
				currentTaskDefinition: currentArn,
				latestFamilyTaskDefinition: latestArn,
				previousTaskDefinition: rollbackArn,
				intendedImage,
				revertMigrations: args.revertMigrations,
			},
			null,
			2,
		),
	);

	if (args.action === 'dry-run') {
		log('Dry run only. No RegisterTaskDefinition, RunTask, or UpdateService.');
		return {
			dryRun: true,
			currentArn,
			rollbackArn,
			intendedImage,
		};
	}

	if (args.action === 'rollback') {
		if (!rollbackArn) {
			throw new Error('No previous task definition revision is available to roll back to');
		}
		if (args.revertMigrations) {
			const migratePayload = withMigrateCommand(currentTask, {revert: true});
			const migrateArn = await registerTaskDefinition(runAws, migratePayload);
			log(`Reverting last migration with ${migrateArn}`);
			await runMigrateTask(runAws, {cluster: args.cluster, taskDefinitionArn: migrateArn, network});
		}
		await runAws([
			'ecs',
			'update-service',
			'--cluster',
			args.cluster,
			'--service',
			args.service,
			'--task-definition',
			rollbackArn,
		]);
		await runAws(
			['ecs', 'wait', 'services-stable', '--cluster', args.cluster, '--services', args.service],
			{json: false},
		);
		log(`Rolled ${args.service} back to ${rollbackArn}`);
		return {rolledBackTo: rollbackArn};
	}

	await waitForImage(runAws, {
		repositoryName: args.repositoryName,
		imageTag: args.imageTag,
		waitSeconds: args.waitSeconds,
	});

	const serveBase = withImage(latestTask, intendedImage);
	const migratePayload = withMigrateCommand(serveBase);
	const migrateArn = await registerTaskDefinition(runAws, migratePayload);
	log(`Running migrations with ${migrateArn}`);
	await runMigrateTask(runAws, {cluster: args.cluster, taskDefinitionArn: migrateArn, network});

	const serveArn = await registerTaskDefinition(runAws, serveBase);
	await runAws([
		'ecs',
		'update-service',
		'--cluster',
		args.cluster,
		'--service',
		args.service,
		'--task-definition',
		serveArn,
	]);
	await runAws(
		['ecs', 'wait', 'services-stable', '--cluster', args.cluster, '--services', args.service],
		{json: false},
	);
	log(`Updated ${args.service} to ${serveArn}`);
	return {deployed: serveArn, image: intendedImage};
}

function isCliEntrypoint() {
	const entry = process.argv[1];
	if (!entry) {
		return false;
	}
	return path.basename(entry) === 'ecs-deploy.mjs';
}

if (isCliEntrypoint()) {
	deployEcsService({argv: process.argv.slice(2)}).catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
