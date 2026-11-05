# Mapa da topologia efetiva

## Controle comum

```text
Windows — CLI Docker / contexto desktop-linux
    | npipe:////./pipe/dockerDesktopLinuxEngine (controle local)
    v
Docker Desktop 4.83.0 / Engine Linux 29.6.2 / WSL2
    daemon ID 2455a676-938f-48d8-a0ef-67c98474314d
    | cria containers e publica portas aleatórias
    +-- executor Linux (quando usado)
    +-- Ryuk 0.13.0
    +-- PostgreSQL 16-alpine descartável
```

O socket Unix /var/run/docker.sock montado no executor Linux aponta ao mesmo daemon que o named pipe Windows. Ele é endpoint de controle, não endereço JDBC. Não houve abertura TCP do daemon, mudança global do Desktop, WSL ou rede Docker.

## Original — sibling Linux

```text
JVM JDK21 dentro do executor Linux, filesystem nativo /work/s
    | controle: unix:///var/run/docker.sock
    | acesso: TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal
    v
portas publicadas pelo Docker Desktop
    +-- Ryuk: acessível; handshake ativo
    +-- PG: host.docker.internal:53070 -> container:5432
          guard recusa a URL, antes da consulta sintética
```

O probe TCP próprio foi publicado na porta53066 e devolveu à JVM o token exato da execução. PostgreSQL do preflight original: container ee7136600a79..., nome cf_test_cfreview2026110301, host.docker.internal:53070. Ryuk e PG iniciaram sem alterar o guard. F reprovou e G não foi executada. PG e executor foram removidos; Ryuk encerrou automaticamente.

127.0.0.1 neste executor é seu próprio loopback; a bridge interna entre containers e o loopback Windows não são sinônimos. Trocar apenas a variável de host não muda a rede. O diagnóstico histórico --network host preserva NetworkMode=host e falha de Ryuk em127.0.0.1:52768. Não se inferiu a configuração global exata somente desse campo ou da ausência de opção no arquivo de settings consultado.

A [documentação Testcontainers para executores em containers](https://java.testcontainers.org/supported_docker_environment/continuous_integration/dind_patterns/) descreve o socket e host.docker.internal no Desktop. Isso torna o acesso possível, mas não muda a política de destinos deste repositório. [Host networking no Docker Desktop](https://docs.docker.com/engine/network/drivers/host/) depende de suporte e habilitação próprios; não foi habilitado nem foi reiniciado o Desktop nesta revisão.

## Alternativa comprovada — JVM Windows

```text
Windows — JVM JDK21 nativa e runner Node nativo, caminhos físicos
    | controle: npipe:////./pipe/dockerDesktopLinuxEngine
    | acesso: TESTCONTAINERS_HOST_OVERRIDE=127.0.0.1
    v
Docker Desktop — mesmo daemon ID
    +-- Ryuk: porta publicada, handshake ativo
    +-- PG: 127.0.0.1:63585 -> container:5432
          guard aceita nome efêmero exato
          JDBC confirma current_database() e 1+1=2
```

Aqui 127.0.0.1 é o loopback Windows onde a publicação foi efetivamente acessada pela mesma JVM. Não se confundiu esse destino com localhost do executor Linux. O PG39d6f2385d76... foi criado apenas para este probe e removido; o consumidor Spring posterior criou seu próprio PG. Os endereços de Ryuk/PG são descobertos pelo Testcontainers, sem fixar portas para a próxima rodada.

A configuração do usuário consultada tem docker.client.strategy=NpipeSocketClientProviderStrategy; DOCKER_HOST explícito do processo selecionou o pipe confirmado no log. Na JVM Linux a estratégia efetiva usou o socket Unix. Não se importou ambiente Spring/JWT/e-mail/banco real; somente valores sintéticos. Ryuk permaneceu ativo; nenhum recurso recebeu --privileged como solução. A [configuração oficial Testcontainers](https://java.testcontainers.org/features/configuration/) diferencia host de controle, socket para containers auxiliares e endereço de portas publicadas.

A alternativa evita provisionamento persistente, mas passa a executar também os testes comuns no Windows. O seletor canônico já admite isso: expanded/win32 seleciona todas as116 classes, sem exclusão Linux adicional; a única condição de sistema existente é a classe Windows. Não é uma validação da topologia Linux nem do ambiente remoto.
