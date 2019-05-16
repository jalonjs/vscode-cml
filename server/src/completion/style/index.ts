import { CompletionList, CompletionItem, Position, CompletionItemKind, InsertTextFormat, TextDocument } from 'vscode-languageserver';
import { getInputWord, getTextStartToPosition } from '../../utils/doc';
import { getCSSLanguageService } from 'vscode-css-languageservice';

export function getCompletionItemsStyle (projectPath: string, doc: TextDocument, docText: string, position: Position): CompletionList {
	let service = getCSSLanguageService();
	const styleText = docText.match(/<style.*?>([\s\S]*)<\/style>/)[1];
	let cssDoc = TextDocument.create('', 'css', 1, styleText);
	let stylesheet = service.parseStylesheet(cssDoc);
	let result = getCSSLanguageService().doComplete(doc, position, stylesheet);
	let CPL = {
		isIncomplete: result.isIncomplete,
		items: []// .[..result] 或直接使用原返回不行
	};

	result.items.forEach(item => {
		CPL.items.push({
			label: item.label,
			kind: CompletionItemKind.Property,
			insertTextFormat: InsertTextFormat.Snippet,
			insertText: `${item.label}: $0`,
			documentation: item.documentation
		});
	});

	return CPL;
}
