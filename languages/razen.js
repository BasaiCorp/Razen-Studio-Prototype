// Wait until Monaco is loaded
if (typeof monaco === 'undefined') {
    console.error("Monaco is not loaded yet!");
} else {
    // Register the language
    monaco.languages.register({
        id: 'razen',
        extensions: ['.rzn'],
        aliases: ['Razen', 'razen'],
    });
    
    // Set language configuration
    monaco.languages.setLanguageConfiguration('razen', {
        comments: {
            lineComment: '#',
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
        ],
    });
    
    // Set tokenizer
    monaco.languages.setMonarchTokensProvider('razen', {
        keywords: [
            'num', 'str', 'bool', 'var', 'const', 'if', 'else', 'while', 'for', 'is', 'when', 'not',
            'list', 'arr', 'append', 'remove', 'map', 'key', 'value', 'store', 'box', 'ref', 'show',
            'read', 'fun', 'async', 'await', 'class', 'return', 'continue', 'break', 'import',
            'export', 'use', 'from', 'to', 'lib', 'true', 'false', 'null'
        ],
        operators: [
            '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
            '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
            '->', '=>'
        ],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        
        tokenizer: {
            root: [
                // Line comments
                [/#.*$/, 'comment'],
                
                // Whitespace
                [/[ \t\r\n]+/, ''],
                
                // Numbers
                [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                [/\d+/, 'number'],
                
                // Strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                
                // Char literals
                [/'[^\\']'/, 'string.char'],
                [/(')(@escapes)(')/, ['string.char', 'string.escape', 'string.char']],
                [/'/, 'string.invalid'],
                
                // Identifiers and keywords
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@default': 'identifier'
                    }
                }],
                
                // Brackets
                [/[{}()\[\]]/, '@brackets'],
                
                // Operators and delimiters
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': 'delimiter'
                    }
                }],
                
                // Delimiters
                [/[;,.]/, 'delimiter'],
            ],
            
            string: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
            ],
        }
    });
}