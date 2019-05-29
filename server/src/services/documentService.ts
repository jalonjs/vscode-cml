import { IConnection, TextDocuments } from 'vscode-languageserver';

export class DocumentService {
	private documents: TextDocuments;

	constructor(conn: IConnection) {
		this.documents = new TextDocuments();
		this.documents.listen(conn);
	}

	getDocument (uri: string) {
		return this.documents.get(uri);
	}

	getAllDocuments () {
		return this.documents.all();
	}

	get onDidOpen () {
		return this.documents.onDidOpen;
	}

	get onDidSave () {
		return this.documents.onDidSave;
	}

	get onDidChangeContent () {
		return this.documents.onDidChangeContent;
	}
	get onDidClose () {
		return this.documents.onDidClose;
	}
}
