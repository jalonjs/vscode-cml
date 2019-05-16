import { CompletionList, CompletionItem, Position, CompletionItemKind, InsertTextFormat, TextDocument } from 'vscode-languageserver';
import { getInputWord, getTextStartToPosition } from '../../utils/doc';
import { getProps } from './props-parser';
import { getUiBuiltinNames } from './ui-builtin';
import { directives } from './directives';

export function getCompletionItemsTemplate (projectPath: string, doc: TextDocument, docText: string, position: Position): CompletionList {
	let textStartToPosition = getTextStartToPosition(doc, docText, position);
	let inputWord = getInputWord(docText, position);

	let snippetCompletionsList: CompletionList = {
		isIncomplete: true,
		items: []
	};


	let usingCompMatch = docText.match(/["']usingComponents["']\:\s*(\{[\s\S]*?\})/);
	let usingCompStr = usingCompMatch ? usingCompMatch[1] : '{}';
	let usingCompObj: Object = (new Function(`
	    return ${usingCompStr};
	`))();

	const matchComProps = textStartToPosition.match(new RegExp(`<([^</>\\s]+)[\\s\\n\\t\\r]*([^</>\\s]+=(["']).*?\\3\\s*)*[\\s\\n\\t\\r]*${inputWord}$`));
	const isTypeComProps = !!matchComProps;

	if (isTypeComProps) {
		const comName = matchComProps[1];
		let comPath = usingCompObj[comName];
		let comProps = getProps(projectPath, comPath, comName, doc);
		Object.keys(comProps).forEach(k => {
			let defaultValue = (typeof comProps[k].default == 'function') ? comProps[k].default() : comProps[k].default + '';
			let key = k.replace(/[A-Z]/g, uw => `-${uw.toLowerCase()}`);
			snippetCompletionsList.items.push({
				label: `${key}="" 当前组件的属性`,
				kind: CompletionItemKind.Property,
				insertText: `${key}="$0"`,
				insertTextFormat: InsertTextFormat.Snippet,
				detail: `type: ${comProps[k].type.name || ''} \n default: "${defaultValue || ''}"`
			});
		});
		// 指令
		directives.forEach(dt => {
			snippetCompletionsList.items.push({
				label: dt.name,
				kind: CompletionItemKind.Property,
				insertText: dt.insertText,
				insertTextFormat: InsertTextFormat.Snippet
			});
		});
	} else {
		// 分为内置组件和非内置组件 将两者都返回
		let ubcKeys = getUiBuiltinNames(projectPath);
		let compsList = Object.keys(usingCompObj).concat(ubcKeys);
		compsList = [...new Set(compsList)]; // 去重
		compsList.forEach((key) => {
			let label = ubcKeys.includes(key) ? `<${key}></${key}> 内置组件` : `<${key}></${key}> 引入的组件`;
			let snippetCompletion: CompletionItem = {
				label: label,
				kind: CompletionItemKind.Snippet,
				insertText: `<${key}></${key}>`,
				insertTextFormat: InsertTextFormat.Snippet
			};
			snippetCompletionsList.items.push(snippetCompletion);
		});
	}

	return snippetCompletionsList;

}
