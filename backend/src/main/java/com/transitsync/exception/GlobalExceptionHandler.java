package com.transitsync.exception;

import com.transitsync.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex, HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.builder()
                .status(ex.getStatus().value())
                .error(ex.getStatus().getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(body, ex.getStatus());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
        }
        ErrorResponse body = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message("Request validation failed on one or more fields")
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .validationErrors(errors)
                .build();
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .error("Forbidden")
                .message("Access denied: You do not have permission to perform this action.")
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Unauthorized")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.builder()
                .status(HttpStatus.CONFLICT.value())
                .error("Conflict")
                .message("Data constraint violation. A duplicate key or referenced record conflict occurred.")
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message(ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred. Please try again later.")
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
