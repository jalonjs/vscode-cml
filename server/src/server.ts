import {
	createConnection,
	InitializeParams,
	InitializeResult
} from 'vscode-languageserver';
import { CLS } from './services/cls';

const connection = process.argv.length <= 2 ? createConnection(process.stdin, process.stdout) : createConnection();

const cls = new CLS(connection);
connection.onInitialize(
	async (params: InitializeParams): Promise<InitializeResult> => {
		await cls.init(params);

		console.log('CML LS initialized');

		return {
			capabilities: cls.capabilities
		};
	}
);

cls.listen();
