import {
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    CompletionItem,
    CompletionItemKind,
    TextDocumentSyncKind,
    InsertTextFormat,
    MarkupKind,
    SemanticTokensBuilder,
} from 'vscode-languageserver/browser.js';

import { TextDocument } from 'vscode-languageserver-textdocument';

export function startRazenServer(connection) {
    const documents = new TextDocuments(TextDocument);

    function toPascalCase(str) {
        if (!str) return '';
        const lowerStr = str.toLowerCase();
        const canonicalKey = Object.keys(LIBRARIES).find(key => key.toLowerCase() === lowerStr);
        return canonicalKey || (str.charAt(0).toUpperCase() + str.slice(1));
    }

    const TOKEN_TYPES = {
        'let': {
            expectedType: 'number',
            description: 'Numeric variable declaration - should only be used with numbers'
        },
        'take': {
            expectedType: 'string',
            description: 'String variable declaration - should only be used with strings'
        },
        'hold': {
            expectedType: 'boolean',
            description: 'Boolean variable declaration - should only be used with booleans or boolean expressions'
        },
        'put': {
            expectedType: 'any',
            description: 'General variable declaration - can be used with any type'
        },
        'sum': {
            expectedType: 'number',
            description: 'Sum calculation - should only be used with numeric expressions'
        },
        'diff': {
            expectedType: 'number',
            description: 'Difference calculation - should only be used with numeric expressions'
        },
        'prod': {
            expectedType: 'number',
            description: 'Product calculation - should only be used with numeric expressions'
        },
        'div': {
            expectedType: 'number',
            description: 'Division calculation - should only be used with numeric expressions'
        },
        'mod': {
            expectedType: 'number',
            description: 'Modulus calculation - should only be used with numeric expressions'
        },
        'text': {
            expectedType: 'string',
            description: 'String data storage - should only be used with strings'
        },
        'concat': {
            expectedType: 'string',
            description: 'String concatenation - should only be used with strings'
        },
        'slice': {
            expectedType: 'string',
            description: 'Substring extraction - should only be used with strings'
        },
        'len': {
            expectedType: 'string',
            description: 'String length - should only be used with strings'
        },
        'list': {
            expectedType: 'array',
            description: 'Dynamic array - should be used with array literals'
        },
        'arr': {
            expectedType: 'array',
            description: 'Fixed-size array - should be used with array literals'
        }
    };

    const LIBRARIES = {
        "Array": ["push", "pop", "shift", "unshift", "slice", "splice", "concat", "join", "index_of", "last_index_of", "includes", "reverse", "sort", "map", "filter", "reduce", "every", "some", "find", "find_index", "fill", "length"],
        "String": ["upper", "lower", "capitalize", "substring", "replace", "replace_all", "trim", "trim_start", "trim_end", "starts_with", "ends_with", "includes", "split", "repeat", "pad_start", "pad_end", "char_at", "code_point_at", "from_char_code", "length"],
        "Math": ["add", "subtract", "multiply", "divide", "modulo", "power", "sqrt", "abs", "round", "floor", "ceil", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "log", "exp", "min", "max", "clamp", "lerp", "random", "random_int", "random_float", "mean", "median", "mode", "variance", "stddev"],
        "Datetime": ["now", "parse", "format", "year", "month", "day", "hour", "minute", "second", "millisecond", "weekday", "weekday_name", "is_leap_year", "days_in_month", "add_days", "add_months", "add_years", "add_hours", "add_minutes", "add_seconds", "diff_days", "diff_months", "diff_years", "to_timestamp", "from_timestamp"],
        "Random": ["seed", "int", "float", "choice", "shuffle", "sample", "random", "weighted_choice", "uuid", "gaussian", "noise"],
        "Filesystem": ["exists", "is_file", "is_dir", "create_file", "create_dir", "remove", "read_file", "write_file", "append_file", "list_dir", "copy_file", "copy_dir", "move_file", "delete_file", "delete_dir", "absolute_path", "relative_path", "extension", "file_stem", "parent_dir", "join_path", "current_dir", "change_dir", "temp_file", "temp_dir", "metadata", "read_json", "write_json"],
        "Json": ["parse", "stringify", "validate", "minify", "pretty_print"],
        "Network": ["get", "post", "put", "delete", "patch", "head", "options", "fetch", "download_file", "upload_file", "ping", "resolve_dns", "get_ip", "url_encode", "url_decode", "build_query", "parse_query", "create_api", "execute_api", "parse_json", "to_json", "is_success", "is_client_error", "is_server_error", "websocket_connect", "websocket_send", "websocket_receive", "websocket_close", "form_data", "multipart_data"],
        "System": ["getpid", "getcwd", "execute", "getenv", "setenv", "environ", "args", "path_exists", "realpath", "exit", "sleep", "hostname", "username", "uptime", "os_type", "os_release", "cpu_count", "memory_info", "disk_usage", "load_average", "reboot", "shutdown", "suspend"],
        "Process": ["create", "wait", "is_running", "kill", "signal", "list", "info", "read_stdout", "read_stderr", "write_stdin", "priority", "suspend", "resume"],
        "Validation": ["email", "phone", "url", "ip", "required", "min_length", "max_length", "between", "regex", "is_numeric", "is_integer", "is_float", "is_boolean", "is_date", "is_json", "is_uuid"],
        "Regex": ["match", "search", "replace", "split", "findall", "compile", "groups"],
        "Crypto": ["hash", "hmac", "encrypt", "decrypt", "generate_key", "sign", "verify", "random_bytes", "pbkdf2", "base64_encode", "base64_decode", "md5", "sha1", "sha256", "sha512"],
        "Uuid": ["generate", "parse", "validate", "v1", "v4"],
        "Color": ["hex_to_rgb", "rgb_to_hex", "lighten", "darken", "blend", "contrast", "get_ansi_color", "rgba_to_hex", "hex_to_rgba"],
        "Image": ["load", "save", "resize", "crop", "rotate", "flip", "blur", "sharpen", "grayscale", "invert", "draw_text", "draw_shape", "add_watermark"],
        "Audio": ["load", "play", "pause", "stop", "record", "save", "volume", "balance", "duration", "trim", "fade_in", "fade_out"],
        "Video": ["load", "play", "pause", "stop", "record", "save", "trim", "resize", "add_subtitles", "extract_audio", "screenshot"],
        "Compression": ["zip", "unzip", "gzip", "gunzip", "tar", "untar", "compress", "decompress"],
        "Archive": ["create", "extract", "list", "add_file", "remove_file"],
        "Logging": ["info", "warn", "error", "debug", "fatal", "trace", "set_level", "get_level", "add_handler", "remove_handler", "format", "rotate"],
        "Config": ["load", "save", "get", "set", "remove", "list", "validate", "merge", "default"],
        "Cache": ["set", "get", "has", "remove", "clear", "keys", "size", "ttl"],
        "Database": ["connect", "disconnect", "execute", "query", "fetch_one", "fetch_all", "commit", "rollback", "begin_transaction", "migrate", "seed", "close", "escape", "prepare"],
        "Http": ["start", "stop", "route", "listen", "serve_static", "send_response", "set_header", "get_header", "parse_request", "parse_body", "middleware", "redirect", "status"],
        "Html": ["parse", "stringify", "escape", "unescape", "select", "query", "add_class", "remove_class", "set_attr", "get_attr", "inner_html", "outer_html"],
        "Template": ["render", "compile", "include", "escape", "loop", "if", "else", "set", "get", "partial"],
        "Csv": ["parse", "stringify", "read", "write", "validate", "headers", "rows", "columns"],
        "Xml": ["parse", "stringify", "validate", "get_attr", "set_attr", "find", "find_all"],
        "Yaml": ["parse", "stringify", "validate", "merge", "flatten"],
        "Ini": ["parse", "stringify", "get", "set", "remove", "sections"],
        "Notification": ["send", "schedule", "cancel", "list", "history"],
        "Email": ["send", "receive", "parse", "validate", "attach", "list", "delete"],
        "Sms": ["send", "receive", "parse", "validate", "history"],
        "Websocket": ["connect", "send", "receive", "close", "broadcast", "on_open", "on_message", "on_close"],
        "Event": ["on", "off", "once", "emit", "listeners", "remove_all"],
        "Queue": ["enqueue", "dequeue", "peek", "is_empty", "size", "clear", "list"],
        "Stack": ["push", "pop", "peek", "is_empty", "size", "clear", "list"],
        "Graph": ["add_node", "remove_node", "add_edge", "remove_edge", "neighbors", "bfs", "dfs", "shortest_path", "has_cycle"],
        "Tree": ["add_node", "remove_node", "find", "traverse", "depth", "height", "is_leaf"],
        "Geometry": ["distance", "midpoint", "area", "perimeter", "volume", "angle", "rotate", "scale", "translate", "intersect", "union", "difference"],
        "Seed": ["generate", "map_seed", "noise_map", "perlin", "simplex", "name", "pattern"],
        "Box": ["put", "get", "has", "remove", "clear", "is_box", "size"],
        "Conversion": ["to_string", "to_int", "to_float", "to_bool", "to_array", "to_object", "to_json", "to_yaml", "to_csv", "to_xml"],
        "Headstails": ["coin", "bool_tos", "flip", "probability"],
        "Os": ["platform", "architecture", "distro", "kernel", "release", "uptime", "hostname", "user", "cpu_info", "memory_info", "disk_info"],
        "Bolt": ["run", "parallel", "threads", "task", "await", "schedule"],
        "Animation": ["start", "stop", "pause", "resume", "set_frame", "get_frame", "timeline", "easing", "loop", "reverse"],
        "Physics": ["apply_force", "apply_torque", "velocity", "acceleration", "mass", "collision", "gravity", "friction", "momentum", "energy"],
        "Ai": ["predict", "train", "evaluate", "load_model", "save_model", "preprocess", "tokenize", "embed", "classify", "cluster", "generate_text"]
    };

    function getValueType(value) {
        if (value.match(/^[0-9]+(\.[0-9]+)?$/)) {
            return 'number';
        } else if (value.match(/^".*"$/) || value.match(/^'.*'$/)) {
            return 'string';
        } else if (value === 'true' || value === 'false') {
            return 'boolean';
        } else if (value.match(/^\[.*\]$/)) {
            return 'array';
        } else if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
            return 'identifier'; // Variable reference
        } else if (value.includes('+') || value.includes('-') || value.includes('*') || value.includes('/') || value.includes('%')) {
            return 'expression'; // Expression
        } else {
            return 'unknown';
        }
    }

    function expressionLikelyType(expression) {
        if (expression.includes('+') || expression.includes('-') ||
            expression.includes('*') || expression.includes('/') ||
            expression.includes('%') || expression.includes('**')) {
            return 'number';
        } else if (expression.includes('==') || expression.includes('!=') ||
            expression.includes('>') || expression.includes('<') ||
            expression.includes('>=') || expression.includes('<=') ||
            expression.includes('&&') || expression.includes('||') ||
            expression.includes('!')) {
            return 'boolean';
        } else if (expression.includes('"') || expression.includes("'")) {
            if (expression.includes('+')) {
                return 'string';
            }
            return 'string';
        }
        return 'unknown';
    }

    function validateTokenUsage(tokenType, value) {
        const expectedType = TOKEN_TYPES[tokenType]?.expectedType;
        if (!expectedType) {
            return null;
        }

        const valueType = getValueType(value);

        if (valueType === 'expression') {
            const expressionType = expressionLikelyType(value);
            if (expressionType !== 'unknown' && expressionType !== expectedType && expectedType !== 'any') {
                return `Token '${tokenType}' expects ${expectedType} values, but got an expression that likely evaluates to ${expressionType}`;
            }
            return null;
        }

        if (valueType === 'identifier') {
            return null;
        }

        if (valueType !== expectedType && expectedType !== 'any') {
            return `Token '${tokenType}' expects ${expectedType} values, but got ${valueType}`;
        }

        return null;
    }

    function validateLibraryUsage(library, functionName) {
        const pascalCaseLibrary = toPascalCase(library);
        const libraryFunctions = LIBRARIES[pascalCaseLibrary];
        if (!libraryFunctions) {
            return `Unknown library: '${library}'`;
        }

        if (!libraryFunctions.includes(functionName)) {
            return `Unknown function '${functionName}' in library '${library}'. Available functions: ${libraryFunctions.join(', ')}`;
        }

        return null;
    }

    function validateRazenDocument(textDocument) {
        const text = textDocument.getText();
        const lines = text.split(/\r?\n/g);
        const diagnostics = [];
        const documentUri = textDocument.uri;
        const variableMap = new Map();
        documentVariables.set(documentUri, variableMap);
        const libraryMap = new Map();
        documentLibraries.set(documentUri, libraryMap);

        const tokenRegex = /\b(let|take|hold|put|sum|diff|prod|div|mod|text|concat|slice|len|list|arr)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+)/g;
        const variableUsageRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*\[|\s*=\s*)/g;
        const libraryImportRegex = /\blib\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/g;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trim().startsWith('#')) {
                continue;
            }

            let libraryImportMatch;
            const lineLibraryImportRegex = new RegExp(libraryImportRegex.source, libraryImportRegex.flags);
            while ((libraryImportMatch = lineLibraryImportRegex.exec(line)) !== null) {
                const [fullMatch, originalLibraryName] = libraryImportMatch;
                const pascalCaseLibraryName = toPascalCase(originalLibraryName);

                if (LIBRARIES[pascalCaseLibraryName]) {
                    libraryMap.set(pascalCaseLibraryName, {
                        line: i,
                        character: libraryImportMatch.index + fullMatch.indexOf(originalLibraryName),
                        length: originalLibraryName.length,
                        used: false
                    });
                } else {
                    const diagnostic = {
                        severity: DiagnosticSeverity.Warning,
                        range: {
                            start: { line: i, character: libraryImportMatch.index + fullMatch.indexOf(originalLibraryName) },
                            end: { line: i, character: libraryImportMatch.index + fullMatch.indexOf(originalLibraryName) + originalLibraryName.length }
                        },
                        message: `Library '${originalLibraryName}' (resolved to '${pascalCaseLibraryName}') not found. Available libraries: ${Object.keys(LIBRARIES).join(', ')}`,
                        source: 'Razen Linter'
                    };
                    diagnostics.push(diagnostic);
                }
            }

            let tokenMatch;
            const lineTokenRegex = new RegExp(tokenRegex.source, tokenRegex.flags);
            while ((tokenMatch = lineTokenRegex.exec(line)) !== null) {
                if (line.substring(tokenMatch.index).match(/[a-zA-Z_][a-zA-Z0-9_]*\s*::\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\(/)) {
                    continue;
                }

                const [fullMatch, tokenType, variableName, value] = tokenMatch;
                const error = validateTokenUsage(tokenType, value.trim());

                variableMap.set(variableName, {
                    line: i,
                    character: tokenMatch.index + fullMatch.indexOf(variableName),
                    length: variableName.length,
                    used: false,
                    type: tokenType
                });

                if (error) {
                    const diagnostic = {
                        severity: DiagnosticSeverity.Warning,
                        range: {
                            start: { line: i, character: tokenMatch.index },
                            end: { line: i, character: tokenMatch.index + fullMatch.length }
                        },
                        message: error,
                        source: 'razen-language-server'
                    };
                    diagnostics.push(diagnostic);
                }
            }

            let namespaceMatch;
            const namespaceCallRegex = /\b([a-z_][a-z0-9_]*)::([a-zA-Z_][a-zA-Z0-9_]*)\b(?=\s*\()/g;
            while ((namespaceMatch = namespaceCallRegex.exec(line)) !== null) {
                const [fullMatch, libNameLower, funcName] = namespaceMatch;
                const pascalCaseLibraryName = toPascalCase(libNameLower);

                if (LIBRARIES[pascalCaseLibraryName] && LIBRARIES[pascalCaseLibraryName].includes(funcName)) {
                    if (libraryMap.has(pascalCaseLibraryName)) {
                        const libInfo = libraryMap.get(pascalCaseLibraryName);
                        libInfo.used = true;
                        libraryMap.set(pascalCaseLibraryName, libInfo);
                    }
                } else if (LIBRARIES[pascalCaseLibraryName]) {
                    const diagnostic = {
                        severity: DiagnosticSeverity.Error,
                        range: {
                            start: { line: i, character: namespaceMatch.index + libNameLower.length + 2 },
                            end: { line: i, character: namespaceMatch.index + libNameLower.length + 2 + funcName.length }
                        },
                        message: `Function '${funcName}' not found in library '${pascalCaseLibraryName}'.`,
                        source: 'Razen Linter'
                    };
                    diagnostics.push(diagnostic);
                } else {
                    const diagnostic = {
                        severity: DiagnosticSeverity.Error,
                        range: {
                            start: { line: i, character: namespaceMatch.index },
                            end: { line: i, character: namespaceMatch.index + libNameLower.length }
                        },
                        message: `Library '${libNameLower}' (resolved to '${pascalCaseLibraryName}') not found.`,
                        source: 'Razen Linter'
                    };
                    diagnostics.push(diagnostic);
                }
            }

            let bracketMatch;
            const bracketNotationErrorRegex = new RegExp(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\[\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\]\s*(\(.*?\))/g.source, 'g');
            while ((bracketMatch = bracketNotationErrorRegex.exec(line)) !== null) {
                const [fullMatch, libraryName, functionName, args] = bracketMatch;
                const diagnostic = {
                    severity: DiagnosticSeverity.Error,
                    range: {
                        start: { line: i, character: bracketMatch.index },
                        end: { line: i, character: bracketMatch.index + fullMatch.length }
                    },
                    message: `Bracket notation for library calls is deprecated. Use namespace notation: '${libraryName.toLowerCase()}::${functionName}${args}'.`,
                    source: 'Razen Linter',
                    code: 'razen-bracket-to-namespace'
                };
                diagnostics.push(diagnostic);
            }

            let variableUsageMatch;
            const lineVariableUsageRegex = new RegExp(variableUsageRegex.source, variableUsageRegex.flags);
            while ((variableUsageMatch = lineVariableUsageRegex.exec(line)) !== null) {
                const [fullMatch, variableName] = variableUsageMatch;

                if (LIBRARIES[variableName]) {
                    continue;
                }

                if (variableMap.has(variableName)) {
                    const varInfo = variableMap.get(variableName);
                    if (i !== varInfo.line || variableUsageMatch.index !== varInfo.character) {
                        varInfo.used = true;
                        variableMap.set(variableName, varInfo);
                    }
                }
            }
        }

        return diagnostics;
    }

    const tokenTypes = ['variable', 'library'];
    const tokenModifiers = ['declaration', 'unused', 'used'];
    const legend = {
        tokenTypes,
        tokenModifiers
    };
    const documentVariables = new Map();
    const documentLibraries = new Map();

    connection.onInitialize((params) => {
        return {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                completionProvider: {
                    resolveProvider: true,
                    triggerCharacters: [':']
                },
                semanticTokensProvider: {
                    legend,
                    range: false,
                    full: {
                        delta: false
                    }
                },
                codeActionProvider: true
            }
        };
    });

    connection.onInitialized(() => {
        connection.console.log('Razen Language Server initialized');
    });

    connection.languages.semanticTokens.on((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document) {
            return { data: [] };
        }

        const builder = new SemanticTokensBuilder();
        const variableMap = documentVariables.get(document.uri);
        const libraryMap = documentLibraries.get(document.uri);

        if (variableMap) {
            for (const [varName, varInfo] of variableMap.entries()) {
                const tokenType = 0;
                let tokenModifiers = 1 << 0;
                if (varInfo.used) {
                    tokenModifiers |= 1 << 2;
                } else {
                    tokenModifiers |= 1 << 1;
                }
                builder.push(
                    varInfo.line,
                    varInfo.character,
                    varInfo.length,
                    tokenType,
                    tokenModifiers
                );

                const text = document.getText();
                const lines = text.split(/\r?\n/g);
                const varUsageRegex = new RegExp(`\\b(${varName})\\b(?!\\s*\\[|\\s*=\\s*)`, 'g');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    let match;
                    while ((match = varUsageRegex.exec(line)) !== null) {
                        if (i === varInfo.line && match.index === varInfo.character) {
                            continue;
                        }
                        builder.push(
                            i,
                            match.index,
                            varName.length,
                            tokenType,
                            1 << 2
                        );
                    }
                }
            }
        }

        if (libraryMap) {
            for (const [libName, libInfo] of libraryMap.entries()) {
                const tokenType = 1;
                let tokenModifiers = 1 << 0;
                if (libInfo.used) {
                    tokenModifiers |= 1 << 2;
                } else {
                    tokenModifiers |= 1 << 1;
                }
                builder.push(
                    libInfo.line,
                    libInfo.character,
                    libInfo.length,
                    tokenType,
                    tokenModifiers
                );

                const text = document.getText();
                const lines = text.split(/\r?\n/g);
                const libUsageRegex = new RegExp(`\\b(${libName})\\s*::`, 'gi');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    let match;
                    while ((match = libUsageRegex.exec(line)) !== null) {
                        builder.push(
                            i,
                            match.index,
                            libName.length,
                            tokenType,
                            1 << 2
                        );
                    }
                }
            }
        }

        return builder.build();
    });

    connection.onCodeAction(params => {
        const textDocument = documents.get(params.textDocument.uri);
        if (!textDocument) {
            return undefined;
        }
        const codeActions = [];
        params.context.diagnostics.forEach(diagnostic => {
            if (diagnostic.code === 'razen-bracket-to-namespace') {
                const documentText = textDocument.getText(diagnostic.range);
                const bracketRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\[\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\]\s*(\(.*?\))/;
                const match = documentText.match(bracketRegex);

                if (match) {
                    const [, libraryName, functionName, args] = match;
                    const newText = `${libraryName.toLowerCase()}::${functionName}${args}`;

                    codeActions.push({
                        title: `Convert to namespace notation: ${newText}`,
                        kind: 'QuickFix',
                        diagnostics: [diagnostic],
                        isPreferred: true,
                        edit: {
                            changes: {
                                [params.textDocument.uri]: [
                                    {
                                        range: diagnostic.range,
                                        newText: newText
                                    }
                                ]
                            }
                        }
                    });
                }
            }
        });
        return codeActions;
    });

    connection.onCompletion((textDocumentPosition) => {
        const document = documents.get(textDocumentPosition.textDocument.uri);
        if (!document) {
            return null;
        }

        const text = document.getText();
        const lines = text.split(/\r?\n/g);
        const position = textDocumentPosition.position;
        const line = lines[position.line];
        const linePrefix = line.substring(0, position.character);
        const completionItems = [];
        const namespaceMatch = linePrefix.match(/\b([a-z_][a-z0-9_]*)::([a-zA-Z_][a-zA-Z0-9_]*)?$/);

        if (namespaceMatch) {
            const libNameLower = namespaceMatch[1];
            const pascalCaseLibraryName = toPascalCase(libNameLower);
            const libraryFunctions = LIBRARIES[pascalCaseLibraryName];

            if (libraryFunctions) {
                for (const funcName of libraryFunctions) {
                    completionItems.push({
                        label: funcName,
                        kind: CompletionItemKind.Function,
                        detail: `${libNameLower}::${funcName}`,
                        documentation: {
                            kind: MarkupKind.Markdown,
                            value: `Function in ${pascalCaseLibraryName} library.`
                        },
                        insertText: `${funcName}($1)`,
                        insertTextFormat: InsertTextFormat.Snippet
                    });
                }
            }
        } else if (linePrefix.match(/\b[a-z][a-zA-Z0-9_]*$/)) {
            for (const library in LIBRARIES) {
                completionItems.push({
                    label: library.toLowerCase(),
                    kind: CompletionItemKind.Module,
                    detail: `${library} library`,
                    documentation: `Library with ${LIBRARIES[library].length} functions`,
                    insertText: `${library.toLowerCase()}::`
                });
            }
        }

        const tokenMatch = linePrefix.match(/^\s*(let|take|hold|put|sum|diff|prod|div|mod|text|concat|slice|len|list|arr)\s*$/);
        if (tokenMatch) {
            const token = tokenMatch[1];
            const expectedType = TOKEN_TYPES[token]?.expectedType;
            completionItems.push({
                label: `${token} variableName = value`,
                kind: CompletionItemKind.Snippet,
                detail: `${token} variable declaration`,
                documentation: {
                    kind: MarkupKind.Markdown,
                    value: TOKEN_TYPES[token]?.description || `${token} variable declaration`
                },
                insertText: `${token} ${expectedType === 'number' ? 'num' : expectedType === 'string' ? 'str' : expectedType === 'boolean' ? 'flag' : 'var'} = $1`,
                insertTextFormat: InsertTextFormat.Snippet
            });
        }

        return completionItems;
    });

    connection.onCompletionResolve((item) => {
        return item;
    });

    documents.onDidChangeContent(change => {
        validateTextDocument(change.document);
    });

    async function validateTextDocument(textDocument) {
        const diagnostics = validateRazenDocument(textDocument);
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    }

    documents.listen(connection);
}
