package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;

/** Validates the entire command before mutation; callers supply only constant JPQL paths. */
@Component
public class OwnedResourceOrder {
    private final EntityManager entities;
    public OwnedResourceOrder(EntityManager entities) { this.entities = entities; }

    @Transactional(propagation = Propagation.MANDATORY)
    public <T> void reorder(List<UUID> ids, Class<T> type, String ownerPath, UUID ownerId,
                           String parentPath, UUID parentId, String missingMessage,
                           Function<T,UUID> idOf, BiConsumer<T,Integer> setOrder) {
        if (ids == null || ids.stream().anyMatch(Objects::isNull)) {
            throw new BusinessRuleException("A ordem deve conter somente IDs válidos.");
        }
        Map<UUID,Integer> positions = new HashMap<>();
        for (int i=0;i<ids.size();i++) {
            if (positions.put(ids.get(i), i) != null) throw new BusinessRuleException("A ordem não pode repetir IDs.");
        }
        if (ids.isEmpty()) return;
        String jpql = "select r from " + type.getSimpleName() + " r where " + ownerPath
                + " = :owner and r.id in :ids" + (parentPath == null ? "" : " and " + parentPath + " = :parent")
                + " order by r.id";
        var query = entities.createQuery(jpql, type).setParameter("owner", ownerId)
                .setParameter("ids", positions.keySet()).setLockMode(LockModeType.PESSIMISTIC_WRITE);
        if (parentPath != null) query.setParameter("parent", parentId);
        var rows = query.getResultList();
        if (rows.size() != ids.size()) throw new ResourceNotFoundException(missingMessage);
        rows.forEach(row -> setOrder.accept(row, positions.get(idOf.apply(row))));
    }
}
