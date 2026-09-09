package com.controlefinanceiro.api;

import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mockingDetails;

class ControleFinanceiroApiApplicationTests extends PostgresIntegrationTest {

	@Test
	void contextLoads() {
		assertThat(mockingDetails(emailService).isMock()).isTrue();
		assertThat(mockingDetails(marketDataService).isMock()).isTrue();
	}

}
