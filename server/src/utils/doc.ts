import { TextDocumentPositionParams, TextDocument, TextDocuments, Position } from 'vscode-languageserver';
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as types from "@babel/types";
import generate from '@babel/generator';

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

interface moduleMethod {
	name: string;
	args: []
}

interface moduleMethods {
	methods: moduleMethod[];
}

export function getAST (code: string) {
	const ast = parser.parse(code, {
		sourceType: 'module',
		// sourceFilename: join(__dirname, 'doc.js'),
		"plugins": [
			"jsx",
			"flow",
			"classProperties"
		]
	});
	return ast;
}

export function getPropsByAST (code: string): ComCls {
	let comCls: ComCls = {
		name: '',
		props: {}
	};

	traverse(getAST(code), {
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
		const ast = getAST(code);
		traverse(ast, {
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
