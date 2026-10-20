package com.controlefinanceiro.api.domain.onboarding;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.UUID;
@Entity @Table(name="onboarding_application_items") @IdClass(OnboardingApplicationItem.Key.class)
public class OnboardingApplicationItem {
    public static class Key implements Serializable {
        public UUID sessionId,tempId;
        public Key() {}
        @Override public boolean equals(Object o){return o instanceof Key k && java.util.Objects.equals(sessionId,k.sessionId)&&java.util.Objects.equals(tempId,k.tempId);}
        @Override public int hashCode(){return java.util.Objects.hash(sessionId,tempId);}
    }
    @Id private UUID sessionId;
    @Id private UUID tempId;
    @Column(nullable=false,length=20) private String kind;
    @Column(nullable=false) private UUID resourceId;
    @Column(nullable=false,length=24) private String action;
}
