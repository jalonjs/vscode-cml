import {
	InitializeParams,
	ServerCapabilities,
	IConnection,
	CompletionList,
	TextDocumentPositionParams,
	TextDocumentChangeEvent
} from 'vscode-languageserver';
import { DocumentService } from './documentService';
import { getCompletionItems } from '../completion';
import { cmlLint } from '../linter';

export class CLS {
	private projectPath: string;
	private documentService: DocumentService;

	constructor(private lspConnection: IConnection) {
		this.documentService = new DocumentService(this.lspConnection);
	}

	async init (params: InitializeParams) {
		const workspacePath = params.rootPath;
		if (!workspacePath) {
			return {
				capabilities: {}
			};
		}

		this.setupLSPHandlers();
		this.lspConnection.onShutdown(() => {
			this.dispose();
		});
	}

	listen () {
		this.lspConnection.listen();
	}

	private setupLSPHandlers () {
		this.lspConnection.onCompletion(this.onCompletion.bind(this));
		this.documentService.onDidOpen(this.onDidOpen.bind(this));
		this.documentService.onDidChangeContent(this.onDidChangeContent.bind(this));
		this.documentService.onDidSave(this.onDidSave.bind(this));
	}

	onCompletion ({ textDocument, position }: TextDocumentPositionParams): CompletionList {
		const doc = this.documentService.getDocument(textDocument.uri)!;
		this.projectPath = textDocument.uri.match(/^file:(.*)(?=\/src)/)[1];
		return getCompletionItems(this.projectPath, doc, position);
	}

	onDidOpen (change: TextDocumentChangeEvent) {
		this.projectPath = change.document.uri.match(/^file:(.*)(?=\/src)/)[1];
		cmlLint(change.document, this.lspConnection, this.projectPath);
	}

	onDidSave (change: TextDocumentChangeEvent) {
		this.projectPath = change.document.uri.match(/^file:(.*)(?=\/src)/)[1];
		cmlLint(change.document, this.lspConnection, this.projectPath);
	}

	onDidChangeContent (change: TextDocumentChangeEvent) {
		this.projectPath = change.document.uri.match(/^file:(.*)(?=\/src)/)[1];
		cmlLint(change.document, this.lspConnection, this.projectPath);
	}

	dispose (): void {

	}

	get capabilities (): ServerCapabilities {
		return {
			completionProvider: { resolveProvider: false }
		};
	}
}
