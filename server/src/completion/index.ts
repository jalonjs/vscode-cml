import { inTemplate, inScript, inStyle, inJSON } from '../utils/doc';
import { TextDocument, CompletionList, Position } from 'vscode-languageserver';
import { getCompletionItemsTemplate } from './template';
import { getCompletionItemsStyle } from './style';
import { getCompletionItemsScript } from './script';

export function getCompletionItems (projectPath: string, doc: TextDocument, position: Position): CompletionList {
	let docText = doc.getText();
	
	if (inTemplate(doc, docText, position)) {
		return getCompletionItemsTemplate(projectPath, doc, docText, position);
	}

	if (inStyle(doc, docText, position)) {
		return getCompletionItemsStyle(projectPath, doc, docText, position);
	}
	
	if (inScript(doc, docText, position)) {
		return getCompletionItemsScript(projectPath, doc, docText, position);
	}

	let snippetCompletionsList: CompletionList = {
		isIncomplete: true,
		items: []
	};

	return snippetCompletionsList;
}
