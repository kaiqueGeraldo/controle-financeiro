package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.investment.InvestType;
import com.controlefinanceiro.api.domain.investment.Investment;
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
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
public class MarketDataService {

    @Autowired
    private InvestmentRepository investmentRepository;
    @Autowired
    private Clock clock;
    @Autowired private MarketPriceWriter priceWriter;

    @Value("${api.brapi.token}")
    private String brapiToken;

    private static final HttpUrl BRAPI_BASE_URL = HttpUrl.get("https://brapi.dev/api/quote/");
    private static final JsonMapper RESPONSE_MAPPER = JsonMapper.builder()
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .build();

    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(Duration.ofSeconds(10))
            .readTimeout(Duration.ofSeconds(10))
            .followRedirects(false)
            .followSslRedirects(false)
            .build();

    @Scheduled(fixedRate = 1800000)
    @SchedulerLock(name = "updateVariableIncomePricesLock", lockAtLeastFor = "1m", lockAtMostFor = "5m")
    public void updateVariableIncomePrices() {
        log.info("MARKET: Iniciando atualização de cotações via Brapi...");

        List<String> uniqueTickers = investmentRepository.findDistinctTickersByTypes(
                List.of(InvestType.STOCK, InvestType.FII, InvestType.CRYPTO)
        );

        if (uniqueTickers.isEmpty()) return;

        int batchSize = 15;
        for (int i = 0; i < uniqueTickers.size(); i += batchSize) {
            List<String> batch = uniqueTickers.subList(i, Math.min(i + batchSize, uniqueTickers.size()));
            String tickersParam = String.join(",", batch);
            if (tickersParam.equals(".") || tickersParam.equals("..")) {
                log.warn("MARKET: Segmento de cotação inválido.");
                continue;
            }

            try {
                var url = BRAPI_BASE_URL.newBuilder().addPathSegment(tickersParam).build();
                var request = new Request.Builder()
                        .url(url)
                        .header("Authorization", "Bearer " + brapiToken)
                        .build();
                try (var response = client.newCall(request).execute()) {
                    if (!response.isSuccessful()) {
                        log.warn("MARKET: BRAPI recusou o lote (status={}).", response.code());
                        continue;
                    }
                    var body = response.body();
                    if (body == null || response.code() == 204) continue;
                    var quotes = RESPONSE_MAPPER.readValue(body.byteStream(), BrapiResponseDTO.class);
                    if (quotes != null && quotes.results() != null) {
                        for (var quote : quotes.results()) {
                            updateAssetPrice(quote.symbol(), quote.regularMarketPrice());
                        }
                    }
                }
            } catch (IOException | RuntimeException e) {
                log.error("MARKET: Falha ao processar lote (tipo={}).", e.getClass().getSimpleName());
            }

        }
    }

    private void updateAssetPrice(String ticker, BigDecimal newPrice) {
        if (newPrice == null || newPrice.signum() < 0 || newPrice.scale() > 8) return;

        List<Investment> investments = investmentRepository.findAllByTicker(ticker);

        for (Investment asset : investments) {
            priceWriter.update(asset.getUser().getId(),asset.getId(),newPrice);
        }
    }

    private boolean isVariableIncome(InvestType type) {
        return type == InvestType.STOCK || type == InvestType.FII || type == InvestType.CRYPTO;
    }
}
