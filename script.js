// script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const codeEditor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const highlighting = document.getElementById('highlighting');
    const highlightingContent = document.getElementById('highlighting-content');
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const cursorPosition = document.getElementById('cursor-position');
    const autocompleteSuggestions = document.getElementById('autocomplete-suggestions');
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
    const languageIndicator = document.getElementById('language-indicator');

    // State
    let currentTheme = 'dark';
    let autocompleteData = [];
    let undoStack = [];
    let redoStack = [];
    let files = {};
    let activeFileId = null;
    let fileCounter = 1;

    // Load keywords and autocomplete data
    loadLanguageData();

    // Initialize editor
    updateLineNumbers();
    updateCursorPosition();

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

    codeEditor.addEventListener('input', (e) => {
        if (e.inputType !== 'historyUndo' && e.inputType !== 'historyRedo') {
            undoStack.push(codeEditor.value);
            redoStack = [];
        }
        if (activeFileId) {
            files[activeFileId].content = codeEditor.value;
        }
        updateLineNumbers();
        highlightSyntax();
    });
    
    codeEditor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeEditor.scrollTop;
        highlighting.scrollTop = codeEditor.scrollTop;
        highlighting.scrollLeft = codeEditor.scrollLeft;
    });
    
    codeEditor.addEventListener('keydown', handleKeyDown);
    
    codeEditor.addEventListener('keyup', (e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Enter') {
            showAutocomplete();
        }
    });
    
    copyBtn.addEventListener('click', copyCode);
    themeToggle.addEventListener('click', toggleTheme);
    tabBtn.addEventListener('click', () => handleKeyDown({ key: 'Tab', preventDefault: () => {} }));
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    bracketBtn.addEventListener('click', insertBrackets);
    searchBtn.addEventListener('click', showSearchPopup);
    findNextBtn.addEventListener('click', findNext);
    replaceBtn.addEventListener('click', replace);
    replaceAllBtn.addEventListener('click', replaceAll);
    searchCancelBtn.addEventListener('click', hideSearchPopup);
    
    // Autocomplete navigation
    document.addEventListener('keydown', (e) => {
        if (autocompleteSuggestions.style.display === 'block') {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateAutocomplete(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateAutocomplete(1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectAutocomplete();
            } else if (e.key === 'Escape') {
                hideAutocomplete();
            }
        }
    });
    
    // Click outside to close autocomplete
    document.addEventListener('click', (e) => {
        if (!autocompleteSuggestions.contains(e.target) && e.target !== codeEditor) {
            hideAutocomplete();
        }
    });
    
    // Functions
    function updateLineNumbers() {
        const lines = codeEditor.value.split('\n').length;
        lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('\n');
    }
    
    function updateCursorPosition() {
        const cursorPos = codeEditor.selectionStart;
        const textBeforeCursor = codeEditor.value.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const lineNumber = lines.length;
        const columnNumber = lines[lines.length - 1].length + 1;
        cursorPosition.textContent = `Line ${lineNumber}, Column ${columnNumber}`;
    }
    
    function highlightSyntax() {
        if (!activeFileId) {
            highlightingContent.innerHTML = '\n';
            return;
        }

        const file = files[activeFileId];
        const code = file.content;
        const extension = file.name.split('.').pop();
        let language;

        switch (extension) {
            case 'js':
                language = 'javascript';
                break;
            case 'py':
                language = 'python';
                break;
            case 'rs':
                language = 'rust';
                break;
            case 'rzn':
            default:
                language = 'razen';
                break;
        }

        if (Prism.languages[language]) {
            const highlightedCode = Prism.highlight(code, Prism.languages[language], language);
            highlightingContent.innerHTML = highlightedCode + '\n';
        } else {
            // Fallback for unsupported languages
            highlightingContent.textContent = code + '\n';
        }
    }
    
    function copyCode() {
        navigator.clipboard.writeText(codeEditor.value)
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
    
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        themeToggle.innerHTML = currentTheme === 'dark' 
            ? '<i class="fas fa-moon"></i> Dark' 
            : '<i class="fas fa-sun"></i> Light';
    }
    
    async function loadLanguageData() {
        try {
            const response = await fetch('autocomplete.json');
            const data = await response.json();
            autocompleteData = [
                ...data.keywords.map(kw => ({ text: kw, icon: 'fa-key' })),
                ...data.functions.map(fn => ({ text: fn, icon: 'fa-function' })),
                ...data.types.map(t => ({ text: t, icon: 'fa-cube' })),
                ...data.operators.map(op => ({ text: op, icon: 'fa-calculator' })),
                ...data.punctuation.map(p => ({ text: p, icon: 'fa-pencil-alt' }))
            ];
        } catch (error) {
            console.error('Error loading language data:', error);
        }
    }
    
    function showAutocomplete() {
        const cursorPos = codeEditor.selectionStart;
        const textBeforeCursor = codeEditor.value.substring(0, cursorPos);
        const lastWord = textBeforeCursor.split(/[\s\n]/).pop();
        
        if (lastWord.length < 2) {
            hideAutocomplete();
            return;
        }
        
        const suggestions = autocompleteData.filter(item => 
            item.text.toLowerCase().startsWith(lastWord.toLowerCase())
        );
        
        if (suggestions.length === 0) {
            hideAutocomplete();
            return;
        }
        
        // Position the autocomplete below the cursor
        const cursorCoords = getCaretCoordinates(codeEditor, cursorPos);
        autocompleteSuggestions.style.display = 'block';
        autocompleteSuggestions.style.top = `${cursorCoords.top + 20}px`;
        autocompleteSuggestions.style.left = `${cursorCoords.left}px`;
        
        // Populate suggestions
        autocompleteSuggestions.innerHTML = '';
        suggestions.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            if (index === 0) div.classList.add('active');
            div.innerHTML = `<i class="fas ${item.icon}"></i> ${item.text}`;
            div.dataset.value = item.text;
            div.addEventListener('click', () => {
                insertAutocomplete(item.text);
            });
            autocompleteSuggestions.appendChild(div);
        });
    }
    
    function hideAutocomplete() {
        autocompleteSuggestions.style.display = 'none';
    }
    
    function navigateAutocomplete(direction) {
        const items = autocompleteSuggestions.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;
        
        let activeIndex = Array.from(items).findIndex(item => item.classList.contains('active'));
        items[activeIndex].classList.remove('active');
        
        activeIndex += direction;
        if (activeIndex < 0) activeIndex = items.length - 1;
        if (activeIndex >= items.length) activeIndex = 0;
        
        items[activeIndex].classList.add('active');
    }
    
    function selectAutocomplete() {
        const activeItem = autocompleteSuggestions.querySelector('.autocomplete-item.active');
        if (activeItem) {
            insertAutocomplete(activeItem.dataset.value);
        }
    }
    
    function insertAutocomplete(value) {
        const cursorPos = codeEditor.selectionStart;
        const textBeforeCursor = codeEditor.value.substring(0, cursorPos);
        const textAfterCursor = codeEditor.value.substring(cursorPos);
        const lastWord = textBeforeCursor.split(/[\s\n]/).pop();
        
        const newText = textBeforeCursor.substring(0, textBeforeCursor.length - lastWord.length) + 
                        value + textAfterCursor;
        
        codeEditor.value = newText;
        codeEditor.selectionStart = cursorPos - lastWord.length + value.length;
        codeEditor.selectionEnd = cursorPos - lastWord.length + value.length;
        
        hideAutocomplete();
        updateLineNumbers();
        highlightSyntax();
        codeEditor.focus();
    }
    
    function handleKeyDown(e) {
        updateCursorPosition();

        const bracketMap = {
            '(': ')',
            '[': ']',
            '{': '}',
            '"': '"',
            "'": "'"
        };

        if (bracketMap[e.key]) {
            e.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            const selectedText = codeEditor.value.substring(start, end);
            const closingBracket = bracketMap[e.key];

            codeEditor.value = codeEditor.value.substring(0, start) +
                              e.key + selectedText + closingBracket +
                              codeEditor.value.substring(end);

            codeEditor.selectionStart = start + 1;
            codeEditor.selectionEnd = end + 1;
            updateLineNumbers();
            highlightSyntax();
        }
        
        // Handle tab key for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            
            // Insert 4 spaces
            codeEditor.value = codeEditor.value.substring(0, start) + 
                              '    ' + 
                              codeEditor.value.substring(end);
            
            // Move cursor
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
            updateLineNumbers();
        }
    }
    
    // Helper function to get cursor position coordinates
    function getCaretCoordinates(element, position) {
        const div = document.createElement('div');
        const style = window.getComputedStyle(element);
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.boxSizing = 'border-box';
        div.style.width = element.offsetWidth + 'px';
        div.style.height = element.offsetHeight + 'px';
        div.style.padding = style.padding;
        div.style.border = style.border;
        div.style.fontFamily = style.fontFamily;
        div.style.fontSize = style.fontSize;
        div.style.lineHeight = style.lineHeight;
        div.textContent = element.value.substring(0, position);
        
        document.body.appendChild(div);
        const span = document.createElement('span');
        span.textContent = element.value.substring(position) || '.';
        div.appendChild(span);
        const coordinates = {
            top: span.offsetTop + element.offsetTop,
            left: span.offsetLeft + element.offsetLeft
        };
        document.body.removeChild(div);
        return coordinates;
    }

    function undo() {
        if (undoStack.length > 1) {
            redoStack.push(undoStack.pop());
            codeEditor.value = undoStack[undoStack.length - 1];
            updateLineNumbers();
            highlightSyntax();
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            undoStack.push(redoStack.pop());
            codeEditor.value = undoStack[undoStack.length - 1];
            updateLineNumbers();
            highlightSyntax();
        }
    }

    function insertBrackets() {
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        const text = codeEditor.value;
        const selectedText = text.substring(start, end);
        const newText = text.substring(0, start) + '{' + selectedText + '}' + text.substring(end);
        codeEditor.value = newText;
        codeEditor.selectionStart = start + 1;
        codeEditor.selectionEnd = end + 1;
        updateLineNumbers();
        highlightSyntax();
        codeEditor.focus();
    }

    function showSearchPopup() {
        searchPopup.style.display = 'flex';
        searchInput.focus();
    }

    function hideSearchPopup() {
        searchPopup.style.display = 'none';
    }

    function findNext() {
        const searchTerm = searchInput.value;
        const text = codeEditor.value;
        const fromIndex = codeEditor.selectionEnd;
        const index = text.indexOf(searchTerm, fromIndex);

        if (index !== -1) {
            codeEditor.selectionStart = index;
            codeEditor.selectionEnd = index + searchTerm.length;
            codeEditor.focus();
        } else {
            // Wrap search
            const wrapIndex = text.indexOf(searchTerm);
            if (wrapIndex !== -1) {
                codeEditor.selectionStart = wrapIndex;
                codeEditor.selectionEnd = wrapIndex + searchTerm.length;
                codeEditor.focus();
            } else {
                alert('Term not found');
            }
        }
    }

    function replace() {
        const searchTerm = searchInput.value;
        const replaceTerm = replaceInput.value;
        const text = codeEditor.value;
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;

        if (text.substring(start, end) === searchTerm) {
            codeEditor.value = text.substring(0, start) + replaceTerm + text.substring(end);
            codeEditor.selectionStart = start;
            codeEditor.selectionEnd = start + replaceTerm.length;
            codeEditor.focus();
            findNext();
        } else {
            findNext();
        }
    }

    function replaceAll() {
        const searchTerm = searchInput.value;
        const replaceTerm = replaceInput.value;
        const text = codeEditor.value;
        const newText = text.replace(new RegExp(searchTerm, 'g'), replaceTerm);
        codeEditor.value = newText;
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

        // Add default extension if not provided
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

    function renderFileList() {
        fileList.innerHTML = '';
        for (const fileId in files) {
            const file = files[fileId];
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.fileId = file.id;
            fileItem.textContent = file.name;

            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showPopup(`Are you sure you want to close ${file.name}?`, () => closeFile(file.id));
            });

            fileItem.appendChild(closeBtn);
            fileItem.addEventListener('click', () => setActiveFile(file.id));
            fileList.appendChild(fileItem);
        }
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

            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showPopup(`Are you sure you want to close ${file.name}?`, () => closeFile(file.id));
            });

            activeFileDiv.appendChild(closeBtn);
            activeFileDiv.addEventListener('click', () => setActiveFile(file.id));
            activeFilesContainer.appendChild(activeFileDiv);
        }
    }

    function setActiveFile(fileId) {
        if (!files[fileId]) return;

        activeFileId = fileId;
        codeEditor.value = files[fileId].content;
        updateLineNumbers();
        highlightSyntax();
        renderActiveFiles();
        updateLanguageIndicator();
        codeEditor.focus();
    }

    function updateLanguageIndicator() {
        if (!activeFileId) {
            languageIndicator.textContent = 'Plain Text';
            return;
        }

        const file = files[activeFileId];
        const extension = file.name.split('.').pop();
        let languageName;

        switch (extension) {
            case 'js':
                languageName = 'JavaScript';
                break;
            case 'py':
                languageName = 'Python';
                break;
            case 'rs':
                languageName = 'Rust';
                break;
            case 'rzn':
                languageName = 'Razen Lang';
                break;
            default:
                languageName = 'Plain Text';
                break;
        }
        languageIndicator.textContent = languageName;
    }

    function closeFile(fileId) {
        delete files[fileId];
        if (activeFileId === fileId) {
            activeFileId = Object.keys(files)[0] || null;
            if (activeFileId) {
                setActiveFile(activeFileId);
            } else {
                codeEditor.value = '';
                updateLineNumbers();
                highlightSyntax();
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
});