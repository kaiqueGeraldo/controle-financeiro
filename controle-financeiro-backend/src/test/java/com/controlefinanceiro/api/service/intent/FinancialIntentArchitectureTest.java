package com.controlefinanceiro.api.service.intent;

import org.junit.jupiter.api.Test;

import java.io.DataInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Checks compiled references (including descriptors/generics), without another test dependency. */
class FinancialIntentArchitectureTest {
    private static final String ROOT = "com/controlefinanceiro/api/";

    @Test void onlyIntentInternalsMayReferenceReceiptPersistenceOrConcreteAdapter() throws IOException {
        Path classes = Path.of("target/classes", ROOT);
        List<String> violations = new ArrayList<>();
        try (var files = Files.walk(classes)) {
            for (Path file : files.filter(p -> p.toString().endsWith(".class")).toList()) {
                String relative = classes.relativize(file).toString().replace('\\', '/');
                if (relative.startsWith("service/intent/internal/") || relative.startsWith("domain/intent/internal/")) continue;
                for (String symbol : utf8Constants(file)) {
                    if (symbol.contains(ROOT + "service/intent/internal/")
                            || symbol.contains(ROOT + "domain/intent/internal/")
                            || symbol.contains(ROOT + "service/FinancialIntentService")
                            || symbol.contains(ROOT + "domain/transaction/FinancialIntentReceipt")) {
                        violations.add(relative + " -> " + symbol);
                    }
                    if ((relative.equals("service/TransactionService.class")
                            || relative.equals("service/InvestmentService.class")
                            || relative.equals("controller/FinancialIntentController.class"))
                            && (symbol.contains("financial_intent_receipts") || symbol.contains("financial-intent:"))) {
                        violations.add(relative + " -> protocol SQL/lock " + symbol);
                    }
                }
            }
        }
        assertThat(violations).as("consumers must use the application port, never receipt persistence/adapter").isEmpty();
    }

    @Test void publicIntentContractAndCanonicalizationDoNotDependOnFinancialEntitiesOrInfrastructure() throws IOException {
        Path classes = Path.of("target/classes", ROOT, "service/intent");
        List<String> violations = new ArrayList<>();
        try (var files = Files.list(classes)) {
            for (Path file : files.filter(p -> p.toString().endsWith(".class")).toList()) {
                for (String symbol : utf8Constants(file)) {
                    if (symbol.contains("jakarta/persistence/") || symbol.contains("org/springframework/")
                            || symbol.contains(ROOT + "domain/transaction/") || symbol.contains(ROOT + "domain/investment/")
                            || symbol.contains(ROOT + "domain/user/") || symbol.contains("tools/jackson/")
                            || symbol.contains("pg_advisory") || symbol.contains("financial_intent_receipts")) {
                        violations.add(file.getFileName() + " -> " + symbol);
                    }
                }
            }
        }
        assertThat(violations).as("application contract/canonicalization must not own ORM, JSON, locks or financial entities").isEmpty();
    }

    // JVM constant-pool tags; UTF8 entries include field/method descriptors, signatures and instruction owners.
    private static List<String> utf8Constants(Path file) throws IOException {
        List<String> symbols = new ArrayList<>();
        try (var input = new DataInputStream(Files.newInputStream(file))) {
            assertThat(input.readInt()).isEqualTo(0xCAFEBABE);
            input.skipNBytes(4); // minor/major version
            int count = input.readUnsignedShort();
            for (int index = 1; index < count; index++) {
                int tag = input.readUnsignedByte();
                switch (tag) {
                    case 1 -> symbols.add(input.readUTF());
                    case 3, 4, 9, 10, 11, 12, 17, 18 -> input.skipNBytes(4);
                    case 5, 6 -> { input.skipNBytes(8); index++; }
                    case 7, 8, 16, 19, 20 -> input.skipNBytes(2);
                    case 15 -> input.skipNBytes(3);
                    default -> throw new IOException("Unsupported constant-pool tag " + tag + " in " + file);
                }
            }
        }
        return symbols;
    }
}
