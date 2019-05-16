import { TextDocumentPositionParams, TextDocument, TextDocuments, Position } from 'vscode-languageserver';
import * as babel from 'babel-core';
import { join } from 'path';

export function getEs5Code (es67) {
	// babel找不到包 加filename选项或者更改process执行的目录
	// const cwd = process.cwd();
	// process.chdir(__dirname);
	const es5 = babel.transform(es67, {
		"presets": [
			[
				"env",
				{
					"targets": {
						"browsers": [
							"> 1%",
							"last 2 versions",
							"not ie <= 8"
						]
					}
				}
			],
			"stage-0"
		],
		"filename": join(__dirname, 'doc.js')
	}).code;
	// process.chdir(cwd);
	return es5;
}

export function getInputWord (docText: string, position: Position): string {
	let lines = docText.split(/\r?\n/); // LF or CRLF 两种
	let lineLeft = lines[position.line].slice(0, position.character);
	let inputWord = lineLeft.match(/[^\s]*$/)[0];
	return inputWord;
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
