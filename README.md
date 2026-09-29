# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V3.2.0 — RUN / ASTRAL 01 — FIRST LIGHT

**Data:** 29/09/2026
**Estado:** validado por testes e checks de segurança, pronto para deploy

- Adiciona o **RUN** como jogo independente em `/run`, sem dependências da física, rig, multiplayer ou renderer do JUMP.
- Introduz controlo de platformer a 120 Hz com aceleração, travagem, skid, controlo aéreo, salto variável, coyote time, jump buffer, aterragem forte, morte e respawn rápido.
- Estreia **ASTRAL 01 — FIRST LIGHT**, com mundo 2.5D em parallax, personagem sprite 2D, 42 EIXO Shards, segredo, rotas alternativas, plataformas móveis e hazards.
- Adiciona timer por start/finish line, resultados, PB, rankings WORLD/COUNTRY, categoria 100%, **PB Echo** e **World Echo**.
- Os tempos competitivos são re-simulados no servidor a partir do replay de inputs e versionados por nível/engine; o browser não decide o tempo final.
- Adiciona **Daily Run** com reset UTC, PB/ranking diário e streak, e integra RUN no Passport/XP e badges do jogador.
- Mantém o JUMP intacto e adiciona o RUN à home/navegação sem apagar dados existentes.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.

---

# EIXO V3.1.0 — interface contemporânea e carregamento estável

**Data:** 27/09/2026
**Estado:** validado localmente, pronto para deploy

- Redesenha a página inicial, a área VIP, o Passport e os diálogos de personalização, guarda-roupa, conta e administração com uma linguagem mais moderna, maior escala e melhor hierarquia.
- Reduz a tipografia pixel aos elementos onde reforça a identidade dos jogos e mantém intactas todas as cores, efeitos e opções já desbloqueadas.
- Alarga o conteúdo nos ecrãs grandes, melhora a adaptação a portátil e telemóvel e dá mais presença ao hero, cartões, badges e personagem.
- Elimina o aparecimento momentâneo da interface antiga durante uma atualização através de um ecrã de arranque consistente.
- O Passport deixa de mostrar o boneco antigo enquanto carrega; apresenta um estado neutro até o renderer e o equipamento atual estarem prontos.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
