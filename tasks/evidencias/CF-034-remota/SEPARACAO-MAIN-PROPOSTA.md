# Decisão pendente: integrar a main executando somente CI

Proposta preparada em 26/10/2026; **não aplicada**. O pedido inicial permite
integrar após os gates, mas proíbe alterar infraestrutura de produção e exige
explicar previamente qualquer acoplamento com deploy. A PR #1 está aberta e
não tem auto-merge. O CI obrigatório de c926aaa passou no run40327234898.

## Railway

Projeto controle-financeiro `19974952-914d-4072-9140-e62e5ed23c31`, ambiente
production `73f7324a-a15f-4940-b2dc-d5bcb5510441`, serviço backend
`f4ad9689-58ed-4112-8bb2-2cfe4af24483`.

Em Settings → Source, a UI mostra main e “Auto deploys when pushed to GitHub”,
com botão **Disable**. A ação proposta é usar esse controle, conservando a
conexão do repositório, branch, imagem, domínio e serviços no estado atual.
Não usar Disconnect, Deploy Latest Commit ou aceitar patch de deploy.
Confirmar depois o botão Enable, nenhum deployment novo e nenhuma operação
pendente. [Controle documentado](https://docs.railway.com/deployments/github-autodeploys).

## Vercel

Projeto `prj_OdfwpJWp3wv8ZgfpcjVEBscrj03r`, equipe kaiquedev, root
controle-financeiro-frontend. Alteração exata proposta no vercel.json:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "codex/cf034-ci-local": false,
      "main": false
    }
  }
}
```

Publicar essa alteração na própria branch, validar novamente o candidato final
e somente então integrar. O bloqueio de main deve impedir o deployment Git da
integração, mantendo a publicação existente FkfL25jbyrt6FdD5Di5wqoLH9iHm servida.
Não promover deployment nem modificar proteção de previews ou variáveis.
[Configuração documentada](https://vercel.com/docs/project-configuration/git-configuration).

## Alcance, custo e reversão

O ganho é permitir integração e CI sem nova aplicação publicada. O custo é que
futuras mudanças da main também ficarão sem autodeploy até nova decisão. Reativar
os controles exige decisão própria sobre a revisão que poderá ser publicada;
isso não faz parte desta proposta.

Somente ligar Wait for CI ou Deployment Checks permitiria publicação depois do
verde e não atende ao recorte desta etapa. A alternativa executável sem nova
autorização é manter a PR aberta, com main272001f preservada.

O DDL_AUTO=update observado no Railway deve ser revisto antes de uma release
autorizada e alinhado ao contrato validate após os gates próprios de migração.
Essa mudança, banco real, migração, secrets, réplicas e regiões não estão incluídos
na proposta de separação. Nenhum ajuste de produção foi executado nesta rodada.
