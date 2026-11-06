package com.controlefinanceiro.api.infra.operations;

import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.MarketDataService;
import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okio.Buffer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.List;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class ProviderLoggingTest {
    private static final String QUOTE_URL = "https://brapi.dev/api/quote/";
    private static final String EMAIL_URL = "https://api.resend.com/emails";
    private static final String TOKEN = "synthetic-provider-token-sentinel";
    private static final String RECIPIENT = "private-sentinel@example.test";
    private static final String RESPONSE = "raw-provider-response-sentinel";
    private static final String TRANSPORT = "raw-transport-error-sentinel";

    @Test
    void brapiKeepsBearerOutsideTheEncodedUrlAndContinuesAfterFailedBatch() throws IOException {
        var tickers = Stream.concat(IntStream.rangeClosed(1, 15).mapToObj(i -> "TEST" + i),
                Stream.of("A/B?C#D")).toList();
        var repository = mock(InvestmentRepository.class);
        when(repository.findDistinctTickersByTypes(anyList())).thenReturn(tickers);
        var market = new MarketDataService();
        ReflectionTestUtils.setField(market, "investmentRepository", repository);
        ReflectionTestUtils.setField(market, "brapiToken", TOKEN);
        var client = mockClient(market);

        when(client.newCall(any(Request.class))).thenAnswer(invocation -> {
            Request request = invocation.getArgument(0);
            assertThat(request.header("Authorization")).isEqualTo("Bearer " + TOKEN);
            if (request.url().encodedPath().endsWith("TEST15")) {
                assertThat(request.url().toString()).isEqualTo(QUOTE_URL + String.join(",", tickers.subList(0, 15)));
                return callReturning(request, 429, RESPONSE);
            }
            assertThat(request.url().toString()).isEqualTo(QUOTE_URL + "A%2FB%3FC%23D");
            return callReturning(request, 200, """
                    {"results":[{"symbol":"PETR4","regularMarketPrice":12.34,"other":true}],"other":true}
                    """);
        });

        market.updateVariableIncomePrices();

        verify(repository).findAllByTicker("PETR4");
    }

    @Test
    void brapiLogsOnlyStatusAndFailureType(CapturedOutput output) throws IOException {
        var repository = mock(InvestmentRepository.class);
        when(repository.findDistinctTickersByTypes(anyList())).thenReturn(List.of("PETR4"));
        var market = new MarketDataService();
        ReflectionTestUtils.setField(market, "investmentRepository", repository);
        ReflectionTestUtils.setField(market, "brapiToken", TOKEN);
        var client = mockClient(market);
        var request = new Request.Builder().url(QUOTE_URL + "PETR4").build();
        var unauthorized = callReturning(request, 401, RESPONSE + TOKEN);
        var forbidden = callReturning(request, 403, RESPONSE + TOKEN);
        var limited = callReturning(request, 429, RESPONSE + TOKEN);
        var malformed = callReturning(request, 200, "{invalid-json: " + RESPONSE + TOKEN);
        var unavailable = failedCall();
        when(client.newCall(any(Request.class))).thenReturn(unauthorized, forbidden, limited, malformed, unavailable);

        for (int i = 0; i < 5; i++) market.updateVariableIncomePrices();

        assertThat(output.getAll()).contains("status=401", "status=403", "status=429", "IOException")
                .doesNotContain(TOKEN, RESPONSE, TRANSPORT, "?token=");
    }

    @Test
    void resendLogsOnlyStatusAndFailureTypeAndDoesNotParseTheResponse(CapturedOutput output) throws IOException {
        var email = new EmailService();
        ReflectionTestUtils.setField(email, "operations", new OperationsState(true, false));
        ReflectionTestUtils.setField(email, "apiKey", TOKEN);
        ReflectionTestUtils.setField(email, "fromEmail", "sender@example.test");
        var client = mockClient(email);
        var statuses = List.of(202, 307, 429).iterator();
        when(client.newCall(any(Request.class))).thenAnswer(invocation -> {
            Request request = invocation.getArgument(0);
            assertThat(request.url().toString()).isEqualTo(EMAIL_URL);
            assertThat(request.method()).isEqualTo("POST");
            assertThat(request.header("Authorization")).isEqualTo("Bearer " + TOKEN);
            var payload = new Buffer();
            request.body().writeTo(payload);
            assertThat(payload.readUtf8()).contains(RECIPIENT, "subject", "body", "sender@example.test");
            return statuses.hasNext()
                    ? callReturning(request, statuses.next(), "{invalid-json: " + RESPONSE + TOKEN + RECIPIENT)
                    : failedCall();
        });

        for (int i = 0; i < 4; i++) email.sendTemplatedEmail(RECIPIENT, "subject", "title", "body");

        assertThat(output.getAll()).contains("Envio aceito pelo Resend", "status=307", "status=429", "IOException")
                .doesNotContain(TOKEN, RECIPIENT, RESPONSE, TRANSPORT);
    }

    private static OkHttpClient mockClient(Object service) {
        var real = (OkHttpClient) ReflectionTestUtils.getField(service, "client");
        assertThat(real.followRedirects()).isFalse();
        assertThat(real.followSslRedirects()).isFalse();
        assertThat(real.interceptors()).isEmpty();
        assertThat(real.networkInterceptors()).isEmpty();
        var client = mock(OkHttpClient.class);
        ReflectionTestUtils.setField(service, "client", client);
        return client;
    }

    private static Call callReturning(Request request, int code, String content) throws IOException {
        var call = mock(Call.class);
        when(call.execute()).thenReturn(new Response.Builder()
                .request(request).protocol(Protocol.HTTP_1_1).code(code).message("synthetic")
                .body(ResponseBody.create(content, MediaType.get("application/json"))).build());
        return call;
    }

    private static Call failedCall() throws IOException {
        var call = mock(Call.class);
        when(call.execute()).thenThrow(new IOException(TRANSPORT + TOKEN));
        return call;
    }
}
