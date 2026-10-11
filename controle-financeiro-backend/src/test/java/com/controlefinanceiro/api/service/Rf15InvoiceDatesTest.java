package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

class Rf15InvoiceDatesTest extends PostgresIntegrationTest {
    @Autowired CreditCardService service;
    @Autowired UserRepository users;
    @Autowired CreditCardRepository cards;

    @ParameterizedTest
    @CsvSource({
        "2027,1,31,5,2027-01-31,2027-02-05",
        "2027,2,31,30,2027-02-28,2027-03-30",
        "2028,2,31,5,2028-02-29,2028-03-05",
        "2027,2,20,31,2027-02-20,2027-02-28",
        "2027,12,31,5,2027-12-31,2028-01-05"
    })
    void returnsPersistedCivilDatesWithoutRecalculatingFromChangedCard(int year,int month,int closingDay,int dueDay,String closing,String due) {
        User owner=new User();owner.setNome("RF15");owner.setEmail(UUID.randomUUID()+"@example.invalid");owner.setSenha("synthetic");owner=users.save(owner);
        CreditCard card=new CreditCard();card.setUser(owner);card.setName("RF15");card.setLimit(new BigDecimal("1000"));card.setClosingDay(closingDay);card.setDueDay(dueDay);card=cards.save(card);
        var first=service.getInvoiceDetails(card.getId(),month,year,owner);
        assertThat(first.closingDate()).isEqualTo(LocalDate.parse(closing));
        assertThat(first.dueDate()).isEqualTo(LocalDate.parse(due));
        card.setClosingDay(10);card.setDueDay(15);cards.save(card);
        var reread=service.getInvoiceDetails(card.getId(),month,year,owner);
        assertThat(reread.closingDate()).isEqualTo(LocalDate.parse(closing));
        assertThat(reread.dueDate()).isEqualTo(LocalDate.parse(due));
    }
}
