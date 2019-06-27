import { TextDocumentPositionParams, TextDocument, TextDocuments, Position } from 'vscode-languageserver';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as types from '@babel/types';
import generate from '@babel/generator';
import rMap from './replaceMap';

interface ComCls {
	name: string;
	props: Object;
}

export enum TypingKind {
	Null = 0,
	Tag = 1,
	Props = 2
}

export interface TypingComInfo {
	typingKind: TypingKind.Null | TypingKind.Tag | TypingKind.Props;
	tagName?: string;
	value: string;
}

export interface apiModuleInfo {
	name: string;
	handle: string;
}

export function getAST (code: string) {
	let ast = {};
	code = code.replace(/\.([\s\n\r])/g, `${rMap.dotInEnd}$1`);
	try {
		ast = parser.parse(code, {
			sourceType: 'module',
			// sourceFilename: join(__dirname, 'doc.js'),
			"plugins": [
				"jsx",
				"flow",
				"classProperties"
			]
		});
	} catch (e) {
		// console.error(e);
	}

	return ast;
}

export function traverseAST (code: string, handleMap: object) {
	let ast = getAST(code);
	try {
		traverse(ast, handleMap);
	} catch (e) {
		// console.error(e);
	}
}

export function getAPIModuleInfo (docText: string): apiModuleInfo {
	const apiNMs = ['chameleon-api', '@didi/chameleon-api'];
	let code = docText.match(/<script(?!\s+cml-type="json")[\s\S]*?>([\s\S]*?)<\/script>/)[1];
	let name = '';
	let handle = '';
	traverseAST(code, {
		enter (path) {
			if (types.isImportDeclaration(path.node) && apiNMs.includes(path.node.source.value)) {
				name = path.node.source.value;
				handle = path.node.specifiers[0].local.name;
			}
		}
	});
	return {
		name,
		handle
	};
}

export function getAPIMethods (projectPath: string, doc: TextDocument, docText: string, position: Position, apiModuleInfo: apiModuleInfo): string[] {
	const apiModuleName = apiModuleInfo.name;
	let apiMethods = [];
	if (apiModuleName) {
		let apiExportUri = join(projectPath, 'node_modules', apiModuleName, 'index.js');
		if (existsSync(apiExportUri)) {
			let code = readFileSync(apiExportUri).toString('utf8');
			traverseAST(code, {
				enter (path) {
					if (types.isExportDefaultDeclaration(path.node)) {
						path.node.declaration.properties.forEach(prop => {
							apiMethods.push(prop.value.name);
						});
					}
				}
			});
		}
	}
	return apiMethods;
}

export function isTypingAPI (doc: TextDocument, docText: string, position: Position, apiModuleName: string): boolean {
	const text = getTextStartToPosition(doc, docText, position);
	if (!text.endsWith('.')) {
		return false;
	}

	let typingName = '';
	let typingNameMatch = text.match(/[\s\r\n](.+)\.$/);
	if (typingNameMatch) {
		typingName = typingNameMatch[1];
	}
	return typingName == apiModuleName;
}

export function getPropsByAST (code: string): ComCls {
	let comCls: ComCls = {
		name: '',
		props: {}
	};

	traverseAST(code, {
		enter (path) {
			if (types.isClassDeclaration(path.node)) {
				comCls.name = path.node.id.name;
			}
			if (types.isClassProperty(path.node) && path.node.key.name == 'props') {
				if (types.isObjectExpression(path.node.value)) {
					path.node.value.properties.forEach(prop => {
						if (types.isIdentifier(prop.value)) {
							comCls.props[prop.key.name] = {
								default: generate(prop.value).code
							};
						} else if (types.isObjectExpression(path.node.value)) {
							comCls.props[prop.key.name] = {};
							prop.value.properties.forEach(pprop => {
								comCls.props[prop.key.name][pprop.key.name] = generate(pprop.value).code;
							});
						}
					});
				}
			}
		}
	});

	return comCls;
}

