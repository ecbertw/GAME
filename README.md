# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

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

---

# EIXO V2.7.1 — interface, passwords e ONLINE mais fluido

**Data:** 25/09/2026
**Tipo:** interface / autenticação / JUMP ONLINE

- O menu para marcar pixels tem um botão FECHAR no canto superior direito, traduzido nos idiomas suportados.
- A pré-visualização da personagem JUMP foi reenquadrada para mostrar a cabeça e o corpo completos.
- Novas palavras-passe aceitam um mínimo de 6 caracteres e exigem pelo menos uma letra maiúscula.
- O matchmaking ONLINE volta a preencher a instância disponível com mais jogadores, evitando fragmentação.
- Jogadores remotos usam velocidade entre snapshots e uma previsão curta e limitada.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
