package com.controlefinanceiro.api.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    UserDetails findByEmail(String email);

    Optional<User> findUserByEmail(String email);
    Optional<User> findByRecoveryToken(String token);
    List<User> findByNotifContasTrue();
    List<User> findByNotifSemanalTrue();
}