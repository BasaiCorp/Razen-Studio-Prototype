// Function to get the language definition based on file extension
function getLanguage(fileName) {
    const extension = fileName.split('.').pop();
    switch (extension) {
        case 'js':
            return Prism.languages.javascript;
        case 'py':
            return Prism.languages.python;
        case 'ts':
            return Prism.languages.typescript;
        default:
            return {
                'comment': {
                    pattern: /#.*/,
                    greedy: true
                },
                'string': {
                    pattern: /"(?:\\.|[^"\\])*"/,
                    greedy: true
                },
                'number': /\b\d+(?:\.\d+)?\b/,
                'boolean': /\b(?:true|false|null)\b/,
                'declaration': /\b(?:num|str|bool|var|const|fun|class|enum|struct|list|arr|map)\b/,
                'control-flow': /\b(?:if|else|while|for|when|match|return|continue|break)\b/,
                'data-structure': /\b(?:append|remove|key|value|store|box|ref)\b/,
                'io': /\b(?:show|read)\b/,
                'async': /\b(?:async|await)\b/,
                'module': /\b(?:import|export|use|from|to|lib)\b/,
                'logical': /\b(?:is|not)\b/,
                'operator': /->|=>|==|!=|<=|>=|&&|\|\||[+\-*/%=<>]/,
                'punctuation': /[{}[\];(),.:]/,
                'function': /\b[a-zA-Z_]\w*(?=\s*\()/,
                'variable': /\b[a-zA-Z_]\w*\b/
            };
    }
}