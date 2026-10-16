# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cf019-rva03.integrated.spec.ts >> RVA03 original pagamento 20
- Location: tests\e2e\cf019-rva03.integrated.spec.ts:32:87

# Error details

```
Test timeout of 90000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f3e1]:
  - generic [ref=f3e2]:
    - complementary "Navegação principal" [ref=f3e3]:
      - generic [ref=f3e4]:
        - generic [ref=f3e5]: P
        - generic [ref=f3e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f3e7]
          - text: cf003-a-rva03-87eb104a-original-20@example.invalid
      - navigation [ref=f3e9]:
        - link [ref=f3e10] [cursor=pointer]:
          - /url: /
        - link [ref=f3e17] [cursor=pointer]:
          - /url: /contas
        - link [ref=f3e21] [cursor=pointer]:
          - /url: /extrato
        - link [ref=f3e26] [cursor=pointer]:
          - /url: /cartoes
        - link [ref=f3e30] [cursor=pointer]:
          - /url: /planejamento
        - link [ref=f3e34] [cursor=pointer]:
          - /url: /metas
        - link [ref=f3e40] [cursor=pointer]:
          - /url: /investimentos
        - link [ref=f3e47] [cursor=pointer]:
          - /url: /resumo-anual
        - link [ref=f3e53] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f3e59]:
        - button "Privacidade" [ref=f3e60]
        - button "Configurações" [ref=f3e65]
        - button "Sair da Conta" [ref=f3e69]
    - generic [ref=f3e73]:
      - generic [ref=f3e75]:
        - button "Abrir menu de navegação" [ref=f3e76]
        - generic [ref=f3e78]: Controle Financeiro
      - main [ref=f3e79]:
        - generic [ref=f3e80]:
          - generic [ref=f3e82]:
            - generic [ref=f3e83]:
              - heading "Carteira" [level=1] [ref=f3e84]
              - paragraph [ref=f3e85]: Gestão de crédito e faturas.
            - generic [ref=f3e86]:
              - button "Lançar Compra" [ref=f3e87]
              - button "Novo Cartão" [ref=f3e91]
          - main [ref=f3e93]:
            - generic [ref=f3e94]:
              - generic [ref=f3e99]:
                - paragraph [ref=f3e100]: Limite Global
                - generic [ref=f3e101]: R$ 1.000,00
              - generic [ref=f3e107]:
                - paragraph [ref=f3e108]: Faturas Abertas
                - generic [ref=f3e109]: R$ 120,00
              - generic [ref=f3e115]:
                - paragraph [ref=f3e116]: Disponível
                - generic [ref=f3e117]: R$ 880,00
            - heading "Cartões Ativos" [level=2] [ref=f3e119]
            - generic [ref=f3e120]:
              - button "Ver fatura de SAN cartão 20, final 4242":
                - generic:
                  - generic:
                    - img "Logo da bandeira VISA"
                  - generic:
                    - paragraph: •••• 4242
                    - generic:
                      - paragraph: SAN cartão 20
                      - paragraph: Vence dia 28
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Fatura Atual
                      - generic: R$ 120,00
                    - generic:
                      - paragraph: Disponível
                      - generic: R$ 880,00
  - button "Open Next.js Dev Tools" [ref=f3e126] [cursor=pointer]
  - alert [ref=f3e130]
  - dialog [ref=f3e132]:
    - generic [ref=f3e133]:
      - generic [ref=f3e134]:
        - button "Mês anterior da fatura" [ref=f3e135]
        - generic [ref=f3e138]: janeiro de 2027
        - button "Próximo mês da fatura" [ref=f3e141]
      - button "Fechar detalhes da fatura" [active] [ref=f3e144]
    - generic [ref=f3e149]:
      - generic [ref=f3e150]:
        - paragraph [ref=f3e151]: SAN cartão 20 •••• 4242
        - paragraph [ref=f3e152]: R$ 120,00
        - paragraph [ref=f3e153]: "Consumo original · Saldo pagável: R$ 120,00 · Crédito: R$ 0,00"
        - generic [ref=f3e154]:
          - generic "Data em que as compras passam para o próximo mês" [ref=f3e155]: "Fecha: 20 de jan"
          - generic "Data limite para pagamento" [ref=f3e156]: "Vence: 28 de jan"
      - text: Aberta
    - generic [ref=f3e158]:
      - generic [ref=f3e164]:
        - paragraph [ref=f3e165]: "Compra Meta: SAN compra cartão 20"
        - paragraph [ref=f3e166]: 15/01/2027 Metas e Objetivos
        - group [ref=f3e167]:
          - generic "Horário e registro" [ref=f3e168]
      - generic [ref=f3e169]:
        - text: R$ 120,00
        - generic [ref=f3e170]:
          - button [ref=f3e171]
          - button [ref=f3e175]
    - generic [ref=f3e179]:
      - generic [ref=f3e180]:
        - 'button "Limite: R$ 1.000,00" [ref=f3e181]'
        - button "Excluir" [ref=f3e185]
      - button "Adiantar Fatura" [ref=f3e189]
```