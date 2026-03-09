package com.controlefinanceiro.api.domain.investment.dto;

import java.math.BigDecimal;
import java.util.List;

public record BrapiResponseDTO(List<StockDTO> results) {
    public record StockDTO(
            String symbol,
            BigDecimal regularMarketPrice
    ) {}
}