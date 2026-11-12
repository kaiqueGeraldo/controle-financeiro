import com.resend.core.net.HttpMethod;
import com.resend.core.net.impl.HttpClient;
import com.sun.net.httpserver.HttpServer;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

public class BaselineResendReview {
    public static void main(String[] args) throws Exception {
        var requests = new AtomicInteger();
        var auth = new ArrayList<String>();
        var keys = new ArrayList<String>();
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            exchange.getRequestBody().readAllBytes();
            auth.add(exchange.getRequestHeaders().getFirst("Authorization"));
            keys.add(exchange.getRequestHeaders().getFirst("Idempotency-Key"));
            int attempt = requests.incrementAndGet();
            int status = attempt == 1 ? 503 : 201;
            if (status == 503) exchange.getResponseHeaders().set("Retry-After", "0");
            byte[] bytes = "{\"id\":\"synthetic-id\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        try {
            var sdk = new HttpClient();
            var field = HttpClient.class.getDeclaredField("httpClient");
            field.setAccessible(true);
            var original = (OkHttpClient) field.get(sdk);
            int port = server.getAddress().getPort();
            var local = original.newBuilder().proxy(Proxy.NO_PROXY).addInterceptor(chain -> {
                var request = chain.request();
                var url = request.url().newBuilder().scheme("http").host("127.0.0.1").port(port).build();
                return chain.proceed(request.newBuilder().url(url).build());
            }).build();
            field.set(sdk, local);
            sdk.perform("/emails", "synthetic-baseline-token", HttpMethod.POST, "{}", MediaType.get("application/json"));
            if (requests.get() != 2 || keys.stream().anyMatch(key -> key != null)) {
                throw new AssertionError("Baseline 503 control did not observe two non-idempotent POSTs");
            }
            sdk.perform("/emails", " ", HttpMethod.POST, "{}", MediaType.get("application/json"));
            sdk.perform("/emails", null, HttpMethod.POST, "{}", MediaType.get("application/json"));
            if (!auth.subList(2, 4).equals(java.util.List.of("Bearer", "Bearer null"))) {
                throw new AssertionError("Baseline token guard control changed");
            }
            System.out.println("SDK Resend 2.0.0 anterior: dois POSTs no 503 Retry-After 0, sem Idempotency-Key.");
            System.out.println("SDK anterior também transmite Bearer vazio e Bearer null. Riscos herdados confirmados.");
        } finally {
            server.stop(0);
        }
    }
}
