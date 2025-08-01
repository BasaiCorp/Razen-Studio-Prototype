package com.basaicorp.razenstudio;

import android.content.Context;
import android.os.Environment;
import android.util.Log;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Comparator;

public class WebAppInterface {
    private final Context context;
    private static final String PROJECTS_DIR = "RazenStudio/Projects";
    private static final String LOG_TAG = "WebAppInterface";

    public WebAppInterface(Context context) {
        this.context = context;
    }

    private File getProjectsRoot() {
        File root = new File(Environment.getExternalStorageDirectory(), PROJECTS_DIR);
        if (!root.exists()) {
            root.mkdirs();
        }
        return root;
    }

    @JavascriptInterface
    public String listProjects() {
        File projectsRoot = getProjectsRoot();
        File[] projectDirs = projectsRoot.listFiles(File::isDirectory);
        if (projectDirs == null) {
            return "[]";
        }

        // Sort by most recently modified
        Arrays.sort(projectDirs, Comparator.comparingLong(File::lastModified).reversed());

        JSONArray projects = new JSONArray();
        for (File dir : projectDirs) {
            try {
                JSONObject project = new JSONObject();
                project.put("name", dir.getName());
                project.put("path", dir.getPath());
                project.put("createdAt", dir.lastModified());
                projects.put(project);
            } catch (JSONException e) {
                Log.e(LOG_TAG, "Error creating JSON for project " + dir.getName(), e);
            }
        }
        return projects.toString();
    }

    @JavascriptInterface
    public String createProject(String projectName) {
        if (projectName == null || projectName.trim().isEmpty()) {
            return "Error: Project name is invalid.";
        }
        File projectDir = new File(getProjectsRoot(), projectName);
        if (projectDir.exists()) {
            return "Error: Project already exists.";
        }
        if (!projectDir.mkdirs()) {
            return "Error: Could not create project directory.";
        }

        try {
            createFile(projectDir, "index.html", getPresetHtmlContent(projectName));
            createFile(projectDir, "style.css", "/* CSS for " + projectName + " */\n\nbody {\n    font-family: sans-serif;\n}");
            createFile(projectDir, "script.js", "// JavaScript for " + projectName + "\n\nconsole.log('Hello, " + projectName + "!');");
            return "Success";
        } catch (IOException e) {
            Log.e(LOG_TAG, "Error creating files for project " + projectName, e);
            // Clean up created directory if file creation fails
            deleteDirectory(projectDir);
            return "Error: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String deleteProject(String projectName) {
        File projectDir = new File(getProjectsRoot(), projectName);
        if (!projectDir.exists() || !projectDir.isDirectory()) {
            return "Error: Project not found.";
        }
        if (deleteDirectory(projectDir)) {
            return "Success";
        } else {
            return "Error: Failed to delete project directory.";
        }
    }

    @JavascriptInterface
    public String loadProject(String projectName) {
        File projectDir = new File(getProjectsRoot(), projectName);
        if (!projectDir.exists() || !projectDir.isDirectory()) {
            return "Error: Project not found";
        }

        JSONObject projectData = new JSONObject();
        JSONObject files = new JSONObject();
        try {
            projectData.put("name", projectName);
            File[] projectFiles = projectDir.listFiles();
            if (projectFiles != null) {
                for (File file : projectFiles) {
                    if (file.isFile()) {
                        files.put(file.getName(), readFileContent(file));
                    }
                }
            }
            projectData.put("files", files);
        } catch (JSONException | IOException e) {
            Log.e(LOG_TAG, "Error loading project " + projectName, e);
            return "Error: " + e.getMessage();
        }
        return projectData.toString();
    }

    @JavascriptInterface
    public String readFile(String filePath) {
        // This remains for general purpose file reading if needed, but should be used with care.
        // It's recommended to use loadProject for project files.
        File file = new File(Environment.getExternalStorageDirectory(), filePath);
        if (!file.exists()) {
            return "Error: File not found";
        }
        try {
            return readFileContent(file);
        } catch (IOException e) {
            return "Error: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String writeFile(String filePath, String content) {
        // This remains for general purpose file writing, e.g., the main editor functionality.
        File file = new File(Environment.getExternalStorageDirectory(), filePath);
        File parentDir = file.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(content.getBytes(StandardCharsets.UTF_8));
            return "Success: File written";
        } catch (IOException e) {
            return "Error: " + e.getMessage();
        }
    }

    // --- Helper Methods ---

    private void createFile(File parentDir, String fileName, String content) throws IOException {
        File file = new File(parentDir, fileName);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(content.getBytes(StandardCharsets.UTF_8));
        }
    }

    private String readFileContent(File file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] data = new byte[(int) file.length()];
            fis.read(data);
            return new String(data, StandardCharsets.UTF_8);
        }
    }

    private boolean deleteDirectory(File dir) {
        File[] files = dir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    deleteDirectory(file);
                } else {
                    file.delete();
                }
            }
        }
        return dir.delete();
    }

    private String getPresetHtmlContent(String title) {
        return "<!DOCTYPE html>\n" +
               "<html lang=\"en\">\n" +
               "<head>\n" +
               "    <meta charset=\"UTF-8\">\n" +
               "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
               "    <title>" + title + "</title>\n" +
               "    <link rel=\"stylesheet\" href=\"style.css\">\n" +
               "</head>\n" +
               "<body>\n" +
               "    <h1>" + title + "</h1>\n" +
               "    <script src=\"script.js\"></script>\n" +
               "</body>\n" +
               "</html>";
    }
}
