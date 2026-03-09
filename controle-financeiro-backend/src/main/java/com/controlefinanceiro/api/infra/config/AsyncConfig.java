package com.controlefinanceiro.api.infra.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2); // Threads ativas o tempo todo
        executor.setMaxPoolSize(5);  // Máximo de threads simultâneas
        executor.setQueueCapacity(50); // Fila de espera antes de rejeitar
        executor.setThreadNamePrefix("EmailSender-");
        executor.initialize();
        return executor;
    }
}