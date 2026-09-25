# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V2.7.0 — JUMP: efeitos aéreos contínuos e três mapas

**Data:** 25/09/2026
**Tipo:** JUMP / efeitos / mapas / matchmaking

- Os efeitos dos sapatos acompanham agora toda a subida, o ponto mais alto e a descida do salto.
- O rasto aéreo é leve, móvel e mais duradouro, com reforços breves no impulso e na aterragem.
- CITY, FOREST e SNOW são os três ambientes disponíveis em SOLO, salas privadas e ONLINE.
- O quarto ambiente foi removido da interface, rotação automática, áudio, renderização, ficheiros de arte e testes.
- Salas antigas que o utilizavam são migradas para FOREST durante a atualização da base de dados.
- Física, colisões, progressão e pontuação mantêm as regras existentes.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.

---

# EIXO V2.6.1 — JUMP: corrida e efeitos ligados ao movimento

**Data:** 25/09/2026
**Tipo:** JUMP / ciclo de corrida / efeitos dos sapatos

- Corrida com tronco inclinado, poses de apoio e recuperação distintas, joelhos articulados e cadência ligada à distância percorrida.
- Efeitos dos sapatos refeitos com pequenas partículas, rastros curtos e emissões de salto/aterragem; dissipam-se ao parar e acompanham corretamente a câmara.
- Emissores independentes para jogador, preview e jogadores ONLINE. Reinícios e mudanças de efeito eliminam rastros antigos.
- Referências, decisões e comandos de teste em `docs/jump-animation.md`. Arte original reutilizada; física e APIs preservadas.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
