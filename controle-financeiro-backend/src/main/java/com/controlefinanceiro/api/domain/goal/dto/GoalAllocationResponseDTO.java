package com.controlefinanceiro.api.domain.goal.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record GoalAllocationResponseDTO(UUID id, UUID accountId, UUID investmentId,
                                        BigDecimal amount, BigDecimal sourceValue,
                                        BigDecimal sourceTotalAllocated, BigDecimal sourceFree,
                                        BigDecimal sourceDeficit) {}
