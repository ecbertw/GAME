# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

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

---

# EIXO V2.3.0 — JUMP simplificado, ONLINE 20 e novos cosméticos VIP

**Data:** 23/09/2026  
**Tipo:** JUMP / multiplayer / cosméticos / interface / manutenção

## 1. ALTERADO

- O modo público JUMP passa a usar uma instância ativa com capacidade para **20 jogadores**.
- O matchmaking deixa de separar jogadores por mapa escolhido: o servidor mantém o lobby público atual e preenche-o antes de abrir a instância seguinte.
- O mapa da nova instância pública é escolhido automaticamente pelo servidor.
- O HUD ONLINE passa a apresentar a lotação real até **20/20**.
- Os efeitos cosméticos do runner foram redesenhados para ficarem mais próximos do corpo e menos artificiais.
- Os efeitos antigos de faíscas/eletricidade foram suavizados para deixarem de parecer objetos a orbitar o personagem.

## 2. REMOVIDO

- Removido o antigo sistema de equipas JUMP e toda a respetiva interface.
- Removidos os endpoints de equipa, o serviço dedicado e os testes associados ao sistema retirado.
- As tabelas antigas de equipas e respetivos rankings são eliminadas na migração do JUMP.
- Removida da janela **JOGAR ONLINE** a frase explicativa sobre o funcionamento interno do matchmaking.

## 3. ADICIONADO

- Nova cor **DOURADO** nas calças do runner, disponível a partir de VIP 1.
- Novos efeitos VIP: **CINTILAÇÃO, HALO, GELO, BRASAS, NÉVOA, RASTO** e **PRISMÁTICO**.
- Mantidos e refinados os efeitos **BRILHO SUAVE, AURA RESPIRANTE, FAÍSCAS SUAVES, ELETRICIDADE, PLASMA SUAVE** e **AURA CÓSMICA**.
- Testes de regressão para confirmar que 20 jogadores são agrupados sequencialmente na mesma instância pública antes da criação de outra.

## 4. BUGS FIXED

- **FIXED:** dois jogadores que entram consecutivamente em ONLINE deixam de ser distribuídos por instâncias diferentes enquanto o lobby público atual tiver espaço.
- **FIXED:** o JUMP deixa de carregar componentes, rankings e estado de funcionalidades retiradas.
- **FIXED:** cosméticos guardados continuam a ser validados pelo servidor segundo o nível VIP.

## 5. VALIDAÇÃO

- O fluxo ONLINE mantém física e derrota individuais, sem colisão entre jogadores.
- O servidor continua a validar progressão e pontuação; o aumento da lotação não transfere autoridade de score para o cliente.
- O deploy continua manual através de `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.

---
