package com.edusmart.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

@Service
public class CodeExecutionService {

    private static final Logger log = LoggerFactory.getLogger(CodeExecutionService.class);

    private final Map<String, Process> activeProcesses = new ConcurrentHashMap<>();
    private final Map<String, OutputStream> activeOutputStreams = new ConcurrentHashMap<>();
    private final Map<String, Path> activeWorkspaces = new ConcurrentHashMap<>();

    private record LangConfig(String image, String script) {}

    private LangConfig getLangConfig(String fileName) {
        String ext = getExtension(fileName);
        return switch (ext) {
            case "java" -> new LangConfig("eclipse-temurin:21-jdk", "javac " + fileName + " 2> compile_errors.txt; if [ $? -ne 0 ]; then cat compile_errors.txt 1>&2; exit 66; fi; java " + fileName.replace(".java", ""));
            case "py" -> new LangConfig("python:3.11-slim", "python -u " + fileName);
            case "js" -> new LangConfig("node:20-slim", "node " + fileName);
            case "c" -> new LangConfig("gcc:13", "gcc " + fileName + " -o out 2> compile_errors.txt; if [ $? -ne 0 ]; then cat compile_errors.txt 1>&2; exit 66; fi; ./out");
            case "cpp" -> new LangConfig("gcc:13", "g++ " + fileName + " -o out 2> compile_errors.txt; if [ $? -ne 0 ]; then cat compile_errors.txt 1>&2; exit 66; fi; ./out");
            case "php" -> new LangConfig("php:8.2-cli", "php " + fileName);
            default -> new LangConfig("eclipse-temurin:21-jdk", "echo 'Unsupported language'");
        };
    }

    private String getExtension(String fileName) {
        int i = fileName.lastIndexOf('.');
        return i > 0 ? fileName.substring(i + 1).toLowerCase() : "";
    }

    public void startInteractiveRun(String sessionId, String fileName, String sourceCode, Consumer<String> onOutput, Consumer<Integer> onComplete) {
        stopRun(sessionId); // Stop any existing run for this session

        Path workspace = null;
        try {
            workspace = Files.createTempDirectory("edusmart-run-" + UUID.randomUUID());
            activeWorkspaces.put(sessionId, workspace);

            Path sourceFile = workspace.resolve(fileName);
            Files.writeString(sourceFile, sourceCode, StandardCharsets.UTF_8);

            LangConfig langConfig = getLangConfig(fileName);

            List<String> command = new ArrayList<>();
            command.add("docker");
            command.add("run");
            command.add("-i"); // Interactive mode!
            command.add("--rm");
            command.add("--network=none");
            command.add("--memory=128m");
            command.add("--cpus=0.5");
            command.add("--pids-limit=64");
            command.add("-v");
            command.add(workspace.toAbsolutePath() + ":/workspace");
            command.add("-w");
            command.add("/workspace");
            command.add(langConfig.image());
            command.add("bash");
            command.add("-c");
            command.add(langConfig.script());

            ProcessBuilder builder = new ProcessBuilder(command).redirectErrorStream(true);
            Process process = builder.start();

            activeProcesses.put(sessionId, process);
            activeOutputStreams.put(sessionId, process.getOutputStream());

            // Start output reading thread
            Path finalWorkspace = workspace;
            Thread readerThread = new Thread(() -> {
                try (InputStream is = process.getInputStream()) {
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = is.read(buffer)) != -1) {
                        onOutput.accept(new String(buffer, 0, len, StandardCharsets.UTF_8));
                    }
                } catch (IOException e) {
                    log.warn("Error reading process output: {}", e.getMessage());
                } finally {
                    try {
                        boolean finished = process.waitFor(300, TimeUnit.SECONDS); // Max 5 mins session
                        if (!finished) process.destroyForcibly();
                        onComplete.accept(process.exitValue());
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        onComplete.accept(-1);
                    }
                    cleanup(sessionId, finalWorkspace);
                }
            });
            readerThread.start();

        } catch (Exception ex) {
            log.error("Execution setup failed", ex);
            onOutput.accept("Error: " + ex.getMessage() + "\r\n");
            onComplete.accept(-1);
            if (workspace != null) cleanupWorkspace(workspace);
        }
    }

    public void sendInput(String sessionId, String input) {
        OutputStream os = activeOutputStreams.get(sessionId);
        if (os != null) {
            try {
                os.write(input.getBytes(StandardCharsets.UTF_8));
                os.flush();
            } catch (IOException e) {
                log.warn("Failed to write to process input for session {}: {}", sessionId, e.getMessage());
            }
        }
    }

    public void stopRun(String sessionId) {
        Process p = activeProcesses.remove(sessionId);
        if (p != null) p.destroyForcibly();
        OutputStream os = activeOutputStreams.remove(sessionId);
        if (os != null) {
            try { os.close(); } catch (IOException ignored) {}
        }
        Path ws = activeWorkspaces.remove(sessionId);
        if (ws != null) cleanupWorkspace(ws);
    }

    private void cleanup(String sessionId, Path workspace) {
        activeProcesses.remove(sessionId);
        activeOutputStreams.remove(sessionId);
        activeWorkspaces.remove(sessionId);
        cleanupWorkspace(workspace);
    }

    private void cleanupWorkspace(Path workspace) {
        if (workspace == null) return;
        try (var paths = Files.walk(workspace)) {
            paths.sorted((a, b) -> b.compareTo(a))
                 .forEach(path -> {
                     try { Files.deleteIfExists(path); } catch (IOException ignored) {}
                 });
        } catch (IOException ex) {
            log.warn("Failed to clean up execution workspace {}: {}", workspace, ex.getMessage());
        }
    }
}
