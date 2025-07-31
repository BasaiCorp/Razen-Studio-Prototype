// script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const cursorPosition = document.getElementById('cursor-position');
    const autocompleteSuggestions = document.getElementById('autocomplete-suggestions');
    const tabBtn = document.getElementById('tab-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const bracketBtn = document.getElementById('bracket-btn');
    const searchBtn = document.getElementById('search-btn');
    const cursorUpBtn = document.getElementById('cursor-up-btn');
    const cursorDownBtn = document.getElementById('cursor-down-btn');
    const cursorLeftBtn = document.getElementById('cursor-left-btn');
    const cursorRightBtn = document.getElementById('cursor-right-btn');
    const selectBtn = document.getElementById('select-btn');
    const selectAllBtn = document.getElementById('select-all-btn');
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
    const previewModal = document.getElementById('preview-modal');
    const previewIframe = document.getElementById('preview-iframe');
    const previewModalCloseBtn = document.getElementById('preview-modal-close-btn');

    // State
    let files = {};
    let activeFileId = null;
    let fileCounter = 1;
    let editor;

    // Helper function to prevent editor focus loss on toolbar clicks
    function addToolbarButtonListener(button, action) {
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            action();
        });
    }

    // Event Listeners
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    sidebarCloseBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    newFileBtn.addEventListener('click', () => {
        showFilenamePopup();
    });
    
    addToolbarButtonListener(copyBtn, copyCode);
    addToolbarButtonListener(themeToggle, toggleTheme);

    addToolbarButtonListener(undoBtn, () => {
        if (editor) {
            editor.trigger('toolbar', 'undo');
        }
    });

    addToolbarButtonListener(redoBtn, () => {
        if (editor) {
            editor.trigger('toolbar', 'redo');
        }
    });

    addToolbarButtonListener(tabBtn, () => {
        if (editor) {
            editor.executeEdits('toolbar', [{
                range: editor.getSelection(),
                text: '  ',
                forceMoveMarkers: true
            }]);
        }
    });

    addToolbarButtonListener(bracketBtn, () => {
        if (editor) {
            // Using snippet controller to insert '()' and place cursor inside
            const snippetController = editor.getContribution('snippetController2');
            if (snippetController) {
                snippetController.insert('($0)');
            }
        }
    });

    addToolbarButtonListener(searchBtn, () => {
        if (editor) {
            editor.getAction('editor.action.startFindReplaceAction').run();
        }
    });

    addToolbarButtonListener(cursorUpBtn, () => {
        if (editor) {
            editor.trigger('toolbar', 'cursorUp');
        }
    });

    addToolbarButtonListener(cursorDownBtn, () => {
        if (editor) {
            editor.trigger('toolbar', 'cursorDown');
        }
    });

    addToolbarButtonListener(cursorLeftBtn, () => {
        if (editor) {
            editor.trigger('toolbar', 'cursorLeft');
        }
    });

    addToolbarButtonListener(cursorRightBtn, () => {
        if (editor) {
            editor.trigger('toolbar', 'cursorRight');
        }
    });

    addToolbarButtonListener(selectBtn, () => {
        if (editor) {
            editor.getAction('editor.action.smartSelect.expand').run();
        }
    });

    addToolbarButtonListener(selectAllBtn, () => {
        if (editor) {
            editor.getAction('editor.action.selectAll').run();
        }
    });

    function copyCode() {
        if (editor) {
            navigator.clipboard.writeText(editor.getValue())
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
        const isLightTheme = document.body.classList.toggle('light-theme');
        const newTheme = isLightTheme ? 'light-theme' : 'dark-theme';
        localStorage.setItem('theme', newTheme);

        if (editor) {
            monaco.editor.setTheme(isLightTheme ? 'razen-light' : 'razen-dark');
        }

        // Update button text and icon based on the new theme
        if (themeToggle) {
            themeToggle.innerHTML = isLightTheme
                ? '<i class="fas fa-sun"></i> Light'
                : '<i class="fas fa-moon"></i> Dark';
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
    addToolbarButtonListener(runBtn, runCode);
    previewModalCloseBtn.addEventListener('click', () => {
        previewModal.style.display = 'none';
        previewIframe.srcdoc = ''; // Clear content to stop any running scripts
    });

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

        const iframeContent = `
            <html>
                <head>
                    <style>${cssContent}</style>
                </head>
                <body>
                    ${htmlContent}
                    <script>${jsContent}<\/script>
                </body>
            </html>
        `;

        previewIframe.srcdoc = iframeContent;
        previewModal.style.display = 'flex';

        // Intercept links in the iframe
        previewIframe.onload = () => {
            try {
                const iframeDoc = previewIframe.contentWindow.document;
                const links = iframeDoc.getElementsByTagName('a');
                for (let link of links) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const href = e.target.getAttribute('href');
                        // Optional: Inform the user that navigation is blocked.
                        // You can use a custom popup or a simple alert.
                        alert(`Navigation to "${href}" is blocked in preview mode.`);
                    });
                }
            } catch (e) {
                console.error("Could not attach link listeners to iframe:", e);
            }
        };
    }

    // Global click listener to close file context menus
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.file-options-dropdown.show').forEach(dropdown => {
            // Check if the click was outside the dropdown and its button
            const button = dropdown.previousElementSibling;
            if (!button.contains(e.target)) {
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
                // Close other dropdowns
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

        // Download
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

        // Copy Content
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

        // Preview (only for HTML)
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

        // Separator
        const separator = document.createElement('div');
        separator.className = 'dropdown-separator';
        dropdown.appendChild(separator);

        // Close
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
                // Close other dropdowns
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
        if (!files[fileId]) return;

        activeFileId = fileId;
        editor.setValue(files[fileId].content);
        const model = editor.getModel();
        monaco.editor.setModelLanguage(model, detectLanguageFromExtension(files[fileId].name));
        renderActiveFiles();
        editor.focus();
    }

    function closeFile(fileId) {
        delete files[fileId];
        if (activeFileId === fileId) {
            activeFileId = Object.keys(files)[0] || null;
            if (activeFileId) {
                setActiveFile(activeFileId);
            } else {
                editor.setValue('');
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

    function detectLanguageFromExtension(fileName) {
        const ext = fileName.split('.').pop();
        const languages = {
            'js': 'javascript',
            'py': 'python',
            'rzn': 'razor',
            'html': 'html',
            'css': 'css',
            'ts': 'typescript',
            'java': 'java',
            'cs': 'csharp',
            'cpp': 'cpp',
            'go': 'go',
            'php': 'php',
            'rb': 'ruby',
            'rs': 'rust',
            'sql': 'sql',
            'swift': 'swift',
            'kt': 'kotlin',
            'lua': 'lua',
            'pl': 'perl',
            'sh': 'shell',
            'bat': 'bat',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'md': 'markdown',
        };
        return languages[ext] || 'plaintext';
    }

    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        monaco.languages.register({ id: 'razor' });

        monaco.languages.setMonarchTokensProvider('razor', {
            tokenizer: {
                root: [
                    [/".*?"/, "string"],
                    [/\b\d+\b/, "number"],
                    [/\b(if|else|for|while|return)\b/, "keyword"],
                    [/#.*/, "comment"],
                ]
            }
        });

        monaco.editor.defineTheme('razen-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '608b4e', fontStyle: 'italic' },
                { token: 'string', foreground: 'ce9178' },
                { token: 'number', foreground: 'b5cea8' },
                { token: 'keyword', foreground: 'c586c0', fontStyle: 'bold' },
            ],
            colors: {
                'editor.background': '#1e1e2e',
            }
        });

        monaco.editor.defineTheme('razen-light', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
                { token: 'string', foreground: '032f62' },
                { token: 'number', foreground: '005cc5' },
                { token: 'keyword', foreground: 'd73a49', fontStyle: 'bold' },
            ],
            colors: {
                'editor.background': '#ffffff',
            }
        });

        editor = monaco.editor.create(document.getElementById('editor'), {
            value: '',
            language: 'plaintext',
            theme: document.body.classList.contains('light-theme') ? 'razen-light' : 'razen-dark',
            fontFamily: 'JetBrains Mono',
            automaticLayout: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            suggestOnTriggerCharacters: true,
            wordWrap: 'on',
            folding: true,
            bracketPairColorization: {
                enabled: true
            },
            'semanticHighlighting.enabled': true,
        });

        editor.onDidChangeModelContent(() => {
            if (activeFileId) {
                files[activeFileId].content = editor.getValue();
            }
        });
    });
});