// filesystem.js

/**
 * A wrapper around the Android WebAppInterface to handle file system operations.
 * Provides a fallback to localStorage for use in a standard browser environment.
 */
const FileSystem = {
    /**
     * Checks if the Android interface is available.
     * @returns {boolean} True if the Android interface is available.
     */
    isAndroid() {
        return typeof window.Android !== 'undefined';
    },

    /**
     * Lists all projects by calling the native Android interface.
     * @returns {Promise<Array<Object>>} A list of project objects.
     */
    async listProjects() {
        if (this.isAndroid()) {
            try {
                const projectsJson = await window.Android.listProjects();
                return JSON.parse(projectsJson);
            } catch (error) {
                console.error("Error listing projects from Android:", error);
                return { error: error.message };
            }
        } else {
            // Fallback for browser testing
            console.warn("Using localStorage fallback for project listing.");
            return Promise.resolve(Object.keys(localStorage)
                .filter(key => key.startsWith('project_'))
                .map(key => ({ name: key.replace('project_', ''), path: `LocalStorage/${key}` }))
            );
        }
    },

    /**
     * Lists all files and folders within a project recursively.
     * @param {string} projectName - The name of the project.
     * @returns {Promise<Array<Object>>} A tree structure of files and folders.
     */
    async listProjectContents(projectName) {
        if (this.isAndroid()) {
            try {
                const treeJson = await window.Android.listProjectContents(projectName);
                return JSON.parse(treeJson);
            } catch (error) {
                console.error(`Error listing contents for project '${projectName}':`, error);
                return [];
            }
        } else {
            console.warn(`Using localStorage fallback for listing contents of: ${projectName}`);
            // This is a simplified fallback. A real implementation would be more complex.
            return Promise.resolve([
                { name: 'index.html', type: 'file', path: `${projectName}/index.html` },
                { name: 'style.css', type: 'file', path: `${projectName}/style.css` },
                { name: 'script.js', type: 'file', path: `${projectName}/script.js` },
                { name: 'assets', type: 'folder', children: [
                    { name: 'image.png', type: 'file', path: `${projectName}/assets/image.png` }
                ]},
            ]);
        }
    },

    /**
     * Reads the content of a single file within a project.
     * @param {string} projectName - The name of the project.
     * @param {string} relativePath - The relative path of the file within the project.
     * @returns {Promise<string>} The content of the file.
     */
    async readFile(projectName, relativePath) {
        if (this.isAndroid()) {
            try {
                const content = await window.Android.readFile(projectName, relativePath);
                if (content.startsWith("Error:")) {
                    throw new Error(content);
                }
                return content;
            } catch (error) {
                console.error(`Error reading file '${relativePath}' in project '${projectName}':`, error);
                return `// Error loading file: ${error.message}`;
            }
        } else {
            console.warn(`Using localStorage fallback for reading file: ${relativePath}`);
            // This is a simplified fallback.
            return `// Fallback content for ${relativePath}`;
        }
    },

    /**
     * Writes content to a single file within a project.
     * @param {string} projectName - The name of the project.
     * @param {string} relativePath - The relative path of the file.
     * @param {string} content - The content to write.
     * @returns {Promise<{success: boolean, message: string}>} Result object.
     */
    async writeFile(projectName, relativePath, content) {
        if (this.isAndroid()) {
            try {
                const result = await window.Android.writeFile(projectName, relativePath, content);
                if (result.startsWith("Error:")) {
                    return { success: false, message: result };
                }
                return { success: true, message: result };
            } catch (error) {
                console.error(`Error writing file '${relativePath}':`, error);
                return { success: false, message: error.message };
            }
        } else {
            console.warn(`Using localStorage fallback for writing file: ${relativePath}`);
            return Promise.resolve({ success: true, message: "File saved to localStorage (mock)." });
        }
    },

    /**
     * Creates a new project.
     * @param {string} projectName - The name for the new project.
     * @returns {Promise<{success: boolean, message: string}>} Result object.
     */
    async createProject(projectName) {
        if (this.isAndroid()) {
            const result = await window.Android.createProject(projectName);
            if (result === "Success") {
                return { success: true, message: "Project created successfully." };
            }
            return { success: false, message: result };
        } else {
            console.warn(`Using localStorage fallback to create project: ${projectName}`);
            localStorage.setItem(`project_${projectName}`, JSON.stringify({ files: {} }));
            return Promise.resolve({ success: true, message: "Project created in localStorage." });
        }
    },

    /**
     * Deletes a project.
     * @param {string} projectName - The name of the project to delete.
     * @returns {Promise<{success: boolean, message: string}>} Result object.
     */
    async deleteProject(projectName) {
        if (this.isAndroid()) {
            const result = await window.Android.deleteProject(projectName);
            if (result === "Success") {
                return { success: true, message: "Project deleted successfully." };
            }
            return { success: false, message: result };
        } else {
            console.warn(`Using localStorage fallback to delete project: ${projectName}`);
            localStorage.removeItem(`project_${projectName}`);
            return Promise.resolve({ success: true, message: "Project deleted from localStorage." });
        }
    },

    async createFile(projectName, relativePath) {
        if (this.isAndroid()) {
            const result = await window.Android.createFile(projectName, relativePath);
            return { success: result === "Success", message: result };
        } else {
            console.warn(`FS Fallback: Creating file ${relativePath}`);
            return Promise.resolve({ success: true, message: "File created (mock)." });
        }
    },

    async createFolder(projectName, relativePath) {
        if (this.isAndroid()) {
            const result = await window.Android.createFolder(projectName, relativePath);
            return { success: result === "Success", message: result };
        } else {
            console.warn(`FS Fallback: Creating folder ${relativePath}`);
            return Promise.resolve({ success: true, message: "Folder created (mock)." });
        }
    },

    async deletePath(projectName, relativePath) {
        if (this.isAndroid()) {
            const result = await window.Android.deletePath(projectName, relativePath);
            return { success: result === "Success", message: result };
        } else {
            console.warn(`FS Fallback: Deleting path ${relativePath}`);
            return Promise.resolve({ success: true, message: "Path deleted (mock)." });
        }
    },

    async importFiles(projectName, relativePath) {
        if (this.isAndroid()) {
            const result = await window.Android.importFiles(projectName, relativePath);
            return { success: result === "Success", message: result };
        } else {
            console.warn(`FS Fallback: Importing files to ${relativePath}`);
            return Promise.resolve({ success: false, message: "Not implemented in browser." });
        }
    }
};
