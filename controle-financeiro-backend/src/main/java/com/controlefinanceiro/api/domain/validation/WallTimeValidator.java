package com.controlefinanceiro.api.domain.validation;

import com.controlefinanceiro.api.utils.DateUtil;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class WallTimeValidator implements ConstraintValidator<WallTime, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return DateUtil.isValidWallTime(value);
    }
}
