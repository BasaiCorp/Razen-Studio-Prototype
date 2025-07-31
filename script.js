import { EditorState, Compartment } from "https://esm.sh/@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "https://esm.sh/@codemirror/view";
import { defaultKeymap, history, indentWithTab, undo, redo } from "https://esm.sh/@codemirror/commands";
import { search, searchKeymap, openSearchPanel, findNext, findPrevious, replaceNext, replaceAll, SearchQuery } from "https://esm.sh/@codemirror/search";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript";
import { html } from "https://esm.sh/@codemirror/lang-html";
import { css } from "https://esm.sh/@codemirror/lang-css";
import { python } from "https://esm.sh/@codemirror/lang-python";
import { rust } from "https://esm.sh/@codemirror/lang-rust";
import { java } from "https://esm.sh/@codemirror/lang-java";
import { cpp } from "https://esm.sh/@codemirror/lang-cpp";
import { json } from "https://esm.sh/@codemirror/lang-json";
import { markdown } from "https://esm.sh/@codemirror/lang-markdown";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "https://esm.sh/@codemirror/autocomplete";
import { bracketMatching, StreamLanguage, HighlightStyle, tags } from "https://esm.sh/@codemirror/language";

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const cursorPosition = document.getElementById('cursor-position');
    const tabBtn = document.getElementById('tab-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const bracketBtn = document.getElementById('bracket-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchPopup = document.getElementById('search-popup');
    const searchInput = document.getElementById('search-input');
    const replaceInput = document.getElementById('replace-input');
    const findNextBtn = document.getElementById('find-next-btn');
    const replaceBtn = document.getElementById('replace-btn');
    const replaceAllBtn = document.getElementById('replace-all-btn');
    const searchCancelBtn = document.getElementById('search-cancel-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const newFileBtn = document.getElementById('new-file-btn');
    const fileList = document.getElementById('file-list');
    const activeFilesContainer = document.getElementById('active-files');
    const customPopup = document.getElementById('custom-popup');
    const popupMessage = document.getElementById('popup-message');
    const popupConfirm = document.getElementById('popup-confirm');
    const popupCancel = document.getElementById('popup-cancel');
    const filenamePopup = document.getElementById('filename-popup');
    const filenameInput = document.getElementById('filename-input');
    const filenameConfirm = document.getElementById('filename-confirm');
    const filenameCancel = document.getElementById('filename-cancel');
    const runBtn = document.getElementById('run-btn');

    // State
    let files = {};
    let activeFileId = null;
    let fileCounter = 1;
    let editor;

    // Codemirror specific compartments
    let language = new Compartment,
        theme = new Compartment;

    // Event Listeners
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    sidebarCloseBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    newFileBtn.addEventListener('click', () => showFilenamePopup());
    copyBtn.addEventListener('click', copyCode);
    themeToggle.addEventListener('click', toggleTheme);
    undoBtn.addEventListener('click', () => { if (editor) undo({state: editor.state, dispatch: editor.dispatch}) });
    redoBtn.addEventListener('click', () => { if (editor) redo({state: editor.state, dispatch: editor.dispatch}) });
    tabBtn.addEventListener('click', () => { if (editor) indentWithTab({state: editor.state, dispatch: editor.dispatch}) });

    function copyCode() {
        if (editor) {
            navigator.clipboard.writeText(editor.state.doc.toString())
                .then(() => {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        }
    }
    
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isLightTheme = document.body.classList.contains('light-theme');
        localStorage.setItem('theme', isLightTheme ? 'light-theme' : 'dark-theme');

        const themeExtension = isLightTheme
            ? [razenLightTheme, razenLightHighlight]
            : [razenDarkTheme, razenDarkHighlight];

        editor.dispatch({
            effects: theme.reconfigure(themeExtension)
        });

        if (themeToggle) {
            themeToggle.innerHTML = isLightTheme
                ? '<i class="fas fa-moon"></i>'
                : '<i class="fas fa-sun"></i>';
        }
    }

    function showFilenamePopup() {
        filenamePopup.style.display = 'flex';
        filenameInput.focus();
    }

    function hideFilenamePopup() {
        filenamePopup.style.display = 'none';
        filenameInput.value = '';
    }

    function createNewFile() {
        if (Object.keys(files).length >= 10) {
            alert("Maximum number of files reached.");
            return;
        }

        let fileName = filenameInput.value;
        if (!fileName) {
            return;
        }
        if (!fileName.includes('.')) {
            fileName += ".rzn";
        }

        const fileId = `file-${fileCounter}`;
        files[fileId] = { id: fileId, name: fileName, content: '' };
        fileCounter++;

        renderFileList();
        setActiveFile(fileId);
        hideFilenamePopup();
    }

    filenameConfirm.addEventListener('click', createNewFile);
    filenameCancel.addEventListener('click', hideFilenamePopup);
    runBtn.addEventListener('click', runCode);

    function runCode() {
        const htmlFile = Object.values(files).find(file => file.name.endsWith('.html'));
        if (!htmlFile) {
            alert('No HTML file found to preview.');
            return;
        }

        const cssFile = Object.values(files).find(file => file.name.endsWith('.css'));
        const jsFile = Object.values(files).find(file => file.name.endsWith('.js'));

        const htmlContent = htmlFile ? htmlFile.content : '';
        const cssContent = cssFile ? cssFile.content : '';
        const jsContent = jsFile ? jsFile.content : '';

        const previewWindow = window.open('preview.html', 'preview');

        previewWindow.onload = () => {
            previewWindow.postMessage({
                type: 'code',
                html: htmlContent,
                css: cssContent,
                js: jsContent,
            }, '*');
        };
    }

    window.addEventListener('message', (event) => {
        if (event.data === 'exit-preview') {
            // This is handled in the preview window itself
        }
    });

    window.addEventListener('click', (e) => {
        document.querySelectorAll('.file-options-dropdown.show').forEach(dropdown => {
            const button = dropdown.previousElementSibling;
            if (button && !button.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    });

    function renderFileList() {
        fileList.innerHTML = '';
        for (const fileId in files) {
            const file = files[fileId];
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.fileId = file.id;

            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = file.name;
            fileItem.appendChild(fileNameSpan);

            const optionsBtn = document.createElement('button');
            optionsBtn.className = 'btn s-btn file-options-btn';
            optionsBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';

            const dropdown = createFileContextMenu(file);
            fileItem.appendChild(dropdown);

            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.file-options-dropdown.show').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });

            fileItem.appendChild(optionsBtn);
            fileItem.addEventListener('click', () => setActiveFile(file.id));
            fileList.appendChild(fileItem);
        }
    }

    function createFileContextMenu(file) {
        const dropdown = document.createElement('div');
        dropdown.className = 'file-options-dropdown';

        const downloadLink = document.createElement('a');
        downloadLink.innerHTML = '<i class="fas fa-download"></i> Download';
        downloadLink.addEventListener('click', (e) => {
            e.stopPropagation();
            const blob = new Blob([file.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            dropdown.classList.remove('show');
        });
        dropdown.appendChild(downloadLink);

        const copyLink = document.createElement('a');
        copyLink.innerHTML = '<i class="fas fa-copy"></i> Copy Content';
        copyLink.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(file.content).then(() => {
                alert(`${file.name} content copied to clipboard!`);
            }).catch(err => console.error('Failed to copy content: ', err));
            dropdown.classList.remove('show');
        });
        dropdown.appendChild(copyLink);

        if (file.name.endsWith('.html')) {
            const previewLink = document.createElement('a');
            previewLink.innerHTML = '<i class="fas fa-eye"></i> Preview';
            previewLink.addEventListener('click', (e) => {
                e.stopPropagation();
                runCode();
                dropdown.classList.remove('show');
            });
            dropdown.appendChild(previewLink);
        }

        const separator = document.createElement('div');
        separator.className = 'dropdown-separator';
        dropdown.appendChild(separator);

        const closeLink = document.createElement('a');
        closeLink.innerHTML = '<i class="fas fa-times"></i> Close';
        closeLink.addEventListener('click', (e) => {
            e.stopPropagation();
            showPopup(`Are you sure you want to close ${file.name}?`, () => closeFile(file.id));
            dropdown.classList.remove('show');
        });
        dropdown.appendChild(closeLink);

        return dropdown;
    }

    function renderActiveFiles() {
        activeFilesContainer.innerHTML = '';
        if (Object.keys(files).length === 0) {
            activeFilesContainer.classList.add('empty');
        } else {
            activeFilesContainer.classList.remove('empty');
        }

        for (const fileId in files) {
            const file = files[fileId];
            const activeFileDiv = document.createElement('div');
            activeFileDiv.className = `active-file ${file.id === activeFileId ? 'active' : ''}`;
            activeFileDiv.dataset.fileId = file.id;
            activeFileDiv.textContent = file.name;

            const optionsBtn = document.createElement('button');
            optionsBtn.className = 'btn s-btn file-options-btn';
            optionsBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';

            const dropdown = createFileContextMenu(file);
            activeFileDiv.appendChild(dropdown);

            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.file-options-dropdown.show').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });

            activeFileDiv.appendChild(optionsBtn);
            activeFileDiv.addEventListener('click', () => setActiveFile(file.id));
            activeFilesContainer.appendChild(activeFileDiv);
        }
    }

    function setActiveFile(fileId) {
        if (!files[fileId] || (fileId === activeFileId && editor)) return;

        activeFileId = fileId;

        const lang = detectLanguageFromExtension(files[fileId].name);
        const langName = files[fileId].name.split('.').pop();
        document.getElementById('language-indicator').textContent = langName.toUpperCase();

        if (editor) {
            editor.dispatch({
                changes: { from: 0, to: editor.state.doc.length, insert: files[fileId].content },
                effects: language.reconfigure(lang)
            });
        }

        renderActiveFiles();
        if (editor) editor.focus();
    }

    function closeFile(fileId) {
        delete files[fileId];
        if (activeFileId === fileId) {
            activeFileId = null;
            const nextFileId = Object.keys(files)[0] || null;
            if (nextFileId) {
                setActiveFile(nextFileId);
            } else if (editor) {
                editor.dispatch({
                    changes: { from: 0, to: editor.state.doc.length, insert: "" }
                });
            }
        }
        renderFileList();
        renderActiveFiles();
    }

    function showPopup(message, onConfirm) {
        popupMessage.textContent = message;
        customPopup.style.display = 'flex';

        popupConfirm.onclick = () => {
            onConfirm();
            customPopup.style.display = 'none';
        };

        popupCancel.onclick = () => {
            customPopup.style.display = 'none';
        };
    }

    const razorLanguage = StreamLanguage.define({
        token(stream) {
            if (stream.match(/".*?"/)) return "string";
            if (stream.match(/\b\d+\b/)) return "number";
            if (stream.match(/\b(if|else|for|while|return)\b/)) return "keyword";
            if (stream.match(/#.*/)) return "comment";
            stream.next();
            return null;
        }
    });

    function razor() {
        return razorLanguage;
    }

    const razenDarkHighlight = HighlightStyle.define([
      { tag: tags.keyword, color: "#c586c0", fontWeight: "bold" },
      { tag: tags.comment, color: "#608b4e", fontStyle: "italic" },
      { tag: tags.string, color: "#ce9178" },
      { tag: tags.number, color: "#b5cea8" },
    ]);

    const razenLightHighlight = HighlightStyle.define([
      { tag: tags.keyword, color: "#d73a49", fontWeight: "bold" },
      { tag: tags.comment, color: "#6a737d", fontStyle: "italic" },
      { tag: tags.string, color: "#032f62" },
      { tag: tags.number, color: "#005cc5" },
    ]);

    const razenDarkTheme = EditorView.theme({
      "&": {
        color: "#cdd6f4",
        backgroundColor: "#1e1e2e",
        fontFamily: "'JetBrains Mono', monospace"
      },
      ".cm-content": {
        caretColor: "#cdd6f4"
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "#cdd6f4"
      },
      ".cm-gutters": {
        backgroundColor: "#1e1e2e",
        color: "#6c7086",
        border: "none"
      },
    }, {dark: true});

    const razenLightTheme = EditorView.theme({
        "&": {
            color: "#333333",
            backgroundColor: "#ffffff",
            fontFamily: "'JetBrains Mono', monospace"
        },
        ".cm-content": {
            caretColor: "#333333"
        },
        "&.cm-focused .cm-cursor": {
            borderLeftColor: "#333333"
        },
        ".cm-gutters": {
            backgroundColor: "#f5f5f5",
            color: "#999999",
            border: "none"
        },
    }, {dark: false});

    function detectLanguageFromExtension(fileName) {
        const ext = fileName.split('.').pop();
        const languageMap = {
            'js': javascript(),
            'py': python(),
            'html': html(),
            'css': css(),
            'java': java(),
            'cpp': cpp(),
            'rs': rust(),
            'json': json(),
            'md': markdown(),
            'rzn': razor()
        };
        return languageMap[ext] || [];
    }

    function initializeEditor() {
        const isLightTheme = document.body.classList.contains('light-theme');
        const initialTheme = isLightTheme
            ? [razenLightTheme, razenLightHighlight]
            : [razenDarkTheme, razenDarkHighlight];

        const state = EditorState.create({
            doc: '',
            extensions: [
                lineNumbers(),
                highlightActiveLineGutter(),
                history(),
                search(),
                keymap.of([
                    ...defaultKeymap,
                    ...closeBracketsKeymap,
                    ...completionKeymap,
                    ...searchKeymap,
                    indentWithTab,
                ]),
                bracketMatching(),
                closeBrackets(),
                autocompletion(),
                highlightActiveLine(),
                language.of([]),
                theme.of(initialTheme),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged && activeFileId && files[activeFileId]) {
                        files[activeFileId].content = editor.state.doc.toString();
                    }
                    if (update.selectionSet) {
                        const pos = editor.state.selection.main.head;
                        const line = editor.state.doc.lineAt(pos);
                        cursorPosition.textContent = `Line ${line.number}, Column ${pos - line.from + 1}`;
                    }
                })
            ]
        });

        editor = new EditorView({
            state,
            parent: document.getElementById('editor')
        });
    }

    searchBtn.addEventListener('click', () => {
        searchPopup.style.display = 'flex';
        searchInput.focus();
    });

    searchCancelBtn.addEventListener('click', () => {
        searchPopup.style.display = 'none';
    });

    findNextBtn.addEventListener('click', () => {
        findNext({state: editor.state, dispatch: editor.dispatch})
    });

    replaceBtn.addEventListener('click', () => {
        replaceNext({state: editor.state, dispatch: editor.dispatch})
    });

    replaceAllBtn.addEventListener('click', () => {
        replaceAll({state: editor.state, dispatch: editor.dispatch})
    });

    searchInput.addEventListener('input', () => {
        const query = new SearchQuery({
            search: searchInput.value,
            replace: replaceInput.value,
            caseSensitive: true, // You can make this configurable
        });
        editor.dispatch({ effects: search.setQuery.of(query) });
    });

    replaceInput.addEventListener('input', () => {
        const query = new SearchQuery({
            search: searchInput.value,
            replace: replaceInput.value,
            caseSensitive: true, // You can make this configurable
        });
        editor.dispatch({ effects: search.setQuery.of(query) });
    });

    // Initial setup
    initializeEditor();

    // Set initial theme icon
    if (themeToggle) {
        themeToggle.innerHTML = document.body.classList.contains('light-theme')
            ? '<i class="fas fa-moon"></i>'
            : '<i class="fas fa-sun"></i>';
    }

    // A welcome file is not created by default anymore to ensure stability.

    console.log("Razen Studio Initialized Successfully");
});