package com.controlefinanceiro.api.domain.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

@Component
public class FutureInProductZoneValidator implements ConstraintValidator<FutureInProductZone, LocalDate> {

    private final Clock clock;

    public FutureInProductZoneValidator(Clock clock) {
        this.clock = clock;
    }

    @Override
    public boolean isValid(LocalDate value, ConstraintValidatorContext context) {
        return value == null || value.isAfter(LocalDate.now(clock));
    }
}
