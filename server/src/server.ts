import {
	createConnection,
	InitializeParams,
	InitializeResult
} from 'vscode-languageserver';
import { CLS } from './services/cls';

const connection = process.argv.length <= 2 ? createConnection(process.stdin, process.stdout) : createConnection();

const vls = new CLS(connection);
connection.onInitialize(
	async (params: InitializeParams): Promise<InitializeResult> => {
		await vls.init(params);

		console.log('CML LS initialized');

		return {
			capabilities: vls.capabilities
		};
	}
);

vls.listen();
