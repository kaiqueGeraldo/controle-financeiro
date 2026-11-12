package com.controlefinanceiro.api.infra.operations;

import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.sun.net.httpserver.HttpServer;
import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.MarketDataService;
import com.controlefinanceiro.api.service.MarketPriceWriter;
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
import java.math.BigDecimal;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
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
    void brapiRequestsEachNormalizedTickerOnceAndBoundsTheScheduledRun() throws IOException {
        var tickers = Stream.concat(IntStream.rangeClosed(1, 16).mapToObj(i -> "TEST%02d".formatted(i)),
                Stream.of(" test01 ", "A/B?C#D", ".", "..", "TEST01,TEST02")).toList();
        var repository = mock(InvestmentRepository.class);
        when(repository.findDistinctTickersByTypes(anyList())).thenReturn(tickers);
        var market = market(repository);
        var client = mockClient(market);
        var requested = new ArrayList<String>();

        when(client.newCall(any(Request.class))).thenAnswer(invocation -> {
            Request request = invocation.getArgument(0);
            assertThat(request.header("Authorization")).isEqualTo("Bearer " + TOKEN);
            assertThat(request.url().query()).isNull();
            String ticker = request.url().pathSegments().getLast();
            assertThat(request.url().toString()).isEqualTo(QUOTE_URL + ticker);
            requested.add(ticker);
            return callReturning(request, 404, RESPONSE);
        });

        market.updateVariableIncomePrices();

        assertThat(requested).containsExactlyElementsOf(
                IntStream.rangeClosed(1, 15).mapToObj(i -> "TEST%02d".formatted(i)).toList());
        requested.clear();

        market.updateVariableIncomePrices();

        assertThat(requested).hasSize(15).doesNotHaveDuplicates().startsWith("TEST16", "TEST01");
        verify(repository, never()).findQuotePositions(anyCollection(), anyList());
    }

    @Test
    void brapiWritesOnlyTheRequestedPositiveDatedQuoteAndStopsAfterQuota() throws IOException {
        var repository = mock(InvestmentRepository.class);
        when(repository.findDistinctTickersByTypes(anyList()))
                .thenReturn(List.of("ABEV3", "BBDC4", "ITUB4", "PETR4", "VALE3", "ZZZZ3"));
        var market = market(repository);
        var writer = mock(MarketPriceWriter.class);
        ReflectionTestUtils.setField(market, "priceWriter", writer);
        var position = mock(InvestmentRepository.QuotePosition.class);
        var owner = UUID.randomUUID();
        var investment = UUID.randomUUID();
        when(position.getOwnerId()).thenReturn(owner);
        when(position.getInvestmentId()).thenReturn(investment);
        when(position.getTicker()).thenReturn("ABEV3");
        when(repository.findQuotePositions(eq(Set.of("ABEV3")), anyList())).thenReturn(List.of(position));
        var client = mockClient(market);
        var requested = new ArrayList<String>();

        when(client.newCall(any(Request.class))).thenAnswer(invocation -> {
            Request request = invocation.getArgument(0);
            String ticker = request.url().pathSegments().getLast();
            requested.add(ticker);
            return switch (ticker) {
                case "ABEV3" -> callReturning(request, 200, quoteJson("ABEV3", "12.34"));
                case "BBDC4" -> callReturning(request, 200, quoteJson("BBDC4", "0"));
                case "ITUB4" -> callReturning(request, 200, quoteJson("UNEXPECTED", "12.34"));
                case "PETR4" -> callReturning(request, 200, "{\"results\":[]}");
                case "VALE3" -> callReturning(request, 429, RESPONSE);
                default -> throw new AssertionError("The quota response must stop the cycle");
            };
        });

        market.updateVariableIncomePrices();

        assertThat(requested).containsExactly("ABEV3", "BBDC4", "ITUB4", "PETR4", "VALE3");
        var order = inOrder(client, writer);
        order.verify(client, times(5)).newCall(any(Request.class));
        order.verify(writer).update(owner, investment, new BigDecimal("12.34"), LocalDate.of(2026, 11, 11));
        verifyNoMoreInteractions(writer);
    }

    @Test
    void brapiSkipsTransportForAnInvalidCredential() {
        var repository = mock(InvestmentRepository.class);
        var market = market(repository);
        ReflectionTestUtils.setField(market, "brapiToken", "bad\nvalue");
        var client = mockClient(market);

        market.updateVariableIncomePrices();

        verifyNoInteractions(repository, client);
    }

    private static MarketDataService market(InvestmentRepository repository) {
        var market = new MarketDataService();
        ReflectionTestUtils.setField(market, "investmentRepository", repository);
        ReflectionTestUtils.setField(market, "brapiToken", TOKEN);
        ReflectionTestUtils.setField(market, "clock",
                Clock.fixed(Instant.parse("2026-11-12T12:00:00Z"), ZoneId.of("America/Sao_Paulo")));
        return market;
    }

    private static String quoteJson(String symbol, String price) {
        return """
                {"results":[{"symbol":"%s","regularMarketPrice":%s,"regularMarketTime":"2026-11-12T01:00:00Z"}]}
                """.formatted(symbol, price);
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
            assertThat(request.header("Idempotency-Key")).isNotBlank();
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

    @Test
    void resendDoesNotContactTheProviderForAnUnapprovedRecipient() {
        var email = new EmailService();
        ReflectionTestUtils.setField(email, "operations", new OperationsState(true, false));
        ReflectionTestUtils.setField(email, "allowedRecipient", RECIPIENT);
        ReflectionTestUtils.setField(email, "apiKey", TOKEN);
        var client = mockClient(email);

        email.sendTemplatedEmail("another@example.test", "subject", "title", "body");

        verifyNoInteractions(client);
    }

    @Test
    void brapiTransportDoesNotRetryA503EvenWhenTheProviderAsksForImmediateRetry() throws IOException {
        var attempts = new AtomicInteger();
        var server = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        server.createContext("/api/quote/PETR4", exchange -> {
            int attempt = attempts.incrementAndGet();
            exchange.getResponseHeaders().set("Retry-After", "0");
            exchange.sendResponseHeaders(attempt == 1 ? 503 : 200, -1);
            exchange.close();
        });
        server.start();
        var client = (OkHttpClient) ReflectionTestUtils.getField(new MarketDataService(), "client");
        try {
            var url = new okhttp3.HttpUrl.Builder().scheme("http").host(server.getAddress().getAddress().getHostAddress())
                    .port(server.getAddress().getPort()).addPathSegments("api/quote/PETR4").build();
            try (var result = client.newCall(new Request.Builder().url(url).build()).execute()) {
                assertThat(result.code()).isEqualTo(503);
            }
            assertThat(attempts).hasValue(1);
        } finally {
            server.stop(0);
            client.connectionPool().evictAll();
        }
    }

    @Test
    void resendReservesOnlyOneDeliveryInHomologationAndRejectsUnconfiguredScope() throws IOException {
        var email = new EmailService();
        ReflectionTestUtils.setField(email, "operations", new OperationsState(true, false));
        ReflectionTestUtils.setField(email, "apiKey", TOKEN);
        ReflectionTestUtils.setField(email, "fromEmail", "sender@example.test");
        ReflectionTestUtils.setField(email, "singleDelivery", true);
        var client = mockClient(email);
        when(client.newCall(any(Request.class))).thenAnswer(invocation ->
                callReturning(invocation.getArgument(0), 200, "{}"));

        email.sendTemplatedEmail(RECIPIENT, "subject", "title", "body");
        verifyNoInteractions(client);
        ReflectionTestUtils.setField(email, "allowedRecipient", RECIPIENT);
        email.sendTemplatedEmail("another@example.test", "subject", "title", "body");
        email.sendTemplatedEmail(RECIPIENT, "subject", "title", "body");
        email.sendTemplatedEmail(RECIPIENT, "subject", "title", "body");

        verify(client, times(1)).newCall(any(Request.class));
    }

    private static OkHttpClient mockClient(Object service) {
        var real = (OkHttpClient) ReflectionTestUtils.getField(service, "client");
        assertThat(real.followRedirects()).isFalse();
        assertThat(real.followSslRedirects()).isFalse();
        assertThat(real.interceptors()).isEmpty();
        if (service instanceof MarketDataService) {
            assertThat(real.networkInterceptors()).hasSize(1);
        } else {
            assertThat(real.networkInterceptors()).isEmpty();
        }
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
