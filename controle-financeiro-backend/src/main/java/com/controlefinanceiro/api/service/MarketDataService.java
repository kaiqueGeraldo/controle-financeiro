package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.investment.InvestType;
import com.controlefinanceiro.api.domain.investment.Investment;
import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.domain.investment.dto.BrapiResponseDTO;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
public class MarketDataService {

    @Autowired
    private InvestmentRepository investmentRepository;
    @Autowired
    private Clock clock;

    @Value("${api.brapi.token}")
    private String brapiToken;

    private static final String BRAPI_BASE_URL = "https://brapi.dev/api/quote/";
    private final RestTemplate restTemplate;

    public MarketDataService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // tempo máximo para conectar à Brapi
        factory.setReadTimeout(10000);    // tempo máximo esperando a resposta da Brapi

        this.restTemplate = new RestTemplate(factory);
    }

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
            String url = BRAPI_BASE_URL + tickersParam + "?token=" + brapiToken;

            try {
                BrapiResponseDTO response = restTemplate.getForObject(url, BrapiResponseDTO.class);
                if (response != null && response.results() != null) {
                    for (BrapiResponseDTO.StockDTO stockData : response.results()) {
                        updateAssetPrice(stockData.symbol(), stockData.regularMarketPrice());
                    }
                }
            } catch (Exception e) {
                log.error("MARKET: Erro ao processar lote [{}].", tickersParam, e);
            }

        }
    }

    private void updateAssetPrice(String ticker, BigDecimal newPrice) {
        if (newPrice == null || newPrice.signum() < 0 || newPrice.scale() > 8) return;

        List<Investment> investments = investmentRepository.findAllByTicker(ticker);

        for (Investment asset : investments) {
            asset.evaluate(newPrice, LocalDate.now(clock), "BRAPI");
            investmentRepository.save(asset);
        }
    }

    private boolean isVariableIncome(InvestType type) {
        return type == InvestType.STOCK || type == InvestType.FII || type == InvestType.CRYPTO;
    }
}
