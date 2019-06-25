import {
	InitializeParams,
	ServerCapabilities,
	IConnection,
	CompletionList,
	TextDocumentPositionParams,
	TextDocumentChangeEvent,
	DocumentFormattingParams,
	TextEdit
} from 'vscode-languageserver';
import { DocumentService } from './documentService';
import { getCompletionItems } from '../completion';
import { cmlLint } from '../linter';
import { cmlFormat } from '../format';

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
		// 各种补全
		this.lspConnection.onCompletion(this.onCompletion.bind(this));
		// 格式化
		this.lspConnection.onDocumentFormatting(this.onDocumentFormatting.bind(this));
		// linter
		this.documentService.onDidOpen(this.onDidOpen.bind(this));
		this.documentService.onDidChangeContent(this.onDidChangeContent.bind(this));
		this.documentService.onDidSave(this.onDidSave.bind(this));
	}
	onCompletion ({ textDocument, position }: TextDocumentPositionParams): CompletionList {
		const doc = this.documentService.getDocument(textDocument.uri)!;
		this.projectPath = this.getProjectPath(textDocument.uri);
		return getCompletionItems(this.projectPath, doc, position);
	}

	onDocumentFormatting (documentFormattingParams: DocumentFormattingParams) {
		const doc = this.documentService.getDocument(documentFormattingParams.textDocument.uri);
		return cmlFormat(doc, documentFormattingParams);
	}

	onDidOpen (change: TextDocumentChangeEvent) {
		this.projectPath = this.getProjectPath(change.document.uri);
		cmlLint(change.document, this.lspConnection, this.projectPath);
	}

	onDidSave (change: TextDocumentChangeEvent) {
		this.projectPath = this.getProjectPath(change.document.uri);
		cmlLint(change.document, this.lspConnection, this.projectPath);
	}

	onDidChangeContent (change: TextDocumentChangeEvent) {
		this.projectPath = this.getProjectPath(change.document.uri);
		cmlLint(change.document, this.lspConnection, this.projectPath);
	}

	dispose (): void {

	}

	get capabilities (): ServerCapabilities {
		return {
			completionProvider: {
				resolveProvider: false,
				triggerCharacters: ['.']
			},
			documentFormattingProvider: true
		};
	}

	getProjectPath (docUri: string) {
		return docUri.match(/^file:(.*)(?=\/src)/)[1];
	}
}
