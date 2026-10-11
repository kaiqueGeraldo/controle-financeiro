# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend-closure.integrated.spec.ts >> E: interação semanal passiva com persistência e reload
- Location: tests\e2e\frontend-closure.integrated.spec.ts:59:5

# Error details

```
Test timeout of 90000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e3]:
    - generic [ref=f1e5]:
      - button "Abrir menu de navegação" [ref=f1e6] [cursor=pointer]
      - generic [ref=f1e8]: Controle Financeiro
    - main [ref=f1e10]:
      - generic [ref=f1e11]:
        - generic [ref=f1e13]:
          - heading "Hábitos" [level=1] [ref=f1e15]
          - button [ref=f1e17] [cursor=pointer]
        - main [ref=f1e19]:
          - generic [ref=f1e25]:
            - heading "O Perdão Automático está ativo" [level=3] [ref=f1e26]
            - paragraph [ref=f1e27]: "Baseado no livro \"Hábitos Atômicos\": se você esquecer de registrar um dia por um imprevisto (mas tiver cumprido no dia anterior), o sistema protegerá sua ofensiva. Nunca falhe duas vezes."
          - paragraph [ref=f1e29]: Nenhum hábito cadastrado.
  - button "Open Next.js Dev Tools" [ref=f1e35] [cursor=pointer]
  - alert [ref=f1e39]
```