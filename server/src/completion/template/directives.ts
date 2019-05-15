export const directives = [
	{
		name: 'cIf',
		insertText: `c-if="{{$0}}"`
	},
	{
		name: 'cElseIf',
		insertText: `c-else-if="{{$0}}"`
	},
	{
		name: 'cElse',
		insertText: `c-else="{{$0}}"`
	},
	{
		name: 'cModel',
		insertText: `c-model="{{$0}}"`
	},
	{
		name: 'cText',
		insertText: `c-text="{{$0}}"`
	},
	{
		name: 'cShow',
		insertText: `c-show="{{$0}}"`
	},
	{
		name: 'cAnimation',
		insertText: `c-animation="{{$0}}"`
	},
	{
		name: 'cFor',
		insertText: 'c-for="{{${1:list}}}" c-for-index="${2:index}" c-for-item="${3:item}"$0'
	},
	{
		name: 'cKey',
		insertText: 'c-key="$0"'
	},
	{
		name: 'cBind',
		insertText: 'c-bind:${1:event}="$0"'
	},
	{
		name: 'id',
		insertText: 'id="$0"'
	},
	{
		name: 'class',
		insertText: 'class="$0"'
	},
	{
		name: 'style',
		insertText: 'style="$0"'
	},
	{
		name: 'data',
		insertText: 'data-${1:name}="{{$0}}"'
	}
];
