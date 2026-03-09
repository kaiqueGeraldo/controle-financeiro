package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.goal.GoalRepository;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class MarketDataService {

    @Autowired
    private InvestmentRepository investmentRepository;
    @Autowired
    private GoalRepository goalRepository;

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

            // Armazena apenas metas únicas afetadas neste lote
            Set<Goal> affectedGoalsInBatch = new HashSet<>();

            try {
                BrapiResponseDTO response = restTemplate.getForObject(url, BrapiResponseDTO.class);
                if (response != null && response.results() != null) {
                    for (BrapiResponseDTO.StockDTO stockData : response.results()) {
                        updateAssetPrice(stockData.symbol(), stockData.regularMarketPrice(), affectedGoalsInBatch);
                    }
                }
            } catch (Exception e) {
                log.error("MARKET: Erro ao processar lote [{}].", tickersParam, e);
            }

            // Atualiza o somatório das metas apenas uma vez por lote
            for (Goal goal : affectedGoalsInBatch) {
                updateLinkedGoal(goal);
            }
        }
    }

    private void updateAssetPrice(String ticker, BigDecimal newPrice, Set<Goal> affectedGoals) {
        if (newPrice == null) return;

        List<Investment> investments = investmentRepository.findAllByTicker(ticker);

        for (Investment asset : investments) {
            if (asset.getCurrentPrice().compareTo(newPrice) != 0) {
                asset.setCurrentPrice(newPrice);
                investmentRepository.save(asset);

                // Apenas adiciona ao Set, delegando a atualização para o fim do lote
                if (asset.getGoal() != null) {
                    affectedGoals.add(asset.getGoal());
                }
            }
        }
    }

    private void updateLinkedGoal(Goal goal) {
        BigDecimal totalValue = investmentRepository.sumValueByGoalId(goal.getId());
        goal.setCurrentValue(totalValue != null ? totalValue : BigDecimal.ZERO);
        goalRepository.save(goal);
    }

    private boolean isVariableIncome(InvestType type) {
        return type == InvestType.STOCK || type == InvestType.FII || type == InvestType.CRYPTO;
    }
}