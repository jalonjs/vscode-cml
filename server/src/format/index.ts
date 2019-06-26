import { DocumentFormattingParams, TextDocument, Position, Range, TextEdit } from 'vscode-languageserver';
import formater from './formater';

export async function cmlFormat (doc: TextDocument, formatParams: DocumentFormattingParams) {
	let text = doc.getText();
	let options = formatParams.options;

	let newText = text
		// cml单文件
		.replace(/<template>([\s\S]*?)<\/template>/, ($0, $1) => {
			return `<template>\n${formater.template($1, options)}\n</template>`;
		})
		.replace(/<script>([\s\S]*?)<\/script>/, ($0, $1) => {
			return `<script>\n${formater.script($1, options)}\n</script>`;
		})
		.replace(/<style(.*?)>([\s\S]*?)<\/style>/, ($0, $1, $2) => {
			return `<style${$1}>\n${formater.style($2, options)}\n</style>`;
		})
		.replace(/<script cml-type="json">([\s\S]*?)<\/script>/, ($0, $1) => {
			return `<script cml-type="json">\n${formater.Json($1, options)}\n</script>`;
		})
		// interface文件
		.replace(/<script cml-type="((?!json).*?)">([\s\S]*?)<\/script>/g, ($0, $1, $2) => {
			return `<script cml-type="${$1}">\n${formater.script($2, options)}\n</script>`;
		});

	const editRange = Range.create(Position.create(0, 0), doc.positionAt(text.length));
	return [TextEdit.replace(editRange, newText)];
}


