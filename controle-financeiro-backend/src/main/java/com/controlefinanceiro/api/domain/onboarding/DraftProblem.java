package com.controlefinanceiro.api.domain.onboarding;

import java.util.List;

/** Deliberately contains no submitted values or underlying parser/database messages. */
public final class DraftProblem extends RuntimeException {
    public record FieldError(String path, String code, String message) {}
    private final int status;
    private final String code;
    private final List<FieldError> fields;
    public DraftProblem(int status, String code) {
        this(status, code, List.of());
    }
    public DraftProblem(int status, String code, List<FieldError> fields) {
        super("Revise os dados e o estado da entrevista.");
        this.status = status; this.code = code; this.fields = List.copyOf(fields);
    }
    public int status() { return status; }
    public String code() { return code; }
    public List<FieldError> fields() { return fields; }
    public static DraftProblem invalid(String path, String code) {
        return new DraftProblem(400, "INVALID_FIELD", List.of(issue(path, code)));
    }
    public static FieldError issue(String path, String code) {
        return new FieldError(path, code, "Revise este campo.");
    }
}
