package com.controlefinanceiro.api.domain.intent;

import tools.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record FinancialIntentReceiptDTO(UUID operationId, String kind, Instant recordedAt, JsonNode result) {}
