package com.controlefinanceiro.api.infra.exception;

import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import tools.jackson.core.JacksonException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<StandardError> beanValidation(
            MethodArgumentNotValidException e,
            HttpServletRequest request) {
        Map<String, List<String>> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(fieldError -> fields
                .computeIfAbsent(fieldError.getField(), ignored -> new ArrayList<>())
                .add(fieldError.getDefaultMessage() == null
                        ? "Valor inválido."
                        : fieldError.getDefaultMessage()));

        return badRequest(
                "A requisição possui campos inválidos.",
                request,
                fields
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<StandardError> unreadableRequest(
            HttpMessageNotReadableException e,
            HttpServletRequest request) {
        String field = jacksonField(e);
        return badRequest(
                "O corpo da requisição contém valor ausente, malformado ou inválido.",
                request,
                Map.of(field, List.of("Valor malformado ou incompatível com o campo."))
        );
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<StandardError> missingParameter(
            MissingServletRequestParameterException e,
            HttpServletRequest request) {
        return badRequest(
                "A requisição possui parâmetros inválidos.",
                request,
                Map.of(e.getParameterName(), List.of("Parâmetro obrigatório ausente."))
        );
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<StandardError> methodValidation(
            HandlerMethodValidationException e, HttpServletRequest request) {
        if (e.isForReturnValue()) return globalException(e, request);
        Map<String, List<String>> fields = new LinkedHashMap<>();
        e.getParameterValidationResults().forEach(result -> {
            String name = result.getMethodParameter().getParameterName();
            List<String> messages = fields.computeIfAbsent(name == null ? "_request" : name, ignored -> new ArrayList<>());
            result.getResolvableErrors().forEach(error -> messages.add(
                    error.getDefaultMessage() == null ? "Valor inválido." : error.getDefaultMessage()));
        });
        return badRequest("A requisição possui parâmetros inválidos.", request, fields);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<StandardError> invalidParameterType(
            MethodArgumentTypeMismatchException e,
            HttpServletRequest request) {
        return badRequest(
                "A requisição possui parâmetros inválidos.",
                request,
                Map.of(e.getName(), List.of("Valor incompatível com o tipo esperado."))
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<StandardError> constraintViolation(
            ConstraintViolationException e,
            HttpServletRequest request) {
        Map<String, List<String>> fields = new LinkedHashMap<>();
        e.getConstraintViolations().forEach(violation -> fields
                .computeIfAbsent(violation.getPropertyPath().toString(), ignored -> new ArrayList<>())
                .add(violation.getMessage()));
        return badRequest("A requisição possui campos inválidos.", request, fields);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<StandardError> unauthenticated(
            AuthenticationException e,
            HttpServletRequest request) {
        HttpStatus status = HttpStatus.UNAUTHORIZED;
        StandardError error = new StandardError(
                Instant.now(),
                status.value(),
                "Autenticação necessária",
                "Autenticação necessária para acessar este recurso.",
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<StandardError> forbidden(
            AccessDeniedException e,
            HttpServletRequest request) {
        HttpStatus status = HttpStatus.FORBIDDEN;
        StandardError error = new StandardError(
                Instant.now(),
                status.value(),
                "Operação proibida",
                "Operação não permitida.",
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(error);
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

    private ResponseEntity<StandardError> badRequest(
            String message,
            HttpServletRequest request,
            Map<String, List<String>> fields) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        log.warn("API ERROR 400: Requisição inválida [URI: {}; campos: {}]",
                request.getRequestURI(), fields.keySet());
        StandardError error = new StandardError(
                Instant.now(),
                status.value(),
                "Requisição inválida",
                message,
                request.getRequestURI(),
                fields
        );
        return ResponseEntity.status(status).body(error);
    }

    private String jacksonField(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof JacksonException jacksonException) {
                return jacksonException.getPath().stream()
                        .map(JacksonException.Reference::getPropertyName)
                        .filter(name -> name != null && !name.isBlank())
                        .findFirst()
                        .orElse("_request");
            }
            current = current.getCause();
        }
        return "_request";
    }
}
