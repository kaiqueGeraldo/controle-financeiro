package com.controlefinanceiro.api.service.exception;

public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String msg) {
        super(msg);
    }
}