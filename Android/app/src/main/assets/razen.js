Prism.languages.razen = {
	// Comments
	'comment': {
		pattern: /#.*/,
		greedy: true
	},
	
	// Strings
	'string': {
		pattern: /"(?:\\.|[^"\\])*"/,
		greedy: true
	},
	
	// Numbers
	'number': /\b\d+(?:\.\d+)?\b/,
	
	// Booleans and null
	'boolean': /\b(?:true|false|null)\b/,
	
	// Declaration keywords
	'declaration': /\b(?:num|str|bool|var|const|fun|class|enum|struct|list|arr|map)\b/,
	
	// Control flow keywords
	'control-flow': /\b(?:if|else|while|for|when|match|return|continue|break)\b/,
	
	// Data structure operations
	'data-structure': /\b(?:append|remove|key|value|store|box|ref)\b/,
	
	// I/O operations
	'io': /\b(?:show|read)\b/,
	
	// Async keywords
	'async': /\b(?:async|await)\b/,
	
	// Module/import keywords
	'module': /\b(?:import|export|use|from|to|lib)\b/,
	
	// Logical keywords
	'logical': /\b(?:is|not)\b/,
	
	// Operators
	'operator': /->|=>|==|!=|<=|>=|&&|\|\||[+\-*/%=<>]/,
	
	// Punctuation
	'punctuation': /[{}[\];(),.:]/,
	
	// Function calls (identifiers followed by parentheses)
	'function': /\b[a-zA-Z_]\w*(?=\s*\()/,
	
	// Variables and identifiers
	'variable': /\b[a-zA-Z_]\w*\b/
};