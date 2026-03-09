package com.controlefinanceiro.api.domain.category;

import com.controlefinanceiro.api.domain.transaction.TransactionType;
import lombok.Getter;

@Getter
public enum DefaultCategory {
    // Receitas
    SALARIO("Salário", "Banknote", "#10b981", TransactionType.INCOME, false),
    EXTRAS("Extras", "PlusCircle", "#6ee7b7", TransactionType.INCOME, false),

    // Despesas
    ALIMENTACAO("Alimentação", "Utensils", "#f43f5e", TransactionType.EXPENSE, false),
    MORADIA("Moradia", "Home", "#3b82f6", TransactionType.EXPENSE, false),
    TRANSPORTE("Transporte", "Car", "#eab308", TransactionType.EXPENSE, false),
    LAZER("Lazer", "Gamepad2", "#8b5cf6", TransactionType.EXPENSE, false),
    SAUDE("Saúde", "HeartPulse", "#ef4444", TransactionType.EXPENSE, false),
    EDUCACAO("Educação", "GraduationCap", "#06b6d4", TransactionType.EXPENSE, false),
    ASSINATURAS("Assinaturas", "CreditCard", "#6366f1", TransactionType.EXPENSE, false),

    // --- CATEGORIAS PROTEGIDAS PELO SISTEMA ---
    AJUSTE_SALDO("Ajuste de Saldo", "Settings", "#64748b", TransactionType.INCOME, true),
    RESGATE_INVESTIMENTO("Resgate/Proventos", "TrendingUp", "#34d399", TransactionType.INCOME, true),
    APORTE_INVESTIMENTO("Aporte de Invest.", "Landmark", "#059669", TransactionType.EXPENSE, true),
    PAGAMENTO_FATURA("Pagamento de Fatura", "CreditCard", "#1d4ed8", TransactionType.EXPENSE, true),
    METAS("Metas e Objetivos", "Target", "#f59e0b", TransactionType.EXPENSE, true);

    private final String name;
    private final String icon;
    private final String color;
    private final TransactionType type;
    private final boolean isSystemReserved;

    DefaultCategory(String name, String icon, String color, TransactionType type, boolean isSystemReserved) {
        this.name = name;
        this.icon = icon;
        this.color = color;
        this.type = type;
        this.isSystemReserved = isSystemReserved;
    }
}