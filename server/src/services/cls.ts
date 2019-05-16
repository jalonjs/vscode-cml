import {
	InitializeParams,
	ServerCapabilities,
	IConnection,
	CompletionList,
	TextDocumentPositionParams
} from 'vscode-languageserver';
import { DocumentService } from './documentService';
import { getCompletionItems } from '../completion';

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
	}

	onCompletion ({ textDocument, position }: TextDocumentPositionParams): CompletionList {
		const doc = this.documentService.getDocument(textDocument.uri)!;
		this.projectPath = textDocument.uri.match(/^file:(.*)(?=\/src)/)[1];
		return getCompletionItems(this.projectPath, doc, position);
	}

	dispose (): void {

	}

	get capabilities (): ServerCapabilities {
		return {
			completionProvider: { resolveProvider: false }
		};
	}
}
