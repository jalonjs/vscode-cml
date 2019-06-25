import { FormattingOptions } from 'vscode-languageserver';

var beautifyJs = require('js-beautify');
var beautifyCss = require('js-beautify').css;
var beautifyHtml = require('js-beautify').html;
var jsonFormat = require('json-format');

let formater = {
	template (text: string, options: FormattingOptions): string {
		return beautifyHtml(text, {
			indent_size: options.tabSize
		});
	},
	script (text: string, options: FormattingOptions): string {
		return beautifyJs(text, {
			indent_size: options.tabSize
		});
	},
	style (text: string, options: FormattingOptions): string {
		return beautifyCss(text, {
			indent_size: options.tabSize
		});
	},
	Json (text: string, options: FormattingOptions): string {
		let jsonFormatted = jsonFormat(JSON.parse(text), {
			type: 'tab',
			size: options.tabSize
		});
		return jsonFormatted;
	}
};

export default formater;
