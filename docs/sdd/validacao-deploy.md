# Validação e deploy

## Evidências da primeira sessão

- Leitura estrutural das nove abas da planilha e inventário do código concluídos.
- Reprodução executável anterior ao patch: 07/09 aparece 06/09; “hoje” às 23h30 vira 08/09; janeiro/31 + um mês vira março/03; prazo de hoje aparece atrasado.
- `npm test`: cinco cenários por fuso, 15 execuções aprovadas em America/Sao_Paulo, UTC e Pacific/Kiritimati. Abrange utilitários de calendário, não a renderização de todas as telas.
- `npm run build`: aprovado com Next 16.1.6; download de fontes precisou de rede autorizada. Aviso existente de middleware depreciado permanece para T-011.
- `npm run typecheck`: aprovado.
- `npm run lint`: falhou com 70 erros e 37 avisos em 54 arquivos. Detalhamento em [baseline de lint](lint-baseline.md); nenhuma regra desabilitada. Predominam any explícito, variáveis não usadas, regras de hooks/componentes e entidades JSX.
- Instalação npm concluída após uso de cache temporário e rede autorizada. Sem mudança de versões/lockfile. npm reportou scripts de instalação bloqueados de sharp/unrs-resolver; o build e o lint conseguiram executar.
- Backend: Maven `package -DskipTests` aprovado usando distribuição 3.9.12 existente e repositório local explícito. JVM disponível 25.0.4 compilou com release 21; repetir em Java 21 no CI antes de liberação. Não foi executada suíte com PostgreSQL, pois ainda não existe perfil isolado e Docker não foi encontrado no PATH.
- Wrapper Maven falhou localmente ao acessar Target nulo; alternativa de execução não corrigiu o wrapper. Cache offline inicialmente incompleto foi resolvido com download autorizado.
- Nenhum ambiente remoto alterado, dado real importado ou deploy executado nesta etapa.

## Comandos de verificação

Frontend (Node 24, alinhado ao CI):

```powershell
cd controle-financeiro-frontend
npm ci
npm test
npm run lint
npm run typecheck
npm run build
```

Backend (Java 21 e PostgreSQL isolado, após T-005):

```powershell
cd controle-financeiro-backend
.\mvnw.cmd verify
```

Até existir perfil de teste isolado, `contextLoads` usa configurações da aplicação; não apontar a banco real para fazê-lo passar. Compilar com skipTests é evidência apenas de build, não de funcionamento. Testes Node de TypeScript requerem suporte nativo presente no Node 24 do CI.

## Matriz de auditoria visual/funcional

Executar em 360×800, 768×1024 e 1440×900; claro/escuro, com/sem privacidade; teclado e mouse/toque. Registrar console e rede por falha, sem capturar dados reais. Estado inicial de todas as linhas: pendente de validação em navegador.

| Tela | Fluxos e invariantes prioritários |
|---|---|
| Autenticação | Registrar, entrar, erro de senha, recuperação, sessão expirada, logout; erros preservam campos apropriados |
| Dashboard | Saldos, patrimônio, metas vinculadas, gráfico, faturas, recentes; vazio distinto de erro de API |
| Contas | Criar com saldo positivo/zero/negativo, editar, arquivar, reordenar; saldo e histórico conciliados |
| Extrato | Receita, despesa, transferência, pendente/pago, filtros, paginação, mês, edição e exclusão/estorno |
| Cartões | Cadastro, limite, fechamento/vencimento, compra parcelada, pagamento parcial/total/antecipado e histórico |
| Planejamento | Criar, guardar/pagar, competência, copiar se disponível, previsão de renda e vínculo com fatura |
| Investimentos | Criar, comprar, vender, rendimento, preço médio, taxas, histórico e vínculo com meta |
| Metas | Monetária/numérica, prazo, progresso, depósitos, checklist, compra e exclusão com estorno |
| Hábitos | Frequência diária/semanal, marcar/desmarcar, calendário, meta vinculada e virada de dia |
| Resumo anual | Ano anterior/atual, total investido versus atual, notas, totais e relação com extrato |
| Configurações | Perfil, senha, tema, privacidade, preferências, exportação e erros de download |
| Onboarding | Rascunho, etapas condicionais, revisão, finalização, retry e conta legada após implementação |

Todo bug visual derivado precisa de: ID, URL/tela, versão, viewport, tema, fixture, passos, esperado/atual, captura e requests relevantes. Não marcar “validado” só porque a classe CSS foi alterada.

## Destino e preservação

Confirmado pelo usuário: backend no Railway (desligado), frontend na Vercel. Não foi confirmado se há dados reais; padrão de trabalho é preservá-los. Identificar serviços/projetos, branch, domínio e banco antes de reativar ou migrar. Não registrar credenciais na documentação.

Pré-publicação:

1. Verificar schema e backup existente; restaurar cópia isolada e testar migrações sobre essa cópia.
2. Homologar backend com PostgreSQL separado, configurações de e-mail/cotação sem comunicação real e fuso definido.
3. Configurar BACKEND_API_URL apenas no servidor Next, JWT/banco/serviços apenas no backend, CORS para origens exatas. Validar nomes contra os arquivos da aplicação.
4. Executar suites e matriz com fixtures; revisar isolamento por usuário e relatórios de abertura.
5. Publicar versão identificável em homologação; testar registrar → entrevista → operação financeira → extrato → logout/login.
6. Só promover com backup, plano de reversão e critérios acima atendidos. Migração incompatível exige estratégia de expansão/contração; voltar binário não desfaz schema automaticamente.
7. Após promoção verificar HTTPS, autenticação, persistência após reload, readiness, erro de backend e exportação. Registrar versão, horário e resultado sem dados pessoais.

## Pendências para liberação

Onboarding não implementado; integridade de abertura/relatórios não validada; migrações ausentes; suites financeiras e E2E ausentes; auditoria visual pendente. Essas lacunas impedem declarar a aplicação pronta para uso diário com dados reais.

## Revisão do lote de calendário

Mudanças restritas a helpers e seus consumidores, sem dependências novas, payloads ou schema alterados. Helpers têm custo O(1); navegação usa atualização funcional de estado e preserva o valor anterior. Timestamps de histórico não foram convertidos. Testes de calendário adicionados ao CI; o resultado remoto do CI ainda não foi executado.

Fontes técnicas consultadas para semântica de calendário e rotas: [MDN Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) e [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers). A evidência principal do lote são os testes locais e a compilação do código instalado.
