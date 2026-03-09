package com.controlefinanceiro.api.infra.exception;

import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;

@Slf4j
@ControllerAdvice
public class ResourceExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<StandardError> entityNotFound(ResourceNotFoundException e, HttpServletRequest request) {
        HttpStatus status = HttpStatus.NOT_FOUND;
        log.warn("API ERROR 404: {} [URI: {}]", e.getMessage(), request.getRequestURI());

        StandardError err = new StandardError(Instant.now(), status.value(), "Recurso não encontrado", e.getMessage(), request.getRequestURI());
        return ResponseEntity.status(status).body(err);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<StandardError> businessRule(BusinessRuleException e, HttpServletRequest request) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        log.warn("API ERROR 400: Regra de Negócio - {} [URI: {}]", e.getMessage(), request.getRequestURI());

        StandardError err = new StandardError(Instant.now(), status.value(), "Regra de Negócio", e.getMessage(), request.getRequestURI());
        return ResponseEntity.status(status).body(err);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<StandardError> globalException(Exception e, HttpServletRequest request) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        log.error("API CRITICAL 500: Erro inesperado em {} ", request.getRequestURI(), e);

        StandardError err = new StandardError(Instant.now(), status.value(), "Erro Interno", "Ocorreu um erro inesperado no sistema. Contate o suporte.", request.getRequestURI());
        return ResponseEntity.status(status).body(err);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<StandardError> concurrencyFailure(ObjectOptimisticLockingFailureException e, HttpServletRequest request) {
        HttpStatus status = HttpStatus.CONFLICT; // 409
        log.warn("API ERROR 409: Conflito de concorrência (Optimistic Lock) [URI: {}]", request.getRequestURI());

        StandardError err = new StandardError(
                Instant.now(),
                status.value(),
                "Conflito de Atualização",
                "O saldo desta conta foi atualizado por outra operação simultânea. A operação atual foi cancelada por segurança. Atualize a página e tente novamente.",
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(err);
    }
}