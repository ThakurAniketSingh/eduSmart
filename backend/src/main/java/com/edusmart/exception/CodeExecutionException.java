package com.edusmart.exception;

/** Thrown for unrecoverable execution-environment problems (e.g. Docker missing). */
public class CodeExecutionException extends RuntimeException {
    public CodeExecutionException(String message) {
        super(message);
    }
    public CodeExecutionException(String message, Throwable cause) {
        super(message, cause);
    }
}
