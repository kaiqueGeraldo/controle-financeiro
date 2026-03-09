package com.controlefinanceiro.api.domain.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String senha;

    private boolean darkMode = true;
    private boolean privacyMode = false;

    @Column(name = "notif_contas", columnDefinition = "boolean default true")
    private boolean notifContas = true;

    @Column(name = "notif_semanal", columnDefinition = "boolean default true")
    private boolean notifSemanal = false;

    @Column(name = "dashboard_config", columnDefinition = "TEXT")
    private String dashboardConfig = "[{\"id\":\"BALANCE\",\"visible\":true},{\"id\":\"FLOW\",\"visible\":true},{\"id\":\"INVOICES\",\"visible\":true},{\"id\":\"CHART\",\"visible\":true},{\"id\":\"GOALS\",\"visible\":true}]";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @JsonIgnore
    private String recoveryToken;

    @JsonIgnore
    private LocalDateTime recoveryTokenExpiry;

    @Column(name = "reset_attempts", columnDefinition = "integer default 0")
    private Integer resetAttempts = 0;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() { return senha; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
}