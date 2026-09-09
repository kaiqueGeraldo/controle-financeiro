package com.controlefinanceiro.api.infra.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
public class TokenService {

    private static final String ISSUER = "controle-financeiro-api";
    private static final Duration TOKEN_TTL = Duration.ofHours(24);

    @Value("${api.security.token.secret}")
    private String secret;
    @Autowired
    private Clock clock;

    public String generateToken(User user) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.create()
                    .withIssuer(ISSUER)
                    .withSubject(user.getEmail())
                    .withClaim("id", user.getId().toString())
                    .withClaim("nome", user.getNome())
                    .withExpiresAt(genExpirationDate())
                    .sign(algorithm);
        } catch (JWTCreationException exception) {
            throw new BusinessRuleException("Erro ao gerar token");
        }
    }

    public String validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            DecodedJWT decoded = JWT.decode(token);
            algorithm.verify(decoded);

            Instant expiresAt = decoded.getExpiresAtAsInstant();
            if (!ISSUER.equals(decoded.getIssuer())
                    || decoded.getSubject() == null
                    || expiresAt == null
                    || !expiresAt.isAfter(clock.instant())) {
                return "";
            }

            return decoded.getSubject();
        } catch (JWTVerificationException exception) {
            return "";
        }
    }

    private Instant genExpirationDate() {
        return clock.instant().plus(TOKEN_TTL);
    }
}
