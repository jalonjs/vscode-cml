import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
export const UB_COM_PATH: string[] = [
	'node_modules/chameleon-ui-builtin/components',
	'node_modules/@didi/chameleon-ui-builtin/components'
];

export const UB_TAGS = ['view', 'text', 'block', 'cell', 'slot'];

let ubcNames: string[] = [];
export function getUiBuiltinNames (projectPath: string): string[] {
	if (ubcNames.length) {
		return ubcNames;
	}

	UB_COM_PATH.forEach((ubcp) => {
		let comPath = join(projectPath, ubcp);
		if(!existsSync(comPath)) {
			return;
		}
		let dirs = readdirSync(comPath);
		// layout不是组件，是一个目录
		dirs.splice(dirs.indexOf('layout'), 1);
		let dirsLayout = readdirSync(join(comPath + '/layout')); // 这个竟然是又分了一层目录
		ubcNames = dirs.concat(dirsLayout).concat(UB_TAGS); // 这几个是内置在编译里的
	});

	return ubcNames;
}
