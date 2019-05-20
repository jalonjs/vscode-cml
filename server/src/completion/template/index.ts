import { CompletionList, CompletionItem, Position, CompletionItemKind, InsertTextFormat, TextDocument } from 'vscode-languageserver';
import { getTypingComInfo, TypingKind } from '../../utils/doc';
import { getProps } from './props-parser';
import { getUiBuiltinNames } from './ui-builtin';
import { directives } from './directives';

export function getCompletionItemsTemplate (projectPath: string, doc: TextDocument, docText: string, position: Position): CompletionList {
	let snippetCompletionsList: CompletionList = {
		isIncomplete: true,
		items: []
	};

	let usingCompMatch = docText.match(/["']usingComponents["']\:\s*(\{[\s\S]*?\})/);
	let usingCompStr = usingCompMatch ? usingCompMatch[1] : '{}';
	let usingCompObj: Object = (new Function(`
	    return ${usingCompStr};
	`))();

	const typingComInfo = getTypingComInfo(docText, position);

	if (typingComInfo.typingKind == TypingKind.Props) {
		const comName = typingComInfo.tagName;
		let comPath = usingCompObj[comName];
		let comProps = getProps(projectPath, comPath, comName, doc);
		Object.keys(comProps).forEach(k => {
			let key = k.replace(/[A-Z]/g, uw => `-${uw.toLowerCase()}`);
			const keyNode = comProps[k];
			let detail = '';
			Object.keys(keyNode).forEach(name => {
				detail = detail + `${name}: ${keyNode[name]}\n`;
			});
			snippetCompletionsList.items.push({
				label: `${key}="" 当前组件的属性`,
				kind: CompletionItemKind.Property,
				insertText: `${key}="$0"`,
				insertTextFormat: InsertTextFormat.Snippet,
				detail: detail
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
	} else if (typingComInfo.typingKind == TypingKind.Tag) {
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
