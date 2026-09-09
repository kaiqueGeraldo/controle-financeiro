package com.controlefinanceiro.api.domain;

import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;
import com.controlefinanceiro.api.utils.TemporalConfig;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.TimeZone;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@JsonTest
@Import({TemporalConfig.class, TemporalJsonContractTest.CacheTestConfiguration.class})
class TemporalJsonContractTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @Autowired
    private JsonMapper objectMapper;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        validatorFactory.close();
    }

    @Test
    void civilDateAndProvidedWallTimeRoundTripWithoutZoneConversion() throws Exception {
        CreateTransactionDTO input = validRequest(LocalDate.of(2026, 9, 7), "23:30:45");
        TimeZone original = TimeZone.getDefault();

        try {
            for (String zone : new String[]{"America/Sao_Paulo", "UTC", "Pacific/Kiritimati"}) {
                TimeZone.setDefault(TimeZone.getTimeZone(zone));
                String json = objectMapper.writeValueAsString(input);
                CreateTransactionDTO restored = objectMapper.readValue(json, CreateTransactionDTO.class);

                assertThat(json).contains("\"date\":\"2026-09-07\"");
                assertThat(json).contains("\"time\":\"23:30:45\"");
                assertThat(restored.date()).isEqualTo(LocalDate.of(2026, 9, 7));
                assertThat(restored.time()).isEqualTo("23:30:45");
            }
        } finally {
            TimeZone.setDefault(original);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "2026-02-29", "2026-02-31", "2026-04-31", "07/09/2026",
            "2026-9-7", "0000-01-01", "2026-09-07T23:30:00"
    })
    void rejectsInvalidCivilDatesInsteadOfNormalizingThem(String invalidDate) {
        String json = "{\"date\":\"" + invalidDate + "\"}";

        assertThatThrownBy(() -> objectMapper.readValue(json, CreateTransactionDTO.class))
                .isInstanceOf(JacksonException.class);
    }

    @Test
    void acceptsGregorianLeapDays() throws Exception {
        for (String validLeapDay : new String[]{"2000-02-29", "2024-02-29"}) {
            CreateTransactionDTO restored = objectMapper.readValue(
                    "{\"date\":\"" + validLeapDay + "\"}",
                    CreateTransactionDTO.class
            );

            assertThat(restored.date()).isEqualTo(LocalDate.parse(validLeapDay));
        }
    }

    @Test
    void missingRequiredCivilDateRemainsAbsentForBeanValidation() throws Exception {
        CreateTransactionDTO restored = objectMapper.readValue(
                objectMapper.writeValueAsString(validRequest(null, null)),
                CreateTransactionDTO.class
        );

        Set<ConstraintViolation<CreateTransactionDTO>> violations = validator.validate(restored);
        assertThat(restored.date()).isNull();
        assertThat(restored.time()).isNull();
        assertThat(violations).anyMatch(violation -> violation.getPropertyPath().toString().equals("date"));
        assertThat(violations).noneMatch(violation -> violation.getPropertyPath().toString().equals("time"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "24:00", "12:60", "9:05", "09:05:00.123", "09:05Z", "2026-09-07T09:05:00"})
    void rejectsInvalidWallTimesDuringRealDtoValidation(String invalidTime) {
        CreateTransactionDTO request = validRequest(LocalDate.of(2026, 9, 7), invalidTime);

        assertThat(validator.validate(request))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("time")
                        && violation.getMessage().equals("Horário inválido. Use HH:mm ou HH:mm:ss."));
    }

    private static CreateTransactionDTO validRequest(LocalDate date, String time) {
        return new CreateTransactionDTO(
                "Receita sintética",
                new BigDecimal("10.00"),
                date,
                time,
                TransactionType.INCOME,
                UUID.fromString("10000000-0000-0000-0000-000000000001"),
                null,
                false
        );
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class CacheTestConfiguration {

        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager();
        }
    }
}
