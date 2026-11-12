package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.investment.InvestType;
import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.domain.investment.dto.BrapiResponseDTO;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Slf4j
@Service
public class MarketDataService {

    private static final HttpUrl BRAPI_BASE_URL = HttpUrl.get("https://brapi.dev/api/quote/");
    private static final List<InvestType> SUPPORTED_TYPES = List.of(InvestType.STOCK, InvestType.FII);
    private static final Pattern TICKER = Pattern.compile("[A-Z0-9]{1,20}");
    // One request per symbol. Even a 31-day cycle uses at most 11,160 scheduled calls.
    private static final int REQUESTS_PER_RUN = 15;
    private static final JsonMapper RESPONSE_MAPPER = JsonMapper.builder()
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .build();

    @Autowired private InvestmentRepository investmentRepository;
    @Autowired private Clock clock;
    @Autowired private MarketPriceWriter priceWriter;
    @Value("${api.brapi.token}")
    private String brapiToken;

    private final OkHttpClient client = new OkHttpClient.Builder()
            .callTimeout(Duration.ofSeconds(8))
            .retryOnConnectionFailure(false)
            .followRedirects(false)
            .followSslRedirects(false)
            .build();

    private int nextIndex;

    @Scheduled(fixedDelay = 3_600_000)
    @SchedulerLock(name = "updateVariableIncomePricesLock", lockAtLeastFor = "1h", lockAtMostFor = "1h")
    public void updateVariableIncomePrices() {
        if (brapiToken == null || brapiToken.isBlank()
                || !brapiToken.chars().allMatch(value -> value >= 33 && value <= 126)) {
            log.warn("MARKET: Credencial da BRAPI ausente ou inválida.");
            return;
        }

        List<String> tickers = investmentRepository.findDistinctTickersByTypes(SUPPORTED_TYPES).stream()
                .map(ticker -> ticker.strip().toUpperCase(Locale.ROOT))
                .filter(ticker -> TICKER.matcher(ticker).matches())
                .distinct()
                .sorted()
                .toList();
        if (tickers.isEmpty()) return;

        var quotes = new LinkedHashMap<String, Quote>();
        for (int i = 0; i < Math.min(REQUESTS_PER_RUN, tickers.size()); i++) {
            int index = nextIndex % tickers.size();
            String ticker = tickers.get(index);
            nextIndex = index + 1;
            var request = new Request.Builder()
                    .url(BRAPI_BASE_URL.newBuilder().addPathSegment(ticker).build())
                    .header("Authorization", "Bearer " + brapiToken)
                    .build();

            try (var response = client.newCall(request).execute()) {
                int status = response.code();
                if (!response.isSuccessful()) {
                    log.warn("MARKET: BRAPI recusou a cotação (status={}).", status);
                    if (status == 401 || status == 403 || status == 429 || status >= 500) break;
                    continue;
                }
                if (response.body() == null || status == 204) continue;
                var data = RESPONSE_MAPPER.readValue(response.body().byteStream(), BrapiResponseDTO.class);
                Quote quote = quoteFor(ticker, data);
                if (quote != null) quotes.put(ticker, quote);
            } catch (IOException | RuntimeException e) {
                log.warn("MARKET: Falha ao consultar cotação (tipo={}).", e.getClass().getSimpleName());
                break;
            }
        }

        // The persisted valuation remains available when a call fails or the ticker is outside this run.
        if (quotes.isEmpty()) return;
        for (var position : investmentRepository.findQuotePositions(quotes.keySet(), SUPPORTED_TYPES)) {
            Quote quote = quotes.get(position.getTicker());
            try {
                priceWriter.update(position.getOwnerId(), position.getInvestmentId(), quote.price(), quote.date());
            } catch (RuntimeException e) {
                log.warn("MARKET: Falha ao persistir cotação (tipo={}).", e.getClass().getSimpleName());
            }
        }
    }

    private Quote quoteFor(String ticker, BrapiResponseDTO data) {
        if (data == null || data.results() == null || data.results().size() != 1) return null;
        var item = data.results().getFirst();
        if (item == null || !ticker.equals(item.symbol()) || item.regularMarketTime() == null) return null;
        BigDecimal price = item.regularMarketPrice();
        if (price == null || price.signum() <= 0 || price.scale() > 8 || price.precision() - (long) price.scale() > 12) {
            return null;
        }
        try {
            var now = clock.instant();
            var instant = Instant.parse(item.regularMarketTime());
            if (instant.isAfter(now)) return null;
            return new Quote(price, LocalDate.ofInstant(instant, clock.getZone()));
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private record Quote(BigDecimal price, LocalDate date) {}
}
