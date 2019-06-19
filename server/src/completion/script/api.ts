import { CompletionList, TextDocument, Position } from 'vscode-languageserver';


export function getCompletionItemsScriptAPI (projectPath: string, doc: TextDocument, docText: string, position: Position): CompletionList {
	let snippetCompletionsList: CompletionList = {
		isIncomplete: true,
		items: []
	};



	return snippetCompletionsList;
}

export function isTypingAPI (docText: string, position: Position): boolean {
	return true;
}
