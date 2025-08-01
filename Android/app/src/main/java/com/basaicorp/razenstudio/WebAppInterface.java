package com.basaicorp.razenstudio;

import android.content.Context;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class WebAppInterface {
    private final Context context;

    public WebAppInterface(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public String readFile(String filePath) {
        File file = new File(Environment.getExternalStorageDirectory(), filePath);
        if (!file.exists()) {
            return "Error: File not found";
        }
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] data = new byte[(int) file.length()];
            fis.read(data);
            return new String(data, StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "Error: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String writeFile(String filePath, String content) {
        File file = new File(Environment.getExternalStorageDirectory(), filePath);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(content.getBytes(StandardCharsets.UTF_8));
            return "Success: File written";
        } catch (IOException e) {
            return "Error: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String listExternalStorage() {
        File root = Environment.getExternalStorageDirectory();
        File[] files = root.listFiles();
        if (files == null) {
            return "[]";
        }
        List<String> fileNames = Arrays.stream(files)
                                       .map(File::getName)
                                       .collect(Collectors.toList());
        return fileNames.toString();
    }
}
