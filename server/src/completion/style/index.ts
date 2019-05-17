import { CompletionList, CompletionItem, Position, CompletionItemKind, InsertTextFormat, TextDocument } from 'vscode-languageserver';
import { getLESSLanguageService } from 'vscode-css-languageservice';

export function getCompletionItemsStyle (projectPath: string, doc: TextDocument, docText: string, position: Position): CompletionList {
	let service = getLESSLanguageService();
	let lines = docText.split(/[\n]/g);
	let styleLineStartIndex = 0;
	let styleLineEndIndex = 0;
	lines.forEach((line, index) => {
		if (line.match(/^[\s]*<style/)) {
			styleLineStartIndex = index;
		}
		if (line.match(/^[\s]*<\/style>/)) {
			styleLineEndIndex = index;
		}
	});
	const styleText = lines.slice(styleLineStartIndex + 1, styleLineEndIndex).join('\n');
	let cssDoc = TextDocument.create('', 'css', 1, styleText);
	let stylesheet = service.parseStylesheet(cssDoc);
	position.line = position.line - (styleLineStartIndex + 1);
	let result = getLESSLanguageService().doComplete(cssDoc, position, stylesheet);
	
	let CPL = {
		isIncomplete: result.isIncomplete,
		items: []
	};

	result.items.forEach(item => {
		CPL.items.push({
			command: item.command,
			label: item.label,
			kind: item.kind,
			insertTextFormat: InsertTextFormat.Snippet,
			insertText: item.textEdit.newText.startsWith(':') ? item.textEdit.newText.slice(1) : item.textEdit.newText,
			documentation: item.documentation
		});
	});

	return CPL;
}
