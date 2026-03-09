package com.controlefinanceiro.api.utils;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;

public class DateUtil {
    public static LocalTime getTimeOrDefault(String timeString) {
        if (timeString != null && !timeString.isBlank()) {
            try {
                return LocalTime.parse(timeString);
            } catch (DateTimeParseException e) {
                return LocalTime.now();
            }
        }
        return LocalTime.now();
    }
}