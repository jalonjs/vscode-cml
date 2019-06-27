import * as cmlLinter from 'chameleon-linter';
import { TextDocument, IConnection, Diagnostic, DiagnosticSeverity, ShowMessageNotification } from 'vscode-languageserver';
import { resolve } from 'path';

interface ContentLintItem {
	file: string;
	messages: {
		column: number;
		line: number;
		msg: string;
		token: string;
	};
}

export async function cmlLint (textDocument: TextDocument, connection: IConnection, projectPath: string) {
	/**
	 * 问题：linter插件对文件列表等的glob读取没有使用绝对项目路径，导致在高层级的目录运行的时候读不到src目录文件。
	 * 解决：使用改变进程的工作目录来解决。（已同步linter后面应该会发包）
	 * 建议：最好还是都用系统绝对项目路径来搞
	 * 另外这里返回的result列表顺序为 目录，若干cml，若干interface，其他。其实最好是统一结构。
	 */
	const pcdir = process.cwd();
	process.chdir(projectPath);
	let results = await cmlLinter(projectPath);
	process.chdir(pcdir);

	if (!results || !results.length) {
		return;
	}

	// 规范化
	let resultsNormative = {
		system: {
			messages: []
		},
		ci: []
	};

	let rsm = resultsNormative.system.messages;
	results.forEach(res => {
		//  cml系统文件错误
		if (res.core) {
			rsm = rsm.concat(res.core.messages);
		}
		// cml和interface文件校验错误
		if (res.template || res.interface) {
			Object.keys(res).forEach(type => {
				if (type != 'core') {
					if (res[type].messages.length) {
						res[type].messages.forEach(msg => {
							msg.start = res[type].start;
						});
						let contentLintItem: ContentLintItem = {
							file: res[type].file,
							messages: res[type].messages
						};
						resultsNormative.ci.push(contentLintItem);
					}
				}
			});
		}
	});

	// 系统错误弹条
	if (rsm.length) {
		rsm.forEach(msg => connection.window.showErrorMessage(msg));
	}

	// 校验错误直接在文件里标出
	let rci = resultsNormative.ci;
	let diagnostics: Diagnostic[] = [];
	if (rci.length) {
		rci.forEach(item => {
			let filePath = resolve(projectPath, item.file);
			if (textDocument.uri.match(filePath)) {
				item.messages.forEach(message => {
					let start = {
						line: message.line - 2 + message.start,
						character: message.column - 1
					};

					// 没有给token结尾position，自己算。如果没有token则默认+10
					let end = {
						line: start.line,
						character: start.character + (message.token ? (message.token.length) : 10)
					};

					let diagnostic: Diagnostic = {
						severity: DiagnosticSeverity.Error,
						range: {
							start,
							end
						},
						message: message.msg,
						source: 'chameleon-linter'
					};
					diagnostic.relatedInformation = [
						{
							location: {
								uri: textDocument.uri,
								range: Object.assign({}, diagnostic.range)
							},
							message: '校验错误'
						}
					];
					diagnostics.push(diagnostic);
				});
			}
		});
	}
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
