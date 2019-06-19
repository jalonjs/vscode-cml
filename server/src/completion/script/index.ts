import { CompletionList, CompletionItem, Position, CompletionItemKind, InsertTextFormat, TextDocument } from 'vscode-languageserver';
import { getCompletionItemsScriptAPI, isTypingAPI } from './api';

export function getCompletionItemsScript (projectPath: string, doc: TextDocument, docText: string, position: Position): CompletionList {
	let snippetCompletionsList: CompletionList = {
		isIncomplete: true,
		items: []
	};

	// 对于api需要
	if(isTypingAPI(docText, position)) {
		snippetCompletionsList = getCompletionItemsScriptAPI(projectPath, doc, docText, position);
	}

	return snippetCompletionsList;
}
