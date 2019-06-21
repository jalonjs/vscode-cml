import { CompletionList, TextDocument, Position, InsertTextFormat, CompletionItemKind } from 'vscode-languageserver';
import { apiModuleInfo, getAPIMethods } from '../../utils/doc';

export function getCompletionItemsScriptAPI (projectPath: string, doc: TextDocument, docText: string, position: Position, apiModuleInfo: apiModuleInfo): CompletionList {
	let snippetCompletionsList: CompletionList = {
		isIncomplete: true,
		items: []
	};

	let apiMethods = getAPIMethods(projectPath, doc, docText, position, apiModuleInfo);
	apiMethods.forEach(am => {
		snippetCompletionsList.items.push({
			label: `${apiModuleInfo.handle}.${am}`,
			kind: CompletionItemKind.Snippet,
			insertTextFormat: InsertTextFormat.Snippet,
			insertText: `${am}($0)`
		});
	});

	return snippetCompletionsList;
}
