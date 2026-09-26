# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V2.8.1 — área total e arcade modernizado

**Data:** 26/09/2026
**Estado:** validado localmente, pronto para integração e deploy

- Página inicial ocupa sempre toda a altura do ecrã, sem expor o mural de píxeis abaixo do rodapé em monitores grandes.
- JUMP e PULSE recebem uma apresentação arcade própria, com cabeçalho, moldura e cor de identidade para cada jogo.
- Área de jogo ampliada com proporções preservadas; chat e ranking continuam na lateral em computador.
- Passport com personagem original, personalizações existentes e prévia de conquistas em badges.
- Navegação suspende jogos fora das páginas de jogo e rankings não iniciam partidas.
- Arte, física, paletas e efeitos existentes preservados. EXP, níveis e atribuição de badges continuam por implementar.
- Acesso ao mural de píxeis preservado; loja VIP pede login aos visitantes; Passport atualiza a personagem após guardar.
- 69 testes aprovados, incluindo carregamento HTTP das sete páginas e bloqueio dos ficheiros privados.
- 10 verificações de integração com PostgreSQL embebido (PGlite), conta fictícia, login, cores por letra, guarda-roupa, chat, salas e recordes aprovadas.
- Revisão visual autenticada e adaptação móvel concluídas. Fluxo de pagamentos existente preservado; nenhuma transação efetuada.

---

# EIXO V2.7.2 — sincronização ONLINE de posição e pose

**Data:** 25/09/2026
**Tipo:** JUMP ONLINE / sincronização / animação remota

- Posição, velocidade horizontal e vertical, estado no ar/chão, direção e movimento são agora enviados no mesmo snapshot.
- O servidor retransmite a pose ligada à posição mais recente, impedindo personagens no ar de aparecerem agachadas ou a correr com uma pose antiga.
- Coordenadas remotas preservam décimas de pixel para evitar saltos causados pelo arredondamento a pixels inteiros.
- A suavização usa a velocidade real do outro jogador e uma previsão curta limitada entre snapshots.
- O fallback do servidor continua ativo quando um snapshot do cliente fica antigo, sem alterar a validação da pontuação.
- Cache do cliente e testes de regressão atualizados; 60 testes aprovados.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
