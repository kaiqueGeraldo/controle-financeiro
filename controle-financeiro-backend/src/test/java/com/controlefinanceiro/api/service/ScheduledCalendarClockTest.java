package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.card.CardTransactionRepository;
import com.controlefinanceiro.api.domain.card.CreditCard;
import com.controlefinanceiro.api.domain.card.CreditCardRepository;
import com.controlefinanceiro.api.domain.card.Invoice;
import com.controlefinanceiro.api.domain.card.InvoiceRepository;
import com.controlefinanceiro.api.domain.card.InvoiceStatus;
import com.controlefinanceiro.api.domain.habit.Habit;
import com.controlefinanceiro.api.domain.habit.HabitLogRepository;
import com.controlefinanceiro.api.domain.habit.HabitRepository;
import com.controlefinanceiro.api.domain.planning.PlanItemRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.infra.mail.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScheduledCalendarClockTest {

    private static final ZoneId PRODUCT_ZONE = ZoneId.of("America/Sao_Paulo");

    @Test
    void invoiceClosingChangesDayAtSaoPauloMidnightEvenWithJvmUtc() {
        InvoiceRepository invoiceRepository = mock(InvoiceRepository.class);
        CardTransactionRepository transactionRepository = mock(CardTransactionRepository.class);
        EmailService emailService = mock(EmailService.class);
        TransactionTemplate transactionTemplate = executingTransactionTemplate();
        InvoiceCronService service = new InvoiceCronService();
        Invoice invoice = invoice(2026, 9, 8, 20);
        invoice.setClosingDate(LocalDate.of(2026, 9, 8));
        invoice.setDueDate(LocalDate.of(2026, 9, 20));

        when(invoiceRepository.findByStatusWithCardAndUser(InvoiceStatus.OPEN)).thenReturn(List.of(invoice));
        when(transactionRepository.findByInvoiceIdWithDetails(invoice.getId())).thenReturn(List.of());
        injectInvoiceDependencies(service, invoiceRepository, transactionRepository, emailService, transactionTemplate, invoice);

        ReflectionTestUtils.setField(service, "clock", Clock.fixed(
                Instant.parse("2026-09-08T02:59:59Z"), PRODUCT_ZONE));
        service.processInvoiceClosing();
        verify(invoiceRepository, never()).save(invoice);

        clearInvocations(invoiceRepository, transactionRepository, emailService, transactionTemplate);
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(
                Instant.parse("2026-09-08T03:00:00Z"), PRODUCT_ZONE));
        service.processInvoiceClosing();

        verify(invoiceRepository).save(invoice);
    }

    @Test
    void invoiceClosingClampsNominalDayToLeapFebruary() {
        InvoiceRepository invoiceRepository = mock(InvoiceRepository.class);
        CardTransactionRepository transactionRepository = mock(CardTransactionRepository.class);
        EmailService emailService = mock(EmailService.class);
        TransactionTemplate transactionTemplate = executingTransactionTemplate();
        InvoiceCronService service = new InvoiceCronService();
        Invoice invoice = invoice(2024, 2, 31, 10);
        invoice.setClosingDate(LocalDate.of(2024, 2, 29));
        invoice.setDueDate(LocalDate.of(2024, 3, 10));

        when(invoiceRepository.findByStatusWithCardAndUser(InvoiceStatus.OPEN)).thenReturn(List.of(invoice));
        when(transactionRepository.findByInvoiceIdWithDetails(invoice.getId())).thenReturn(List.of());
        injectInvoiceDependencies(service, invoiceRepository, transactionRepository, emailService, transactionTemplate, invoice);
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(
                Instant.parse("2024-02-29T15:00:00Z"), PRODUCT_ZONE));

        service.processInvoiceClosing();

        verify(invoiceRepository).save(invoice);
    }

    @Test
    void decemberInvoiceClosesInDecemberAndIsDueInJanuary() {
        InvoiceRepository invoiceRepository = mock(InvoiceRepository.class);
        CardTransactionRepository transactionRepository = mock(CardTransactionRepository.class);
        EmailService emailService = mock(EmailService.class);
        TransactionTemplate transactionTemplate = executingTransactionTemplate();
        InvoiceCronService service = new InvoiceCronService();
        Invoice invoice = invoice(2025, 12, 31, 10);
        invoice.setClosingDate(LocalDate.of(2025, 12, 31));
        invoice.setDueDate(LocalDate.of(2026, 1, 10));

        when(invoiceRepository.findByStatusWithCardAndUser(InvoiceStatus.OPEN)).thenReturn(List.of(invoice));
        when(transactionRepository.findByInvoiceIdWithDetails(invoice.getId())).thenReturn(List.of());
        injectInvoiceDependencies(service, invoiceRepository, transactionRepository, emailService, transactionTemplate, invoice);
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(
                Instant.parse("2025-12-31T15:00:00Z"), PRODUCT_ZONE));

        service.processInvoiceClosing();

        verify(invoiceRepository).save(invoice);
    }

    @Test
    void habitCronDerivesPreviousDaysFromProductCalendar() {
        HabitRepository habitRepository = mock(HabitRepository.class);
        HabitLogRepository habitLogRepository = mock(HabitLogRepository.class);
        TransactionTemplate transactionTemplate = mock(TransactionTemplate.class);
        HabitCronService service = new HabitCronService();
        Habit habit = new Habit();
        habit.setId(UUID.fromString("40000000-0000-0000-0000-000000000001"));

        when(habitRepository.findAll(PageRequest.of(0, 500)))
                .thenReturn(new PageImpl<>(List.of(habit), PageRequest.of(0, 500), 1));
        when(habitLogRepository.findLogsForHabitsInDates(any(), any(), any())).thenReturn(List.of());
        ReflectionTestUtils.setField(service, "habitRepository", habitRepository);
        ReflectionTestUtils.setField(service, "habitLogRepository", habitLogRepository);
        ReflectionTestUtils.setField(service, "transactionTemplate", transactionTemplate);
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(
                Instant.parse("2026-09-08T02:59:59Z"), PRODUCT_ZONE));

        service.processDailyHabits();

        verify(habitLogRepository).findLogsForHabitsInDates(
                List.of(habit.getId()),
                LocalDate.of(2026, 9, 6),
                LocalDate.of(2026, 9, 5)
        );
    }

    @Test
    void notificationCronQueriesTomorrowInProductCalendar() {
        UserRepository userRepository = mock(UserRepository.class);
        PlanItemRepository planItemRepository = mock(PlanItemRepository.class);
        NotificationCronService service = new NotificationCronService();
        User user = new User();
        user.setId(UUID.fromString("40000000-0000-0000-0000-000000000002"));

        when(userRepository.findByNotifContasTrue()).thenReturn(List.of(user));
        when(planItemRepository.findPendingByUserIdAndDate(any(), any())).thenReturn(List.of());
        ReflectionTestUtils.setField(service, "userRepository", userRepository);
        ReflectionTestUtils.setField(service, "planItemRepository", planItemRepository);
        ReflectionTestUtils.setField(service, "transactionRepository", mock(TransactionRepository.class));
        ReflectionTestUtils.setField(service, "emailService", mock(EmailService.class));
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(
                Instant.parse("2026-09-08T02:59:59Z"), PRODUCT_ZONE));

        service.notifyUpcomingBills();

        verify(planItemRepository).findPendingByUserIdAndDate(
                user.getId(), LocalDate.of(2026, 9, 8));
    }

    @SuppressWarnings("unchecked")
    private static TransactionTemplate executingTransactionTemplate() {
        TransactionTemplate template = mock(TransactionTemplate.class);
        when(template.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<Object> callback = invocation.getArgument(0);
            return callback.doInTransaction(mock(TransactionStatus.class));
        });
        return template;
    }

    private static void injectInvoiceDependencies(
            InvoiceCronService service,
            InvoiceRepository invoiceRepository,
            CardTransactionRepository transactionRepository,
            EmailService emailService,
            TransactionTemplate transactionTemplate, Invoice invoice) {
        ReflectionTestUtils.setField(service, "invoiceRepository", invoiceRepository);
        CreditCardRepository cardRepository = mock(CreditCardRepository.class);
        ReflectionTestUtils.setField(service, "cardRepository", cardRepository);
        when(cardRepository.findByIdForUpdate(invoice.getCard().getId())).thenReturn(Optional.of(invoice.getCard()));
        when(invoiceRepository.findByIdForUpdate(invoice.getId())).thenReturn(Optional.of(invoice));
        ReflectionTestUtils.setField(service, "transactionRepository", transactionRepository);
        ReflectionTestUtils.setField(service, "emailService", emailService);
        ReflectionTestUtils.setField(service, "transactionTemplate", transactionTemplate);
    }

    private static Invoice invoice(int year, int month, int closingDay, int dueDay) {
        User user = new User();
        user.setNome("Usuário sintético");
        user.setEmail("cron@example.test");

        CreditCard card = new CreditCard();
        card.setId(UUID.randomUUID());
        card.setName("Cartão sintético");
        card.setClosingDay(closingDay);
        card.setDueDay(dueDay);
        card.setUser(user);

        Invoice invoice = new Invoice();
        invoice.setId(UUID.randomUUID());
        invoice.setYear(year);
        invoice.setMonth(month);
        invoice.setStatus(InvoiceStatus.OPEN);
        invoice.setCard(card);
        return invoice;
    }
}
