import { CompletionList, CompletionItem, Position, CompletionItemKind, InsertTextFormat, TextDocument } from 'vscode-languageserver';
import { getCompletionItemsScriptAPI } from './api';
import { isTypingAPI, getAPIModuleInfo } from '../../utils/doc';

export function getCompletionItemsScript (projectPath: string, doc: TextDocument, docText: string, position: Position): CompletionList {
	let snippetCompletionsList: CompletionList = {
		isIncomplete: true,
		items: []
	};

	// api补全
	let apiModuleInfo = getAPIModuleInfo(docText);
	snippetCompletionsList = getCompletionItemsScriptAPI(projectPath, doc, docText, position, apiModuleInfo);

	return snippetCompletionsList;
}
