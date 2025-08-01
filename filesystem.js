// filesystem.js

/**
 * A wrapper around the Android WebAppInterface to handle file system operations.
 * Provides a fallback to localStorage for use in a standard browser environment.
 */
const FileSystem = {
    isAndroid: typeof window.Android !== 'undefined',

    /**
     * Lists all projects by calling the native Android interface.
     * The fallback lists keys from localStorage.
     * @returns {Promise<Array<Object>>} A list of project objects.
     */
    async listProjects() {
        if (this.isAndroid) {
            try {
                const projectsJson = await window.Android.listProjects();
                return JSON.parse(projectsJson);
            } catch (error) {
                console.error("Error listing projects from Android:", error);
                // Try to parse the error if it's a string from the backend
                try {
                    return { error: JSON.parse(error.message) };
                } catch (e) {
                    return { error: error.message };
                }
            }
        } else {
            // Fallback: list items from localStorage
            console.warn("Using localStorage fallback for project listing.");
            await this.seedLocalStorageForTesting(); // Add some fake data if none exists
            const projects = Object.keys(localStorage)
                .filter(key => key.startsWith('project_'))
                .map(key => {
                    try {
                        const proj = JSON.parse(localStorage.getItem(key));
                        // We only need metadata for the list view
                        return {
                            name: proj.name,
                            path: `LocalStorage/Projects/${proj.name}`,
                            createdAt: proj.createdAt,
                        };
                    } catch (e) {
                        return null;
                    }
                })
                .filter(p => p && p.name)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by date
            return Promise.resolve(projects);
        }
    },

    /**
     * Creates a new project using the native Android interface.
     * The fallback creates a new entry in localStorage.
     * @param {string} projectName - The name of the project to create.
     * @returns {Promise<{success: boolean, message: string}>} An object indicating success and a message.
     */
    async createProject(projectName) {
        if (!projectName || !projectName.trim()) {
            return { success: false, message: "Project name cannot be empty." };
        }

        if (this.isAndroid) {
            try {
                const result = await window.Android.createProject(projectName);
                if (result === "Success") {
                    return { success: true, message: "Project created successfully." };
                } else {
                    return { success: false, message: result }; // "Error: ..."
                }
            } catch (error) {
                console.error(`Error creating project '${projectName}' on Android:`, error);
                return { success: false, message: error.message };
            }
        } else {
            // Fallback: save project data to localStorage
            console.warn(`Using localStorage fallback to create project: ${projectName}`);
            const projectKey = `project_${projectName.replace(/\s+/g, '_')}`;
            if (localStorage.getItem(projectKey)) {
                return { success: false, message: "Error: Project already exists." };
            }
            const projectData = {
                name: projectName,
                createdAt: new Date().toISOString(),
                files: {
                    'index.html': `<!DOCTYPE html><html><head><title>${projectName}</title><link rel="stylesheet" href="style.css"></head><body><h1>Welcome to ${projectName}</h1><script src="script.js"></script></body></html>`,
                    'style.css': `body { font-family: sans-serif; }`,
                    'script.js': `console.log("Hello from ${projectName}");`
                }
            };
            localStorage.setItem(projectKey, JSON.stringify(projectData));
            return Promise.resolve({ success: true, message: "Project created in localStorage." });
        }
    },

    /**
     * Deletes a project using the native Android interface.
     * The fallback removes the item from localStorage.
     * @param {string} projectName - The name of the project to delete.
     * @returns {Promise<{success: boolean, message: string}>} An object indicating success and a message.
     */
    async deleteProject(projectName) {
        if (this.isAndroid) {
            try {
                const result = await window.Android.deleteProject(projectName);
                if (result === "Success") {
                    return { success: true, message: "Project deleted successfully." };
                } else {
                    return { success: false, message: result };
                }
            } catch (error) {
                console.error(`Error deleting project '${projectName}' on Android:`, error);
                return { success: false, message: error.message };
            }
        } else {
            // Fallback: remove from localStorage
            console.warn(`Using localStorage fallback to delete project: ${projectName}`);
            const projectKey = `project_${projectName.replace(/\s+/g, '_')}`;
            if (!localStorage.getItem(projectKey)) {
                return { success: false, message: "Error: Project not found." };
            }
            localStorage.removeItem(projectKey);
            return Promise.resolve({ success: true, message: "Project deleted from localStorage." });
        }
    },

    /**
     * Loads a project's data using the native Android interface.
     * The fallback reads from localStorage.
     * @param {string} projectName - The name of the project to load.
     * @returns {Promise<Object|null>} The project data or null if not found.
     */
    async loadProject(projectName) {
        if (this.isAndroid) {
            try {
                const projectDataJSON = await window.Android.loadProject(projectName);
                if (projectDataJSON.startsWith("Error:")) {
                    console.error("Failed to load project:", projectDataJSON);
                    return null;
                }
                return JSON.parse(projectDataJSON);
            } catch (error) {
                console.error(`Error loading project '${projectName}' from Android:`, error);
                return null;
            }
        } else {
            // Fallback: load from localStorage
            console.warn(`Using localStorage fallback to load project: ${projectName}`);
            const projectKey = `project_${projectName.replace(/\s+/g, '_')}`;
            const data = localStorage.getItem(projectKey);
            return Promise.resolve(data ? JSON.parse(data) : null);
        }
    },

    /**
     * Seeds localStorage with a couple of example projects if it's empty.
     * For testing purposes only.
     */
    async seedLocalStorageForTesting() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('project_'));
        if (keys.length === 0) {
            console.log("Seeding localStorage with test projects...");
            await this.createProject("My First Website");
            await this.createProject("Another Cool Project");
        }
    }
};
