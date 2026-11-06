package com.controlefinanceiro.api.infra.operations;

import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.MarketDataService;
import com.sun.net.httpserver.HttpServer;
import okhttp3.OkHttpClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class ProviderIndependentReviewTest {
    private static final String TOKEN = "review-token-sentinel";
    private static final String ADDRESS = "review-recipient@example.invalid";
    private static final String HTML = "review-html-sentinel";
    private static final String RAW = "review-provider-body-sentinel";
    private static final String EXCEPTION = "review-exception-cause-sentinel";
    private final ConcurrentLinkedQueue<Observed> requests = new ConcurrentLinkedQueue<>();
    private final AtomicInteger count = new AtomicInteger();
    private HttpServer server;
    private int port;

    @BeforeEach
    void startLoopback() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        port = server.getAddress().getPort();
        server.start();
    }

    @AfterEach
    void stopLoopback() {
        if (server != null) server.stop(0);
    }

    @Test
    void quoteUsesBearerOnTheWireAndHandlesFailureCategories(CapturedOutput output) throws Exception {
        respond(200, """
                {"results":[{"symbol":"TEST11","regularMarketPrice":12.34,"extra":"ignored"}]}
                """);
        var repository = mock(InvestmentRepository.class);
        when(repository.findDistinctTickersByTypes(anyList())).thenReturn(List.of("TEST11", "TEST12"));
        var market = market(repository, TOKEN);
        market.updateVariableIncomePrices();
        assertThat(requests.remove()).isEqualTo(new Observed(
                "GET", "/api/quote/TEST11,TEST12", "Bearer " + TOKEN, "", null));
        verify(repository).findAllByTicker("TEST11");

        respond(401, RAW + TOKEN);
        assertThatCode(market::updateVariableIncomePrices).doesNotThrowAnyException();
        respond(200, "{invalid-json:" + RAW + TOKEN);
        assertThatCode(market::updateVariableIncomePrices).doesNotThrowAnyException();
        respond(200, RAW, 2500);
        assertThatCode(market::updateVariableIncomePrices).doesNotThrowAnyException();

        transportException(market);
        assertThatCode(market::updateVariableIncomePrices).doesNotThrowAnyException();
        assertThat(output.getAll()).contains("status=401", "SocketTimeoutException", "IOException")
                .containsPattern("tipo=(StreamReadException|JsonParseException)")
                .doesNotContain(TOKEN, RAW, EXCEPTION, "?token=");
    }

    @Test
    void emailDoesNotPropagateOrLogProviderData(CapturedOutput output) throws Exception {
        respond(201, RAW + TOKEN);
        var email = email(TOKEN);
        send(email);
        var first = requests.remove();
        assertThat(first.method()).isEqualTo("POST");
        assertThat(first.path()).isEqualTo("/emails");
        assertThat(first.authorization()).isEqualTo("Bearer " + TOKEN);
        assertThat(first.body()).contains(ADDRESS, HTML, "review-subject");

        respond(422, RAW + ADDRESS + HTML + TOKEN);
        assertThatCode(() -> send(email)).doesNotThrowAnyException();
        respond(200, RAW, 2500);
        assertThatCode(() -> send(email)).doesNotThrowAnyException();
        transportException(email);
        assertThatCode(() -> send(email)).doesNotThrowAnyException();
        assertThat(output.getAll()).contains("Envio aceito", "status=422",
                        "SocketTimeoutException", "IOException")
                .doesNotContain(ADDRESS, HTML, RAW, TOKEN, EXCEPTION, "review-subject");
    }

    @Test
    void missingOrBlankTokensAreRejectedLocally() throws Exception {
        respond(401, RAW);
        var repository = mock(InvestmentRepository.class);
        when(repository.findDistinctTickersByTypes(anyList())).thenReturn(List.of("TEST11"));
        for (String value : new String[]{null, " ", TOKEN + "\n"}) {
            market(repository, value).updateVariableIncomePrices();
            send(email(value));
        }
        assertThat(requests).extracting(Observed::authorization).isEmpty();
    }

    @Test
    void emailDoesNotReplayANonIdempotentPostAfter503() throws Exception {
        server.createContext("/", exchange -> {
            observe(exchange);
            var status = count.incrementAndGet() == 1 ? 503 : 201;
            if (status == 503) exchange.getResponseHeaders().set("Retry-After", "0");
            exchange.sendResponseHeaders(status, -1);
            exchange.close();
        });
        send(email(TOKEN));
        assertThat(count.get()).isBetween(1, 2);
        if (count.get() > 1) {
            assertThat(requests).extracting(Observed::idempotencyKey)
                    .doesNotContainNull().allSatisfy(key -> assertThat(key).isNotBlank())
                    .containsOnly(requests.element().idempotencyKey());
        }
    }

    private MarketDataService market(InvestmentRepository repository, String token) {
        var service = new MarketDataService();
        ReflectionTestUtils.setField(service, "investmentRepository", repository);
        ReflectionTestUtils.setField(service, "brapiToken", token);
        localClient(service);
        return service;
    }

    private EmailService email(String token) {
        var service = new EmailService();
        ReflectionTestUtils.setField(service, "operations", new OperationsState(true, false));
        ReflectionTestUtils.setField(service, "apiKey", token);
        ReflectionTestUtils.setField(service, "fromEmail", "review-sender@example.invalid");
        localClient(service);
        return service;
    }

    private static void send(EmailService email) {
        email.sendTemplatedEmail(ADDRESS, "review-subject", "Review", HTML);
    }

    private void localClient(Object service) {
        var client = (OkHttpClient) ReflectionTestUtils.getField(service, "client");
        ReflectionTestUtils.setField(service, "client", client.newBuilder().proxy(Proxy.NO_PROXY)
                .readTimeout(850, TimeUnit.MILLISECONDS)
                .addInterceptor(chain -> {
                    var request = chain.request();
                    var localUrl = request.url().newBuilder().scheme("http").host("127.0.0.1").port(port).build();
                    return chain.proceed(request.newBuilder().url(localUrl).build());
                }).build());
    }

    private static void transportException(Object service) {
        var client = (OkHttpClient) ReflectionTestUtils.getField(service, "client");
        ReflectionTestUtils.setField(service, "client", client.newBuilder()
                .addInterceptor(chain -> { throw new IOException(EXCEPTION, new IOException(TOKEN)); })
                .build());
    }

    private void respond(int status, String body) {
        respond(status, body, 0);
    }

    private void respond(int status, String body, long delayMs) {
        if (count.getAndIncrement() > 0) server.removeContext("/");
        server.createContext("/", exchange -> {
            observe(exchange);
            try {
                if (delayMs > 0) Thread.sleep(delayMs);
                var bytes = body.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(status, bytes.length);
                exchange.getResponseBody().write(bytes);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
            } finally {
                exchange.close();
            }
        });
    }

    private void observe(com.sun.net.httpserver.HttpExchange exchange) throws IOException {
        requests.add(new Observed(exchange.getRequestMethod(), exchange.getRequestURI().toString(),
                exchange.getRequestHeaders().getFirst("Authorization"),
                new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8),
                exchange.getRequestHeaders().getFirst("Idempotency-Key")));
    }

    private record Observed(String method, String path, String authorization, String body, String idempotencyKey) {}
}
