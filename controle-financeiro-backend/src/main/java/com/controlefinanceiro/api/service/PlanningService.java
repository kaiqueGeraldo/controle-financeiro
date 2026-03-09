package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.planning.*;
import com.controlefinanceiro.api.domain.planning.dto.CreatePlanItemDTO;
import com.controlefinanceiro.api.domain.planning.dto.MonthlyPlanDTO;
import com.controlefinanceiro.api.domain.planning.dto.PlanItemDTO;
import com.controlefinanceiro.api.domain.planning.dto.UpdateIncomeDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
public class PlanningService {

    @Autowired
    private MonthlyPlanRepository planRepository;
    @Autowired
    private PlanItemRepository itemRepository;
    @Autowired
    private CategoryRepository categoryRepository;

    private static final Pattern INSTALLMENT_PATTERN = Pattern.compile("^(.*?)\\s*\\(?(\\d+)/(\\d+)\\)?$");

    public MonthlyPlanDTO getPlanByMonth(User user, Integer month, Integer year) {
        MonthlyPlan plan = planRepository.findByUserIdAndMonthAndYearWithDetails(user.getId(), month, year)
                .orElseGet(() -> {
                    MonthlyPlan newPlan = new MonthlyPlan();
                    newPlan.setUser(user);
                    newPlan.setMonth(month);
                    newPlan.setYear(year);
                    return planRepository.save(newPlan);
                });

        List<PlanItem> listaItens = plan.getItems() != null ? plan.getItems() : Collections.emptyList();

        List<PlanItemDTO> items = listaItens.stream()
                .sorted(java.util.Comparator.comparing(PlanItem::getOrderIndex, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new MonthlyPlanDTO(plan.getIncomeForecast(), items);
    }

    @Transactional
    public PlanItemDTO createItem(CreatePlanItemDTO data, User user) {
        log.info("Adicionando item ao planejamento: {} (Valor: {})", data.description(), data.amount());
        int month = data.dueDate().getMonthValue();
        int year = data.dueDate().getYear();

        MonthlyPlan plan = planRepository.findByUserIdAndMonthAndYear(user.getId(), month, year)
                .orElseGet(() -> {
                    MonthlyPlan newPlan = new MonthlyPlan();
                    newPlan.setUser(user);
                    newPlan.setMonth(month);
                    newPlan.setYear(year);
                    return planRepository.save(newPlan);
                });

        PlanItem item = new PlanItem();
        item.setDescription(data.description());
        item.setAmount(data.amount());
        item.setDueDate(data.dueDate());
        item.setStatus(data.status() != null ? data.status() : PlanItemStatus.PENDING);
        item.setPlan(plan);

        if (data.categoryId() != null) {
            Category category = categoryRepository.findById(data.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
            item.setCategory(category);
        }

        item = itemRepository.save(item);
        return convertToDTO(item);
    }

    @Transactional
    public void copyFromPreviousMonth(User user, Integer targetMonth, Integer targetYear) {
        LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);
        LocalDate prevDate = targetDate.minusMonths(1);

        MonthlyPlan prevPlan = planRepository.findByUserIdAndMonthAndYear(
                user.getId(), prevDate.getMonthValue(), prevDate.getYear()
        ).orElseThrow(() -> new ResourceNotFoundException("Não há planejamento no mês anterior para copiar."));

        MonthlyPlan targetPlan = planRepository.findByUserIdAndMonthAndYear(user.getId(), targetMonth, targetYear)
                .orElseGet(() -> {
                    MonthlyPlan newPlan = new MonthlyPlan();
                    newPlan.setUser(user);
                    newPlan.setMonth(targetMonth);
                    newPlan.setYear(targetYear);
                    newPlan.setIncomeForecast(prevPlan.getIncomeForecast());
                    return planRepository.save(newPlan);
                });

        List<PlanItem> itemsToCopy = prevPlan.getItems();
        if (itemsToCopy == null) return;

        for (PlanItem item : itemsToCopy) {
            // 1. PULA FATURA DE CARTÃO
            if (item.getCard() != null) continue;

            String newDescription = item.getDescription();
            boolean shouldCopy = true;

            // 2. LÓGICA DE PARCELAS
            Matcher matcher = INSTALLMENT_PATTERN.matcher(item.getDescription());
            if (matcher.find()) {
                String nomeBase = matcher.group(1).trim();
                int parcelaAtual = Integer.parseInt(matcher.group(2)); // 5
                int totalParcelas = Integer.parseInt(matcher.group(3)); // 18

                if (parcelaAtual < totalParcelas) {
                    // Incrementa: 5/18 vira 6/18
                    int novaParcela = parcelaAtual + 1;
                    // Mantém o formato original
                    newDescription = String.format("%s %d/%d", nomeBase, novaParcela, totalParcelas);
                } else {
                    // Se era 18/18, NÃO copia (encerrou a dívida)
                    shouldCopy = false;
                }
            }

            if (shouldCopy) {
                PlanItem newItem = new PlanItem();
                newItem.setDescription(newDescription);
                newItem.setAmount(item.getAmount());
                newItem.setCategory(item.getCategory());
                newItem.setStatus(PlanItemStatus.PENDING);
                newItem.setPlan(targetPlan);
                newItem.setOrderIndex(item.getOrderIndex());

                int diaVencimento = item.getDueDate().getDayOfMonth();
                int ultimoDiaMesAlvo = targetDate.lengthOfMonth();
                newItem.setDueDate(LocalDate.of(targetYear, targetMonth, Math.min(diaVencimento, ultimoDiaMesAlvo)));

                itemRepository.save(newItem);
            }
        }
    }

    @Transactional
    public void updateStatus(UUID id, PlanItemStatus status, User user) {
        log.info("Atualizando status do item {} para {}", id, status);
        PlanItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));

        // Segurança: verifica se o item pertence ao usuário logado
        if (!item.getPlan().getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        item.setStatus(status);
        itemRepository.save(item);
    }

    @Transactional
    public void updateIncomeForecast(User user, UpdateIncomeDTO dto) {
        MonthlyPlan plan = planRepository.findByUserIdAndMonthAndYear(user.getId(), dto.month(), dto.year())
                .orElseGet(() -> {
                    MonthlyPlan newPlan = new MonthlyPlan();
                    newPlan.setUser(user);
                    newPlan.setMonth(dto.month());
                    newPlan.setYear(dto.year());
                    return planRepository.save(newPlan);
                });

        plan.setIncomeForecast(dto.income());
        planRepository.save(plan);
    }

    @Transactional
    public void delete(UUID id, User user) {
        PlanItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));

        if (!item.getPlan().getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        if (item.getCard() != null) {
            throw new BusinessRuleException("Não é possível excluir um planejamento de fatura manualmente. Gerencie-o através das transações do cartão.");
        }

        itemRepository.delete(item);
    }

    private PlanItemDTO convertToDTO(PlanItem item) {
        return new PlanItemDTO(
                item.getId(),
                item.getDescription(),
                item.getAmount(),
                item.getDueDate(),
                item.getStatus(),
                item.getCategory() != null ? item.getCategory().getId() : null,
                item.getCategory() != null ? item.getCategory().getName() : null,
                item.getCategory() != null ? item.getCategory().getIcon() : null,
                item.getCategory() != null ? item.getCategory().getColor() : null,
                item.getCard() != null ? item.getCard().getId() : null
        );
    }

    @Transactional
    public void reorderItems(List<UUID> orderedIds, User user) {
        for (int i = 0; i < orderedIds.size(); i++) {
            PlanItem item = itemRepository.findById(orderedIds.get(i)).orElse(null);
            if (item != null && item.getPlan().getUser().getId().equals(user.getId())) {
                item.setOrderIndex(i);
                itemRepository.save(item);
            }
        }
    }
}