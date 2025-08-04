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
    let contextMenuTarget = null; // To keep track of the context menu target
    let clipboard = null; // To hold {path, type, operation: 'copy' | 'cut'}
    const brandIcons = ['fa-html5', 'fa-css3-alt', 'fa-js-square', 'fa-python', 'fa-java', 'fa-rust', 'fa-markdown'];

    // --- Project Loading ---
    async function loadProjectFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectName = urlParams.get('project');

        if (!projectName) {
            // If no project is specified in the URL, redirect to the dashboard.
            window.location.href = 'dashboard.html';
            return;
        }

        currentProject = projectName;

        if (fs) {
            document.querySelector('header h1').innerHTML = `<i class="fas fa-folder-open"></i> ${projectName}`;
            refreshFileTree(); // Initial load
            const fileTree = await fs.listProjectContents(projectName);
            const firstFile = findDefaultFile(fileTree);
            if (firstFile) {
                openFile(firstFile.path);
            }
        } else {
            fileListContainer.innerHTML = '<p style="padding: 10px;">FileSystem API not available.</p>';
        }
    }

    async function refreshFileTree() {
        if (currentProject && fs) {
            const fileTree = await fs.listProjectContents(currentProject);
            renderFileTree(fileTree, fileListContainer);
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
                const iconName = getIconForFile(node.name);
                const prefix = brandIcons.includes(iconName) ? 'fab' : 'fas';
                fileIcon.className = `${prefix} ${iconName} file-icon`;
                itemButton.appendChild(fileIcon);

                itemButton.addEventListener('click', () => openFile(node.path));
            }

            const nameSpan = document.createElement('span');
            nameSpan.textContent = node.name;
            itemButton.appendChild(nameSpan);

            // Add context menu listener
            itemButton.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, node.path, node.type);
            });

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
        const relativePath = filePath.replace(projectRootPath + '/', '');

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

    document.getElementById('new-file-btn').addEventListener('click', () => createNewItem('file'));
    document.getElementById('new-folder-btn').addEventListener('click', () => createNewItem('folder'));
    document.getElementById('import-files-btn').addEventListener('click', async () => {
        // A simple alert for now, as full implementation is complex
        showPopup('Not Implemented', 'File import is not yet available.', { showCancel: false });
    });

    async function createNewItem(type) {
        const promptMessage = type === 'file' ? 'Enter new filename:' : 'Enter new folder name:';
        const itemName = await showInputPopup(promptMessage);

        if (itemName) {
            // For now, creating at the root. A more advanced implementation
            // could create relative to a selected folder.
            const result = type === 'file'
                ? await fs.createFile(currentProject, itemName)
                : await fs.createFolder(currentProject, itemName);

            if (result.success) {
                refreshFileTree();
            } else {
                showPopup('Error', `Could not create ${type}: ${result.message}`, { showCancel: false });
            }
        }
    }

    function showInputPopup(message) {
        // This reuses the existing filename-popup from index.html
        const popup = document.getElementById('filename-popup');
        const input = document.getElementById('filename-input');
        const confirmBtn = document.getElementById('filename-confirm');
        const cancelBtn = document.getElementById('filename-cancel');

        document.getElementById('filename-popup').querySelector('p').textContent = message;
        input.value = '';
        popup.style.display = 'flex';
        input.focus();

        return new Promise((resolve) => {
            confirmBtn.onclick = () => {
                popup.style.display = 'none';
                resolve(input.value.trim());
            };
            cancelBtn.onclick = () => {
                popup.style.display = 'none';
                resolve(null);
            };
            input.onkeydown = (e) => {
                if (e.key === 'Enter') confirmBtn.click();
                if (e.key === 'Escape') cancelBtn.click();
            };
        });
    }


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
        if (!currentProject) {
            showPopup('Error', 'No project is currently open.', { showCancel: false });
            return;
        }

        // Fallback to index.html if no file is active or the active one isn't HTML
        let entryHtmlRelativePath;
        if (activeFilePath && activeFilePath.toLowerCase().endsWith('.html')) {
            const projectRootPath = (await fs.listProjects()).find(p => p.name === currentProject).path;
            entryHtmlRelativePath = activeFilePath.replace(projectRootPath + '/', '');
        } else {
            // Check if index.html exists at the root
            const projectContents = await fs.listProjectContents(currentProject);
            const indexFile = projectContents.find(f => f.name === 'index.html' && f.type === 'file');
            if (indexFile) {
                const projectRootPath = (await fs.listProjects()).find(p => p.name === currentProject).path;
                entryHtmlRelativePath = indexFile.path.replace(projectRootPath + '/', '');
            } else {
                showPopup('Error', 'Could not find an HTML file to preview. Please open an HTML file or create an index.html.', { showCancel: false });
                return;
            }
        }

        try {
            const entryHtmlContent = await fs.readFile(currentProject, entryHtmlRelativePath);
            if (typeof entryHtmlContent !== 'string' || entryHtmlContent.startsWith('Error:')) {
                showPopup('Error', `Could not read the HTML file: ${entryHtmlContent}`, { showCancel: false });
                return;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(entryHtmlContent, 'text/html');
            const basePath = entryHtmlRelativePath.includes('/') ? entryHtmlRelativePath.substring(0, entryHtmlRelativePath.lastIndexOf('/') + 1) : '';

            const processPromises = [];

            // Process CSS <link> tags
            doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http:') && !href.startsWith('https:') && !href.startsWith('//')) {
                    const cssPath = new URL(href, `file:///${basePath}`).pathname.substring(1);
                    const promise = fs.readFile(currentProject, cssPath).then(cssContent => {
                        if (typeof cssContent === 'string' && !cssContent.startsWith('Error:')) {
                            const style = doc.createElement('style');
                            style.textContent = cssContent;
                            link.replaceWith(style);
                        } else {
                            console.warn(`Could not load CSS file: ${cssPath}`);
                        }
                    });
                    processPromises.push(promise);
                }
            });

            // Process <script> tags with src
            doc.querySelectorAll('script[src]').forEach(script => {
                const src = script.getAttribute('src');
                if (src && !src.startsWith('http:') && !src.startsWith('https:') && !src.startsWith('//')) {
                    const jsPath = new URL(src, `file:///${basePath}`).pathname.substring(1);
                    const promise = fs.readFile(currentProject, jsPath).then(jsContent => {
                        if (typeof jsContent === 'string' && !jsContent.startsWith('Error:')) {
                            const newScript = doc.createElement('script');
                            newScript.textContent = jsContent;
                            // Copy other attributes like type, defer, etc.
                            for (const attr of script.attributes) {
                                if (attr.name !== 'src') {
                                    newScript.setAttribute(attr.name, attr.value);
                                }
                            }
                            script.parentNode.replaceChild(newScript, script);
                        } else {
                            console.warn(`Could not load JS file: ${jsPath}`);
                        }
                    });
                    processPromises.push(promise);
                }
            });

            await Promise.all(processPromises);

            // Serialize the document back to a string, ensuring correct doctype
            const finalHtml = '<!DOCTYPE html>' + doc.documentElement.outerHTML;

            previewIframe.srcdoc = finalHtml;
            previewModal.style.display = 'flex';

        } catch (error) {
            console.error("Error during code preview generation:", error);
            showPopup('Preview Error', `An unexpected error occurred: ${error.message}`, { showCancel: false });
        }
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

    // --- Context Menu ---
    function showContextMenu(event, path, type) {
        const menu = document.getElementById('file-context-menu');
        contextMenuTarget = { path, type };

        // Enable/disable paste
        const pasteItem = document.getElementById('context-menu-paste');
        pasteItem.classList.toggle('disabled', !clipboard || type !== 'folder');

        // Enable/disable preview
        const previewItem = document.getElementById('context-menu-preview');
        previewItem.classList.toggle('disabled', !path.toLowerCase().endsWith('.html'));

        menu.style.display = 'block';
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
    }

    function hideContextMenu() {
        document.getElementById('file-context-menu').style.display = 'none';
    }

    async function handleContextMenuAction(action) {
        hideContextMenu();
        if (!contextMenuTarget) return;

        const { path, type } = contextMenuTarget;
        const projectRootPath = (await fs.listProjects()).find(p => p.name === currentProject).path;
        const relativePath = path.replace(projectRootPath + '/', '');

        switch (action) {
            case 'copy':
                clipboard = { path, type, operation: 'copy' };
                break;

            case 'cut':
                clipboard = { path, type, operation: 'cut' };
                break;

            case 'paste':
                if (clipboard && type === 'folder') {
                    const destRelativePath = relativePath;
                    const srcRelativePath = clipboard.path.replace(projectRootPath + '/', '');

                    const result = clipboard.operation === 'cut'
                        ? await fs.rename(currentProject, srcRelativePath, `${destRelativePath}/${clipboard.path.split('/').pop()}`)
                        : await fs.copy(currentProject, srcRelativePath, destRelativePath);

                    if (result.success) {
                        if (clipboard.operation === 'cut') clipboard = null; // Clear after paste
                        refreshFileTree();
                    } else {
                        showPopup('Error', `Paste failed: ${result.message}`, { showCancel: false });
                    }
                }
                break;

            case 'rename':
                const newName = await showInputPopup(`Rename ${type}:`);
                if (newName) {
                    const result = await fs.rename(currentProject, relativePath, newName);
                    if (result.success) {
                        refreshFileTree();
                    } else {
                        showPopup('Error', `Rename failed: ${result.message}`, { showCancel: false });
                    }
                }
                break;

            case 'copy-path':
                navigator.clipboard.writeText(path).catch(err => console.error('Failed to copy path: ', err));
                break;

            case 'preview':
                if (path.toLowerCase().endsWith('.html')) {
                    runCode(path);
                }
                break;

            case 'download':
                showPopup('Not Implemented', 'Download is not yet available.', { showCancel: false });
                break;

            case 'delete':
                const confirm = await showPopup('Confirm Deletion', `Are you sure you want to delete this ${type}?`, { showCancel: true });
                if (confirm) {
                    const result = await fs.deletePath(currentProject, relativePath);
                    if (result.success) {
                        if (path === activeFilePath) {
                            editor.setValue(`// File deleted: ${relativePath}`);
                            activeFilePath = null;
                        }
                        refreshFileTree();
                    } else {
                        showPopup('Error', `Could not delete: ${result.message}`, { showCancel: false });
                    }
                }
                break;
        }
    }

    document.getElementById('context-menu-copy').addEventListener('click', () => handleContextMenuAction('copy'));
    document.getElementById('context-menu-cut').addEventListener('click', () => handleContextMenuAction('cut'));
    document.getElementById('context-menu-paste').addEventListener('click', (e) => {
        if (!e.target.classList.contains('disabled')) handleContextMenuAction('paste');
    });
    document.getElementById('context-menu-rename').addEventListener('click', () => handleContextMenuAction('rename'));
    document.getElementById('context-menu-copy-path').addEventListener('click', () => handleContextMenuAction('copy-path'));
    document.getElementById('context-menu-preview').addEventListener('click', (e) => {
        if (!e.target.classList.contains('disabled')) handleContextMenuAction('preview');
    });
    document.getElementById('context-menu-download').addEventListener('click', () => handleContextMenuAction('download'));
    document.getElementById('context-menu-delete').addEventListener('click', () => handleContextMenuAction('delete'));

    window.addEventListener('click', hideContextMenu);


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
                const relativePath = activeFilePath.replace(projectRootPath + '/', '');
                fs.writeFile(currentProject, relativePath, content);
            }
        });

        editor.onDidChangeCursorPosition(e => {
            cursorPosition.textContent = `Line ${e.position.lineNumber}, Column ${e.position.column}`;
        });

        loadProjectFromURL();
    });
});