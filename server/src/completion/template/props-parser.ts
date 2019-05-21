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
		switch (comPath.charAt(0)) {
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

	// 兼容在最后一个props括号后加逗号的情况...
	let comCls = utils.getPropsByAST(compScriptStr);

	return comCls.props;
}
