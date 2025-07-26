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
    const fileTabs = document.getElementById('file-tabs');
    const addFileBtn = document.getElementById('add-file-btn');
    const confirmationPopup = document.getElementById('confirmation-popup');
    const confirmCloseBtn = document.getElementById('confirm-close-btn');
    const cancelCloseBtn = document.getElementById('cancel-close-btn');
    
    // State
    let currentTheme = 'dark';
    let autocompleteData = [];
    let undoStack = [];
    let redoStack = [];
    let files = [];
    let activeFileId = null;
    let fileToClose = null;
    
    // Load keywords and autocomplete data
    loadLanguageData();
    
    // Initialize editor
    updateLineNumbers();
    updateCursorPosition();
    
    // Event Listeners
    codeEditor.addEventListener('input', (e) => {
        if (e.inputType !== 'historyUndo' && e.inputType !== 'historyRedo') {
            undoStack.push(codeEditor.value);
            redoStack = [];
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
    searchBtn.addEventListener('click', search);
    addFileBtn.addEventListener('click', () => createFile());
    confirmCloseBtn.addEventListener('click', () => {
        if (fileToClose) {
            closeFile(fileToClose);
            fileToClose = null;
        }
        confirmationPopup.style.display = 'none';
    });
    cancelCloseBtn.addEventListener('click', () => {
        fileToClose = null;
        confirmationPopup.style.display = 'none';
    });
    
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
        const code = codeEditor.value;
        const highlightedCode = Prism.highlight(code, Prism.languages.razen, 'razen');
        highlightingContent.innerHTML = highlightedCode + '\n';
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

    function search() {
        const searchTerm = prompt('Enter search term:');
        if (searchTerm) {
            const text = codeEditor.value;
            const index = text.indexOf(searchTerm);
            if (index !== -1) {
                codeEditor.selectionStart = index;
                codeEditor.selectionEnd = index + searchTerm.length;
                codeEditor.focus();
            } else {
                alert('Term not found');
            }
        }
    }

    function createFile() {
        if (files.length >= 10) {
            alert('You can only have a maximum of 10 files open.');
            return;
        }

        const newFile = {
            id: Date.now(),
            name: `untitled-${files.length + 1}`,
            content: ''
        };

        files.push(newFile);
        activeFileId = newFile.id;
        updateFileTabs();
        switchFile(newFile.id);
    }

    function switchFile(fileId) {
        if (activeFileId) {
            const currentFile = files.find(f => f.id === activeFileId);
            if (currentFile) {
                currentFile.content = codeEditor.value;
            }
        }

        activeFileId = fileId;
        const newFile = files.find(f => f.id === fileId);
        codeEditor.value = newFile.content;
        updateLineNumbers();
        highlightSyntax();
        updateFileTabs();
    }

    function closeFile(fileId) {
        const index = files.findIndex(f => f.id === fileId);
        if (index === -1) return;

        files.splice(index, 1);

        if (activeFileId === fileId) {
            if (files.length > 0) {
                const newActiveIndex = Math.max(0, index - 1);
                activeFileId = files[newActiveIndex].id;
                switchFile(activeFileId);
            } else {
                activeFileId = null;
                codeEditor.value = '';
                updateLineNumbers();
                highlightSyntax();
            }
        }

        updateFileTabs();
    }

    function updateFileTabs() {
        fileTabs.innerHTML = '';
        files.forEach(file => {
            const tab = document.createElement('div');
            tab.className = `file-tab ${file.id === activeFileId ? 'active' : ''}`;
            tab.dataset.fileId = file.id;
            tab.addEventListener('click', () => switchFile(file.id));

            const nameInput = document.createElement('input');
            nameInput.className = 'file-tab-name';
            nameInput.value = file.name;
            nameInput.addEventListener('change', (e) => {
                file.name = e.target.value;
            });

            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-tab-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileToClose = file.id;
                confirmationPopup.style.display = 'flex';
            });

            tab.appendChild(nameInput);
            tab.appendChild(closeBtn);
            fileTabs.appendChild(tab);
        });

        fileTabs.appendChild(addFileBtn);
    }

    createFile();
});