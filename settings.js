// settings.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Settings Navigation Logic ---
    const navButtons = document.querySelectorAll('.settings-nav-btn'); // Use the specific class
    const contentContainer = document.getElementById('settings-content');
    const contentTemplates = document.getElementById('settings-data'); // Hidden div containing templates
    
    // Function to apply currently saved customisation settings to the UI
    function applyCustomisationSettings() {
        // Set active theme button
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-theme' : 'light-theme');
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.dataset.theme === savedTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Set selected font in dropdown
        const savedFont = localStorage.getItem('editorFont') || 'Google Sans Code';
        const fontSelect = document.getElementById('font-select');
        if (fontSelect) {
            fontSelect.value = savedFont;
        }
    }

    // Function to load content based on target ID
    function loadContent(targetId) {
        // Clear current content
        contentContainer.innerHTML = '';
        
        // Find the corresponding content template
        const template = contentTemplates.querySelector(`#${targetId}-content`);
        
        if (template) {
            // Clone the template content and append it
            const clonedContent = template.cloneNode(true);
            // Remove the ID from the clone to avoid duplicates
            clonedContent.removeAttribute('id');
            contentContainer.appendChild(clonedContent);

            // If we just loaded the customisation content, apply its settings
            if (targetId === 'customisation') {
                applyCustomisationSettings();
            }
        } else {
            // Handle case where content is not found
            contentContainer.innerHTML = '<p>Content not found.</p>';
        }
    }
    
    // Function to update active button state
    function setActiveButton(targetButton) {
        // Remove active class from all buttons
        navButtons.forEach(button => button.classList.remove('active'));
        // Add active class to the clicked button
        targetButton.classList.add('active');
    }
    
    // Event listener for navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            if (targetId) {
                loadContent(targetId);
                setActiveButton(button);
                
                // Optionally close sidebar on mobile after selection
                if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            }
        });
    });
    
    // --- Load initial content (e.g., GitHub) ---
    // Find the initially active button
    const initialActiveButton = document.querySelector('.settings-nav-btn.active');
    if (initialActiveButton) {
        const initialTargetId = initialActiveButton.getAttribute('data-target');
        if (initialTargetId) {
            loadContent(initialTargetId);
        }
    } else if (navButtons.length > 0) {
        // If no button is marked active, load the first one
        const firstButton = navButtons[0];
        const firstTargetId = firstButton.getAttribute('data-target');
        if (firstTargetId) {
            loadContent(firstTargetId);
            setActiveButton(firstButton);
        }
    }
    
    // --- Event Delegation for Customisation Settings ---
    contentContainer.addEventListener('click', (e) => {
        // Theme switcher logic
        const themeButton = e.target.closest('.theme-btn');
        if (themeButton) {
            const newTheme = themeButton.dataset.theme;

            // Remove old theme, add new one
            document.body.classList.remove('light-theme', 'dark-theme');
            document.body.classList.add(newTheme);

            // Save to local storage
            localStorage.setItem('theme', newTheme);

            // Update active button UI
            document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
            themeButton.classList.add('active');
        }
    });

    contentContainer.addEventListener('change', (e) => {
        // Font selector logic
        if (e.target.id === 'font-select') {
            const selectedFont = e.target.value;
            localStorage.setItem('editorFont', selectedFont);
        }
    });
});