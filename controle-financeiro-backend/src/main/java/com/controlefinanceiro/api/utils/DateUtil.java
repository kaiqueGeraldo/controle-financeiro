package com.controlefinanceiro.api.utils;

import com.controlefinanceiro.api.service.exception.BusinessRuleException;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Objects;
import java.util.regex.Pattern;

public final class DateUtil {

    private static final Pattern WALL_TIME_PATTERN = Pattern.compile("\\d{2}:\\d{2}(?::\\d{2})?");
    private static final String INVALID_TIME_MESSAGE = "Horário inválido. Use HH:mm ou HH:mm:ss.";

    private DateUtil() {
    }

    public static LocalTime getTimeOrDefault(String timeString, LocalTime defaultTime) {
        if (timeString == null) {
            return Objects.requireNonNull(defaultTime, "defaultTime");
        }

        return parseWallTime(timeString);
    }

    public static LocalTime parseWallTime(String timeString) {
        if (timeString == null || !WALL_TIME_PATTERN.matcher(timeString).matches()) {
            throw new BusinessRuleException(INVALID_TIME_MESSAGE);
        }

        try {
            return LocalTime.parse(timeString);
        } catch (DateTimeParseException exception) {
            throw new BusinessRuleException(INVALID_TIME_MESSAGE);
        }
    }

    public static boolean isValidWallTime(String timeString) {
        if (timeString == null) {
            return true;
        }

        try {
            parseWallTime(timeString);
            return true;
        } catch (BusinessRuleException exception) {
            return false;
        }
    }
}
