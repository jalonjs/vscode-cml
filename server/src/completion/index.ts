import { inTemplate, inScript, inStyle, inJSON } from '../utils/doc';
import { TextDocument, CompletionList, Position } from 'vscode-languageserver';
import { getCompletionItemsTemplate } from './template';
import { getCompletionItemsStyle } from './style';
import { getCompletionItemsScript } from './script';

export function getCompletionItems (projectPath: string, doc: TextDocument, position: Position): CompletionList {
	let docText = doc.getText();
	let snippetCompletionsList: CompletionList = {
		isIncomplete: true,
		items: []
	};

	if (inTemplate(doc, docText, position)) {
		snippetCompletionsList = getCompletionItemsTemplate(projectPath, doc, docText, position);
	}

	if (inStyle(doc, docText, position)) {
		snippetCompletionsList = getCompletionItemsStyle(projectPath, doc, docText, position);
	}

	if (inScript(doc, docText, position)) {
		snippetCompletionsList = getCompletionItemsScript(projectPath, doc, docText, position);
	}

	return snippetCompletionsList;
}
