# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V2.7.1 — interface, passwords e ONLINE mais fluido

**Data:** 25/09/2026
**Tipo:** interface / autenticação / JUMP ONLINE

- O menu para marcar pixels tem agora um botão FECHAR no canto superior direito, traduzido nos idiomas suportados.
- A pré-visualização da personagem JUMP foi reenquadrada para mostrar a cabeça e o corpo completos, incluindo os efeitos.
- Novas palavras-passe aceitam um mínimo de 6 caracteres e exigem pelo menos uma letra maiúscula; a regra é validada no formulário e no servidor.
- O matchmaking ONLINE volta a preencher a instância ocupada com mais jogadores quando uma instância anteriormente cheia reabre, evitando fragmentação em salas quase vazias.
- Jogadores remotos usam velocidade entre snapshots e uma previsão curta e limitada, reduzindo travagens, atraso visual e movimento aos solavancos.
- Changelog, cache do cliente e testes de regressão atualizados.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.

---

# EIXO V2.7.0 — JUMP: efeitos aéreos contínuos e três mapas

**Data:** 25/09/2026
**Tipo:** JUMP / efeitos / mapas / matchmaking

- Os efeitos dos sapatos acompanham toda a subida, o ponto mais alto e a descida do salto.
- O rasto aéreo é leve, móvel e mais duradouro, com reforços breves no impulso e na aterragem.
- CITY, FOREST e SNOW são os três ambientes disponíveis em SOLO, salas privadas e ONLINE.
- O quarto ambiente foi removido da interface, rotação automática, áudio, renderização, ficheiros de arte e testes.
- Salas antigas que o utilizavam são migradas para FOREST durante a atualização da base de dados.
- Física, colisões, progressão e pontuação mantêm as regras existentes.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
