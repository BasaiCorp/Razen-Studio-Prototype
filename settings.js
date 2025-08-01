// settings.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Settings Navigation Logic ---
    const navButtons = document.querySelectorAll('.settings-nav-btn'); // Use the specific class
    const contentContainer = document.getElementById('settings-content');
    const contentTemplates = document.getElementById('settings-data'); // Hidden div containing templates
    
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
    
    // --- Navigation Dropdown Logic ---
    const navMenuBtn = document.getElementById('nav-menu-btn');
    const navMenuDropdown = document.getElementById('nav-menu-dropdown');

    if (navMenuBtn) {
        navMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = navMenuDropdown.style.display === 'block';
            navMenuDropdown.style.display = isVisible ? 'none' : 'block';
        });
    }

    // Global click listener to close the dropdown
    window.addEventListener('click', () => {
        if (navMenuDropdown && navMenuDropdown.style.display === 'block') {
            navMenuDropdown.style.display = 'none';
        }
    });
});