# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V2.3.2 — Deploy autoatualizável

**Data:** 24/09/2026  
**Tipo:** Deploy / manutenção / robustez

## 1. ALTERADO

- O script de deploy passa a detetar quando o próprio `eixo-deploy.sh` foi alterado pelo `git pull`.
- Quando isso acontece, o deploy reinicia automaticamente uma única vez com a versão acabada de descarregar.

## 2. BUGS FIXED

- **FIXED:** um deploy iniciado com uma versão antiga do script podia continuar a executar as instruções antigas mesmo depois de o `git pull` substituir o ficheiro no disco.
- **FIXED:** alterações futuras ao próprio script de deploy passam a ter efeito no mesmo deploy, sem exigir uma execução manual adicional.

## 3. VALIDAÇÃO

- O reinício usa a variável `EIXO_DEPLOY_REEXEC` para impedir loops.
- Se não houver atualização do commit, o deploy continua normalmente sem reiniciar.
- O deploy continua manual através de `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.

---

# EIXO V2.3.1 — Correção do deploy após remoção de DUO/TRIO

**Data:** 24/09/2026  
**Tipo:** Deploy / manutenção / regressão

## 1. ALTERADO

- O script de deploy deixou de tentar validar o ficheiro retirado `jump-team-server.js`.
- O teste de exposição do deploy deixou de procurar o módulo antigo como ficheiro privado existente.

## 2. BUGS FIXED

- **FIXED:** o deploy parava na fase **[3/5] Syntax** com `MODULE_NOT_FOUND` porque o script ainda referenciava `/opt/eixo/jump-team-server.js` depois da remoção definitiva de DUO/TRIO.
- **FIXED:** o fluxo de deploy volta a conseguir avançar para os testes, restart e health checks da versão atual.

## 3. VALIDAÇÃO

- O módulo antigo continua removido do repositório.
- O script de deploy passa a validar apenas os ficheiros que existem na versão atual.
- O deploy continua manual através de `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
