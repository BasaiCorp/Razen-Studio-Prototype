// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // --- FRAMEWORK DATA ---
    const FRAMEWORKS = [
        { id: 'no_framework', name: 'No Framework', description: 'Plain project without a specific framework.', icon: 'fas fa-code', color: '#6c757d' },
        { id: 'html_css_js', name: 'HTML, CSS & JS', description: 'Traditional web development stack.', icon: 'fab fa-html5', color: '#e34f26' },
        { id: 'python', name: 'Python', description: 'General purpose Python project.', icon: 'fab fa-python', color: '#3776ab' },
        { id: 'rust', name: 'Rust', description: 'Rust programming language projects', icon: 'fab fa-rust', color: '#000000' },
        { id: 'golang', name: 'Golang', description: 'Go programming language projects', icon: 'fab fa-go', color: '#00add8' },
    ];

    // --- DOM Elements ---
    const projectList = document.getElementById('project-list');
    const searchInput = document.getElementById('search-projects-input');
    const frameworkFilter = document.getElementById('framework-filter');
    const themeToggle = document.getElementById('theme-toggle');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');

    // Create Project Modal Elements
    const createProjectBtn = document.getElementById('create-project-btn');
    const createProjectModal = document.getElementById('create-project-modal');
    const cancelCreateProjectBtn = document.getElementById('cancel-create-project-btn');
    const confirmCreateProjectBtn = document.getElementById('confirm-create-project-btn');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const projectNameInput = document.getElementById('project-name-input');
    const frameworkSelectionContainer = document.getElementById('framework-selection');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const stepNumbers = document.querySelectorAll('.step-number');

    // Custom Popup Elements
    const customPopup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupConfirm = document.getElementById('popup-confirm');
    const popupCancel = document.getElementById('popup-cancel');

    let currentStep = 1;
    let selectedFramework = 'no_framework';
    let allProjects = [];

    // --- EVENT LISTENERS ---

    themeToggle.addEventListener('click', () => {
        const isLightTheme = document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', isLightTheme ? 'light-theme' : 'dark-theme');
        updateThemeIcon(isLightTheme);
    });

    createProjectBtn.addEventListener('click', () => openCreateProjectModal());
    cancelCreateProjectBtn.addEventListener('click', () => closeCreateProjectModal());

    nextStepBtn.addEventListener('click', () => navigateStep(1));
    prevStepBtn.addEventListener('click', () => navigateStep(-1));

    projectNameInput.addEventListener('input', () => {
        const sanitized = projectNameInput.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if(projectNameInput.value !== sanitized) {
            projectNameInput.value = sanitized;
        }
    });

    confirmCreateProjectBtn.addEventListener('click', handleCreateProject);

    searchInput.addEventListener('input', () => renderProjects());
    frameworkFilter.addEventListener('change', () => renderProjects());

    gridViewBtn.addEventListener('click', () => setViewMode('grid'));
    listViewBtn.addEventListener('click', () => setViewMode('list'));

    // --- FUNCTIONS ---

    function initializeDashboard() {
        // Theme setup
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isLight = savedTheme ? savedTheme === 'light-theme' : !prefersDark;
        if (isLight) document.body.classList.add('light-theme');
        updateThemeIcon(isLight);

        // View mode setup
        const savedView = localStorage.getItem('viewMode') || 'grid';
        setViewMode(savedView, true);

        // Populate dynamic elements
        populateFrameworks();
        populateFilterDropdown();

        // Load projects
        loadAndRenderProjects();
    }

    function updateThemeIcon(isLightTheme) {
        themeToggle.innerHTML = isLightTheme ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }

    function setViewMode(mode, isInitial = false) {
        if (!isInitial) localStorage.setItem('viewMode', mode);

        if (mode === 'list') {
            projectList.classList.remove('project-grid');
            projectList.classList.add('project-list-view');
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        } else {
            projectList.classList.remove('project-list-view');
            projectList.classList.add('project-grid');
            listViewBtn.classList.remove('active');
            gridViewBtn.classList.add('active');
        }
        // This ensures cards adapt to the new view
        renderProjects(allProjects);
    }

    function populateFrameworks() {
        frameworkSelectionContainer.innerHTML = '';
        FRAMEWORKS.forEach(fw => {
            const card = document.createElement('div');
            card.className = 'framework-card';
            card.dataset.id = fw.id;
            card.innerHTML = `
                <i class="${fw.icon}" style="color: ${fw.color};"></i>
                <h4>${fw.name}</h4>
                <p>${fw.description}</p>
            `;
            card.addEventListener('click', () => {
                selectedFramework = fw.id;
                document.querySelectorAll('.framework-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
            frameworkSelectionContainer.appendChild(card);
        });
    }

    function populateFilterDropdown() {
        FRAMEWORKS.forEach(fw => {
            const option = document.createElement('option');
            option.value = fw.id;
            option.textContent = fw.name;
            frameworkFilter.appendChild(option);
        });
    }

    // --- Create Project Modal Logic ---

    function openCreateProjectModal() {
        resetModal();
        createProjectModal.style.display = 'flex';
        projectNameInput.focus();
    }

    function closeCreateProjectModal() {
        createProjectModal.style.display = 'none';
    }

    function resetModal() {
        currentStep = 1;
        selectedFramework = 'no_framework';
        projectNameInput.value = '';
        step1.classList.add('active');
        step2.classList.remove('active');
        stepNumbers[0].classList.add('active');
        stepNumbers[1].classList.remove('active');
        prevStepBtn.style.display = 'none';
        nextStepBtn.style.display = 'inline-block';
        confirmCreateProjectBtn.style.display = 'none';
        document.querySelectorAll('.framework-card').forEach(c => c.classList.remove('selected'));
        const defaultFramework = frameworkSelectionContainer.querySelector(`[data-id="${selectedFramework}"]`);
        if (defaultFramework) defaultFramework.classList.add('selected');
    }

    function navigateStep(direction) {
        // Validation before proceeding
        if (direction > 0 && currentStep === 1) {
            if (projectNameInput.value.trim() === '') {
                showPopup('Invalid Name', 'Project name cannot be empty.', { showCancel: false, confirmText: 'OK' });
                return;
            }
        }

        currentStep += direction;

        step1.classList.toggle('active', currentStep === 1);
        step2.classList.toggle('active', currentStep === 2);

        stepNumbers[0].classList.toggle('active', currentStep === 1);
        stepNumbers[1].classList.toggle('active', currentStep === 2);

        prevStepBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
        nextStepBtn.style.display = currentStep < 2 ? 'inline-block' : 'none';
        confirmCreateProjectBtn.style.display = currentStep === 2 ? 'inline-block' : 'none';
    }

    async function handleCreateProject() {
        const projectName = projectNameInput.value.trim();
        if (!projectName) {
            showPopup('Error', 'Please enter a valid project name.', { showCancel: false });
            return;
        }

        closeCreateProjectModal();
        // The createProject method will now need to accept a framework
        const result = await FileSystem.createProject(projectName, selectedFramework);

        if (result.success) {
            await loadAndRenderProjects();
        } else {
            showPopup('Error', result.message, { showCancel: false });
        }
    }

    // --- Project Loading & Rendering ---

    async function loadAndRenderProjects() {
        projectList.innerHTML = '<p class="loading-message">Loading projects...</p>';
        const projectsOrError = await FileSystem.listProjects();

        if (projectsOrError.error) {
            projectList.innerHTML = `<p class="error-message">Error loading projects: ${projectsOrError.error}</p>`;
            return;
        }

        allProjects = projectsOrError;
        renderProjects();
    }

    function renderProjects() {
        projectList.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();
        const frameworkId = frameworkFilter.value;
        const isListView = projectList.classList.contains('project-list-view');

        const filteredProjects = allProjects.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(searchTerm);
            const frameworkMatch = frameworkId === 'all' || p.framework === frameworkId;
            return nameMatch && frameworkMatch;
        });

        if (filteredProjects.length === 0) {
            projectList.innerHTML = '<p class="no-results-message">No projects found. Try adjusting your filters or create one!</p>';
            return;
        }

        filteredProjects.forEach(project => {
            const card = createProjectCard(project, isListView);
            projectList.appendChild(card);
        });
    }

    function createProjectCard(project, isListView = false) {
        const card = document.createElement('div');
        card.className = `project-card ${isListView ? 'list-view' : ''}`;
        card.dataset.projectName = project.name;
        card.dataset.framework = project.framework;

        const framework = FRAMEWORKS.find(f => f.id === project.framework) || FRAMEWORKS[0];
        const projectPath = project.path || project.name;

        card.innerHTML = `
            <div class="project-card-header">
                <div class="title-line">
                    <i class="${framework.icon} framework-icon" style="color: ${framework.color};"></i>
                    <h3>${project.name}</h3>
                </div>
                <div class="project-path-container">
                    <i class="fas fa-folder"></i>
                    <div class="project-path" title="${projectPath}">${projectPath}</div>
                </div>
            </div>
            <div class="project-card-body">
                <p>Last modified: ${new Date(project.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
            <div class="project-card-footer">
                <button class="btn open-project-btn"><i class="fas fa-external-link-alt"></i> Open</button>
                <button class="btn delete-project-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;

        card.querySelector('.delete-project-btn').style.setProperty('--accent-primary', 'var(--error)');

        // --- Card Event Listeners ---
        card.querySelector('.open-project-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `index.html?project=${encodeURIComponent(project.name)}`;
        });

        card.querySelector('.delete-project-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmed = await showPopup(
                'Delete Project',
                `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
                { confirmText: 'Delete', cancelText: 'Cancel' }
            );
            if (confirmed) {
                const result = await FileSystem.deleteProject(project.name);
                if (result.success) {
                    await loadAndRenderProjects();
                } else {
                    showPopup('Error', result.message, { showCancel: false });
                }
            }
        });

        card.addEventListener('click', () => {
             window.location.href = `index.html?project=${encodeURIComponent(project.name)}`;
        });

        return card;
    }

    // --- Generic Popup ---
    function showPopup(title, message, options = {}) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;

        popupConfirm.style.display = options.showConfirm !== false ? 'inline-block' : 'none';
        popupCancel.style.display = options.showCancel !== false ? 'inline-block' : 'none';

        popupConfirm.textContent = options.confirmText || 'Confirm';
        popupCancel.textContent = options.cancelText || 'Cancel';

        customPopup.style.display = 'flex';

        return new Promise((resolve) => {
            popupConfirm.onclick = () => { customPopup.style.display = 'none'; resolve(true); };
            popupCancel.onclick = () => { customPopup.style.display = 'none'; resolve(false); };
        });
    }

    // --- INITIALIZATION ---
    initializeDashboard();
});
