package com.controlefinanceiro.api.domain.goal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvolutionProtocol implements Serializable {
    private String essence;             // A Essência
    private String personalConnection;  // Conexão Pessoal
    private String systemEngineering;   // Engenharia de Sistemas
}