export function getTypingComInfo (docText: string, position: Position): TypingComInfo {
	let typingComInfo: TypingComInfo = {
		typingKind: 0,
		tagName: '',
		value: ''
	};
	let codeTpl = docText.match(/<template>[\s\S]*<\/template>/);
	if (codeTpl) {
		let code = codeTpl[0]
			.replace(/<!--([\s\S]*?)-->/g, '<c>$1</c>') // 注释
			.replace(/@/g, '$') // @
			.replace(/{{([\s]*)(.*?)([\s]*)}}/g, ($0, $1, $2, $3) => {
				$2 = $2.replace(/[\.\[\]]/g, '_'); // {{a.b|a[b|0]}}
				return `{{${$1}${$2}${$3}}}`;
			}); // 替换掉babel不兼容的

		traverseAST(code, {
			enter (path) {
				if (isNodeMatchPst(path.node, position)) {
					if (types.isJSXText(path.node)) {
						typingComInfo.typingKind = 1;
						typingComInfo.value = path.node.value;
					} else if (types.isJSXElement(path.node)) {
						path.node.openingElement.attributes.forEach(attrNode => {
							const startMatch = attrNode.loc.start.line - 1 <= position.line && attrNode.loc.start.column <= position.character;
							const endMatch = attrNode.loc.end.line - 1 == position.line && attrNode.loc.end.column >= position.character;
							if (startMatch && endMatch) {
								typingComInfo.typingKind = 2;
								typingComInfo.value = attrNode.name.name;
								typingComInfo.tagName = path.node.openingElement.name.name;
							}
						});
					}
				}
			}
		});
	}

	return typingComInfo;
}

function isNodeMatchPst (node, position): Boolean {
	let matched = false;
	if (types.isJSXText(node)) {
		let startMatch = false;
		if (node.value.match(/^[\s]*\n/)) {
			startMatch = node.loc.start.line == position.line;
		} else {
			startMatch = node.loc.start.line - 1 == position.line && node.loc.start.column <= position.character;
		}
		let endMatch = false;
		if (node.value.match(/\n[\s]*$/)) {
			endMatch = node.loc.end.line - 1 > position.line;
		} else {
			endMatch = node.loc.end.line - 1 == position.line && node.loc.end.column >= position.character;
		}
		matched = startMatch && endMatch;
	}
	if (types.isJSXElement(node)) {
		node.openingElement.attributes.forEach(attrNode => {
			const startMatch = attrNode.loc.start.line - 1 <= position.line && attrNode.loc.start.column <= position.character;
			const endMatch = attrNode.loc.end.line - 1 == position.line && attrNode.loc.end.column >= position.character;
			if (startMatch && endMatch) {
				matched = true;
			}
		});
	}
	// if (types.isJSXAttribute(node)) {
	// 	const startMatch = node.loc.start.line - 1 <= position.line && node.loc.start.column <= position.character;
	// 	const endMatch = node.loc.end.line - 1 == position.line && node.loc.end.column >= position.character;
	// 	matched = startMatch && endMatch;
	// }
	return matched;
}

export function getTextStartToPosition (doc: TextDocument, docText: string, position: Position): string {
	const textStartToPostion = docText.slice(0, doc.offsetAt(position));
	return textStartToPostion;
}

export function inTemplate (doc, docText: string, position: Position): boolean {
	let textStartToPostion = getTextStartToPosition(doc, docText, position);
	return textStartToPostion.includes('<template') && !textStartToPostion.includes('</template>') && !inStyle(doc, docText, position);
}

export function inScript (doc, docText: string, position: Position): boolean {
	// 不是cml json的script
	let textStartToPostion = getTextStartToPosition(doc, docText, position);
	return textStartToPostion.match(/<script(?![\s\S]+cml-type="json")/) && !textStartToPostion.includes('</script>');
}

export function inStyle (doc, docText: string, position: Position): boolean {
	let textStartToPostion = getTextStartToPosition(doc, docText, position);
	let inPart = textStartToPostion.includes('<style') && !textStartToPostion.includes('</style>');
	let embedded = !!textStartToPostion.match(/style=(["'])[^"']*$/);
	return inPart || embedded;
}

export function inJSON (doc, docText: string, position: Position): boolean {
	let textStartToPostion = getTextStartToPosition(doc, docText, position);
	let matched = textStartToPostion.match(/<script(.*?)cml-type="json"[\s\S]*$/);
	return matched && matched[0] && !matched[0].includes('</script>');
}
