package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.onboarding.DraftProblem;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes=OnboardingController.class)
public class OnboardingErrors {
    public record ErrorBody(String code,String message,List<DraftProblem.FieldError> fieldErrors) {}
    public record ErrorResponse(ErrorBody error) {}
    @ExceptionHandler(DraftProblem.class)
    public ResponseEntity<ErrorResponse> problem(DraftProblem e) {
        return ResponseEntity.status(e.status()).body(new ErrorResponse(new ErrorBody(e.code(),e.getMessage(),e.fields())));
    }
    @ExceptionHandler({PessimisticLockingFailureException.class,jakarta.persistence.LockTimeoutException.class,jakarta.persistence.PessimisticLockException.class})
    public ResponseEntity<ErrorResponse> lock(Exception ignored) {return problem(new DraftProblem(409,"LOCK_CONFLICT"));}
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> unexpected(Exception ignored) {return problem(new DraftProblem(500,"INTERNAL_ERROR"));}
}
