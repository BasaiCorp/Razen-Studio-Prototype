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

// JavaScript support
Prism.languages.javascript = Prism.languages.extend('javascript', {
    'comment': [
        {
            pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
            lookbehind: true,
            greedy: true
        },
        {
            pattern: /(^|[^\\:])\/\/.*/,
            lookbehind: true,
            greedy: true
        }
    ],
    'string': {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
    },
    'number': /\b(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|NaN|Infinity|\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?)/,
    'boolean': /\b(?:true|false)\b/,
    'declaration': /\b(?:var|let|const|function|class|extends|import|export|default)\b/,
    'control-flow': /\b(?:if|else|switch|case|do|while|for|break|continue|return|try|catch|finally|throw|yield|await)\b/,
    'builtin': /\b(?:Array|Date|eval|function|hasOwnProperty|Infinity|isFinite|isNaN|length|Math|NaN|name|Number|Object|prototype|String|toString|undefined|valueOf)\b/,
    'operator': /--|\+\+|&&|\|\||[!=]==?|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/,
    'punctuation': /[{}[\];(),.`]/,
    'regex': {
        pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\s*)(?:[^\/\\\r\n]|\\.)*\//,
        lookbehind: true,
        greedy: true,
        inside: {
            'regex-source': {
                pattern: /^(\/)[\s\S]+(?=\/[a-z]*)/,
                lookbehind: true,
                alias: 'language-regex',
                inside: Prism.languages.regex
            },
            'regex-delimiter': /^\/|\/$/,
            'regex-flags': /^[a-z]+$/
        }
    }
});

// Python support
Prism.languages.python = Prism.languages.extend('python', {
    'comment': {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true,
        greedy: true
    },
    'string': {
        pattern: /(?:[rub]|rb|br)?("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2/,
        greedy: true
    },
    'number': /\b(?:0[bB][01]+|0[oO][0-7]+|0[xX][\dA-Fa-f]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\.inf|\.nan)\b/,
    'boolean': /\b(?:True|False|None)\b/,
    'declaration': /\b(?:def|class|global|nonlocal|lambda)\b/,
    'control-flow': /\b(?:if|elif|else|for|while|break|continue|pass|raise|assert|try|except|finally|with|match|case)\b/,
    'builtin': /\b(?:__import__|abs|all|any|ascii|bin|bool|breakpoint|bytearray|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b/,
    'operator': /[-+*\/%!^&|<>]=?|\/\/|&|\||\^|~|<<|>>|\*\*|\.\.\./,
    'punctuation': /[{}[\];(),.:]/,
    'keyword': /\b(?:and|as|assert|async|await|del|elif|except|exec|finally|from|import|in|is|not|or|print|raise|try|while|with|yield)\b/
});

// Rust support
Prism.languages.rust = Prism.languages.extend('rust', {
    'comment': [
        {
            pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
            lookbehind: true,
            greedy: true
        },
        {
            pattern: /(^|[^\\:])\/\/.*/,
            lookbehind: true,
            greedy: true
        }
    ],
    'string': {
        pattern: /b?"(?:\\.|[^\\"])*"|b?r(#*)"(?:[^"]|"(?!\1))*"\1/,
        greedy: true
    },
    'char': {
        pattern: /b?'(?:\\(?:x[0-7][0-7]|u\{(?:[\da-fA-F]_*){1,6}\}|.)|[^\\\r\n\t'])'/,
        alias: 'string'
    },
    'number': /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:(?:\d(?:_?\d)*)?\.)?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)(?:_?(?:[iu](?:8|16|32|64|128|size)?|f32|f64))?\b/,
    'boolean': /\b(?:true|false)\b/,
    'declaration': /\b(?:fn|let|mut|const|static|struct|enum|union|trait|impl|mod|use|crate|extern|type|move|ref|where)\b/,
    'control-flow': /\b(?:if|else|while|for|loop|match|continue|break|return|become)\b/,
    'builtin': /\b(?:Self|assert|assert_eq|assert_ne|cfg|column|compile_error|concat|dbg|debug_assert|debug_assert_eq|debug_assert_ne|env|eprint|eprintln|file|format|format_args|include|include_bytes|include_str|line|macro_rules|matches|module_path|option_env|panic|print|println|select|std|stringify|thread_local|todo|try|unimplemented|unreachable|vec|write|writeln)\b/,
    'operator': /[-+*\/%!^&|<>]=?|<<=?|>>=?|::|\.{2,3}|=>|@|\?|:#?/,
    'punctuation': /[{}[\];(),.:]/,
    'attribute': {
        pattern: /#!?\[.+\]/,
        greedy: true,
        alias: 'attr-name'
    },
    'lifetime': {
        pattern: /'[^\s>']+/,
        alias: 'symbol'
    }
});