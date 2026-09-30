package com.controlefinanceiro.api.domain.account.dto;
import java.time.LocalDate;
import java.util.List;
/** Current financial position includes archived accounts; it is not a source picker. */
public record AccountPositionDTO(LocalDate asOfDate,String totalBalance,String checkingBalance,
    String archivedBalance,boolean outsideSupportedRange,List<AccountResponseDTO> accounts) {}
