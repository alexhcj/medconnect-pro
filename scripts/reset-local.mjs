import {rmSync} from 'node:fs';
import {join} from 'node:path';

const root = process.cwd();
const targets = [join(root, 'node_modules'), join(root, 'apps', 'web', 'node_modules')];

for (const target of targets) {
	rmSync(target, {recursive: true, force: true});
}
