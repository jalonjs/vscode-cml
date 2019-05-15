import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as utils from '../../utils/doc';
import { UB_COM_PATH, UB_TAGS } from './ui-builtin';
import { TextDocument } from 'vscode-languageserver';

export function getProps (projectPath: string, comPath: string | undefined, comName: string, doc: TextDocument) {
	let comInstance = {
		props: {}
	};

	// 超级内置组件不处理
	if (UB_TAGS.includes(comName)) {
		return comInstance.props;
	}

	// 内置组件
	if (!comPath) {
		// 内置组件 外部和外部内置组件npm包
		comPath = existsSync(join(projectPath, UB_COM_PATH[0])) ? UB_COM_PATH[0] : UB_COM_PATH[1];
		comPath = join(projectPath, comPath, comName, comName);
	} else {
		// 普通组件
		let connector = '';
		switch (comPath.slice(0, 1)) {
			case '/':
				connector = 'src';
				comPath = join(projectPath, connector, comPath);
				break;
			case '.':
				connector = '';
				const docDirUri = doc.uri.match(/^.*\//)[0].replace(/^file:/, '');
				comPath = join(docDirUri, comPath);
				break;
			default:
				connector = 'node_modules';
				comPath = join(projectPath, connector, comPath);
				break;
		}

	}

	// cml后缀和interface后缀两种，interface的时候读其中一端
	comPath = existsSync(comPath + '.cml') ? comPath + '.cml' : comPath + '.web.cml';

	// 组件地址写错不处理
	if (!existsSync(comPath)) {
		return comInstance.props;
	}

	let compSugStr = readFileSync(comPath).toString('utf8');
	let compScriptStr = compSugStr.match(/<script>([\s\S]*?)<\/script>/)[1];
	let compClassStr = compScriptStr.match(/class\s+(.+?)(\s+implements\s+.+)?\s+{[\s\S]*}/);
	let compClassName = compClassStr[1].trim();
	let compClassStrSpl = compClassStr[0].replace(/implements\s+.*?\s+(?=\{)/, '');

	// 兼容在最后一个props括号后加逗号的情况...
	compClassStrSpl = compClassStrSpl.replace(/,[\r\n\s]*}/g, '}').replace(/}[\r\n\s]*}/g, '}}');
	let propStr = compClassStrSpl.match(/props[\s\S]*?=([\s\S]*?)}}/)[0];
	let compClassStrSplOnlyProps = `
		class ${compClassName} {
			${propStr}
		}
	`;
	let compClassEs5 = utils.getEs5Code(compClassStrSplOnlyProps);

	// 两种类型分别处理
	comInstance = (new Function(`
		// 兼容直接出现的require方法
		let require = uri => uri;
		let ins = {};
		try {
			${compClassEs5};
			ins = new ${compClassName}();
		}catch(e) {
			ins = {}
		}
		return ins;
	`))();

	return comInstance.props;
}
