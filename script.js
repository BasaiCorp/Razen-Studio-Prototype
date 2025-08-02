// script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const cursorPosition = document.getElementById('cursor-position');
    const languageIndicator = document.getElementById('language-indicator');
    const tabBtn = document.getElementById('tab-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const bracketBtn = document.getElementById('bracket-btn');
    const searchBtn = document.getElementById('search-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const fileListContainer = document.getElementById('file-list');
    const customPopup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupConfirm = document.getElementById('popup-confirm');
    const popupCancel = document.getElementById('popup-cancel');
    const runBtn = document.getElementById('run-btn');
    const previewModal = document.getElementById('preview-modal');
    const previewIframe = document.getElementById('preview-iframe');
    const previewModalCloseBtn = document.getElementById('preview-modal-close-btn');

    // State
    let editor;
    let currentProject = null;
    let activeFilePath = null;
    const fs = window.FileSystem;

    // --- Project Loading ---
    async function loadProjectFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectName = urlParams.get('project');
        currentProject = projectName;

        if (projectName && fs) {
            document.querySelector('header h1').innerHTML = `<i class="fas fa-folder-open"></i> ${projectName}`;
            const fileTree = await fs.listProjectContents(projectName);
            renderFileTree(fileTree, fileListContainer);
            const firstFile = findDefaultFile(fileTree);
            if (firstFile) {
                openFile(firstFile.path);
            }
        } else {
            fileListContainer.innerHTML = '<p style="padding: 10px;">No project loaded.</p>';
        }
    }
    
    function findDefaultFile(nodes) {
        for (const node of nodes) {
            if (node.type === 'file' && (node.name === 'index.html' || node.name === 'main.js')) {
                return node;
            }
            if (node.type === 'folder' && node.children) {
                const found = findDefaultFile(node.children);
                if (found) return found;
            }
        }
        return null;
    }


    // --- File Tree Rendering ---
    function renderFileTree(nodes, container) {
        const tree = container.tagName === 'UL' ? container : document.createElement('ul');
        if (container.tagName !== 'UL') {
            tree.className = 'file-tree';
            container.innerHTML = '';
        }

        nodes.forEach(node => {
            const li = document.createElement('li');
            li.className = 'file-tree-item-container';

            const itemButton = document.createElement('button');
            itemButton.className = 'file-tree-item';
            itemButton.dataset.path = node.path;
            itemButton.dataset.type = node.type;

            let caretIcon;
            if (node.type === 'folder') {
                caretIcon = document.createElement('i');
                caretIcon.className = 'fas fa-chevron-right folder-caret';
                itemButton.appendChild(caretIcon);

                const folderIcon = document.createElement('i');
                folderIcon.className = 'fas fa-folder folder-icon';
                itemButton.appendChild(folderIcon);

                itemButton.addEventListener('click', () => toggleFolder(li, caretIcon));
            } else {
                // Keep alignment
                const placeholder = document.createElement('i');
                placeholder.className = 'fas fa-file';
                placeholder.style.visibility = 'hidden';
                itemButton.appendChild(placeholder);

                const fileIcon = document.createElement('i');
                fileIcon.className = `fas ${getIconForFile(node.name)} file-icon`;
                itemButton.appendChild(fileIcon);

                itemButton.addEventListener('click', () => openFile(node.path));
            }

            const nameSpan = document.createElement('span');
            nameSpan.textContent = node.name;
            itemButton.appendChild(nameSpan);

            li.appendChild(itemButton);

            if (node.type === 'folder' && node.children && node.children.length > 0) {
                const childrenContainer = document.createElement('ul');
                li.appendChild(childrenContainer);
                renderFileTree(node.children, childrenContainer);
            }

            tree.appendChild(li);
        });

        if (container.tagName !== 'UL') {
            container.appendChild(tree);
        }
    }

    function toggleFolder(li_container, caret_icon) {
        li_container.classList.toggle('open');
        caret_icon.classList.toggle('open');
    }

    function getIconForFile(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const icons = {
            'html': 'fa-html5', 'css': 'fa-css3-alt', 'js': 'fa-js-square',
            'json': 'fa-file-code', 'md': 'fa-markdown', 'py': 'fa-python',
            'java': 'fa-java', 'rs': 'fa-rust', 'png': 'fa-image', 'jpg': 'fa-image',
            'jpeg': 'fa-image', 'gif': 'fa-image', 'svg': 'fa-image'
        };
        return icons[ext] || 'fa-file-alt';
    }


    // --- File Operations ---
    async function openFile(filePath) {
        if (!currentProject) return;

        const projectRootPath = (await fs.listProjects()).find(p => p.name === currentProject).path;
        const relativePath = filePath.replace(projectRootPath + File.separator, '');

        const content = await fs.readFile(currentProject, relativePath);
        if (typeof content === 'string' && !content.startsWith('Error:')) {
            editor.setValue(content);
            const languageId = detectLanguageFromExtension(filePath);
            monaco.editor.setModelLanguage(editor.getModel(), languageId);
            languageIndicator.textContent = getLanguageName(languageId);

            updateActiveFileUI(filePath);
            activeFilePath = filePath;
        } else {
            showPopup('Error', `Could not open file: ${content}`, { showCancel: false });
        }
    }

    function updateActiveFileUI(filePath) {
        document.querySelectorAll('.file-tree-item').forEach(item => {
            item.classList.toggle('active', item.dataset.path === filePath);
        });
    }


    // --- Editor and UI Setup ---
    function addToolbarButtonListener(button, action) {
        if (button) {
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (editor) action(editor);
            });
        }
    }

    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    sidebarCloseBtn.addEventListener('click', () => sidebar.classList.remove('open'));

    addToolbarButtonListener(copyBtn, (editor) => navigator.clipboard.writeText(editor.getValue()));
    addToolbarButtonListener(undoBtn, (editor) => editor.trigger('toolbar', 'undo'));
    addToolbarButtonListener(redoBtn, (editor) => editor.trigger('toolbar', 'redo'));
    addToolbarButtonListener(tabBtn, (editor) => editor.executeEdits('toolbar', [{ range: editor.getSelection(), text: '  ', forceMoveMarkers: true }]));
    addToolbarButtonListener(bracketBtn, (editor) => editor.getContribution('snippetController2')?.insert('($0)'));
    addToolbarButtonListener(searchBtn, (editor) => editor.getAction('editor.action.startFindReplaceAction').run());

    themeToggle.addEventListener('click', toggleTheme);
    function toggleTheme() {
        const isLightTheme = document.body.classList.toggle('light-theme');
        const newTheme = isLightTheme ? 'light-theme' : 'dark-theme';
        localStorage.setItem('theme', newTheme);
        monaco.editor.setTheme(isLightTheme ? 'razen-light' : 'razen-dark');
    }

    runBtn.addEventListener('click', runCode);
    previewModalCloseBtn.addEventListener('click', () => {
        previewModal.style.display = 'none';
        previewIframe.srcdoc = '';
    });

    async function runCode() {
        if (!currentProject) return;
        const htmlContent = await fs.readFile(currentProject, 'index.html');
        const cssContent = await fs.readFile(currentProject, 'style.css');
        const jsContent = await fs.readFile(currentProject, 'script.js');

        const iframeContent = `
            <html>
                <head><style>${cssContent || ''}</style></head>
                <body>${htmlContent || ''}<script>${jsContent || ''}<\/script></body>
            </html>`;

        previewIframe.srcdoc = iframeContent;
        previewModal.style.display = 'flex';
    }


    // --- Popups ---
    function showPopup(title, message, options = {}) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;
        popupConfirm.style.display = options.showCancel === false ? 'inline-block' : 'none';
        popupCancel.style.display = options.showCancel !== false ? 'inline-block' : 'none';
        customPopup.style.display = 'flex';
        return new Promise((resolve) => {
            popupConfirm.onclick = () => { customPopup.style.display = 'none'; resolve(true); };
            popupCancel.onclick = () => { customPopup.style.display = 'none'; resolve(false); };
        });
    }

    // --- Language Detection ---
    function detectLanguageFromExtension(fileName) {
        const ext = fileName.split('.').pop();
        const languages = {
            'js': 'javascript', 'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json',
            'ts': 'typescript', 'java': 'java', 'cs': 'csharp', 'cpp': 'cpp', 'go': 'go',
            'php': 'php', 'rb': 'ruby', 'rs': 'rust', 'sql': 'sql', 'swift': 'swift',
            'kt': 'kotlin', 'lua': 'lua', 'pl': 'perl', 'sh': 'shell', 'md': 'markdown',
        };
        return languages[ext] || 'plaintext';
    }

    function getLanguageName(languageId) {
        const names = {
            'javascript': 'JavaScript', 'python': 'Python', 'html': 'HTML', 'css': 'CSS',
            'typescript': 'TypeScript', 'java': 'Java', 'csharp': 'C#', 'cpp': 'C++',
            'go': 'Go', 'php': 'PHP', 'ruby': 'Ruby', 'rust': 'Rust', 'sql': 'SQL',
            'swift': 'Swift', 'kotlin': 'Kotlin', 'lua': 'Lua', 'perl': 'Perl',
            'shell': 'Shell', 'markdown': 'Markdown', 'plaintext': 'Plain Text'
        };
        return names[languageId] || languageId;
    }


    // --- Monaco Editor Initialization ---
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        monaco.editor.defineTheme('razen-dark', {
            base: 'vs-dark', inherit: true,
            rules: [{ token: 'comment', foreground: '608b4e' }],
            colors: { 'editor.background': '#1e1e2e' }
        });
        monaco.editor.defineTheme('razen-light', {
            base: 'vs', inherit: true,
            rules: [{ token: 'comment', foreground: '6a737d' }],
            colors: { 'editor.background': '#ffffff' }
        });

        editor = monaco.editor.create(document.getElementById('editor'), {
            value: `// Welcome to Razen Studio\n// Open a file from the sidebar to start editing.`,
            language: 'plaintext',
            theme: document.body.classList.contains('light-theme') ? 'razen-light' : 'razen-dark',
            fontFamily: 'JetBrains Mono',
            automaticLayout: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            wordWrap: 'on',
            folding: true,
            bracketPairColorization: { enabled: true },
        });

        editor.onDidChangeModelContent(async () => {
            if (activeFilePath && currentProject) {
                const content = editor.getValue();
                const projectRootPath = (await fs.listProjects()).find(p => p.name === currentProject).path;
                const relativePath = activeFilePath.replace(projectRootPath + File.separator, '');
                fs.writeFile(currentProject, relativePath, content);
            }
        });

        editor.onDidChangeCursorPosition(e => {
            cursorPosition.textContent = `Line ${e.position.lineNumber}, Column ${e.position.column}`;
        });

        loadProjectFromURL();
    });
});