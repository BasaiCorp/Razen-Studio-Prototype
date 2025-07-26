Prism.languages.razen = {
	'comment': /#.*/,
	'string': /"(?:\\.|[^"\\])*"/,
	'boolean': /\b(?:true|false|null)\b/,
	'number': /\b\d+(?:\.\d+)?\b/,
	'keyword': /\b(?:num|str|bool|var|const|if|else|while|for|is|when|not|list|arr|append|remove|map|key|value|store|box|ref|show|read|fun|async|await|class|return|continue|break|import|export|use|from|to|lib|enum|struct|match)\b/,
	'operator': /->|=>|==|!=|<=|>=|&&|\|\||[+\-*/%]/,
	'punctuation': /[{}[\];(),.:]/
};
