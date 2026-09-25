# JUMP — SOLO e ONLINE (jump14)

## Modos atuais

**SOLO:** o jogador entra sozinho num dos três ambientes JUMP. A câmara, progressão, derrota e pontuação são individuais.

**ONLINE:** existe uma única ação **JOGAR ONLINE**. O jogador não escolhe o mapa. O servidor mantém uma instância pública ativa e coloca os novos jogadores nessa instância até atingir **20 jogadores**. Apenas quando a instância atual fica cheia é criada a seguinte, com um ambiente escolhido automaticamente entre CITY, FOREST e SNOW.

Todos os jogadores da mesma instância usam a mesma seed de plataformas e o mesmo relógio do mapa. Não existe colisão entre jogadores: cada pessoa mantém a sua física, câmara, progressão e derrota. As posições remotas são interpoladas no cliente para reduzir movimentos aos saltos sem alterar a validação de pontuação.

SOLO e ONLINE usam o mesmo ranking individual JUMP.

## Remoção do antigo modo de equipas

Os antigos modos DUO e TRIO foram retirados do produto. O frontend deixou de apresentar criação de equipas, convites, READY, correntes e rankings de equipa. Os endpoints `/api/jump/teams/*` e o módulo `jump-team-server.js` foram removidos.

Durante a migração, as tabelas antigas `jump_team_members`, `jump_team_scores` e `jump_teams` são eliminadas para impedir que equipas ou rankings antigos reapareçam depois de um deploy/restart.

## Implementação

- `jump-server.js`: SOLO, salas privadas e matchmaking público de 20 jogadores.
- `jump.js`: renderização local, interpolação dos jogadores ONLINE, ranking individual e personalização do runner.
- `jump-physics.js`: física, dificuldade, plataformas móveis e frágeis.
- `jump-worlds.js`: CITY, FOREST e SNOW.
- `audio-fix.js`: volumes independentes para música do site, efeitos do jogo e música do mapa.

A instância ONLINE vive no processo Node atual. Reiniciar o serviço termina partidas públicas em curso; os rankings já gravados permanecem em PostgreSQL.

## Publicação

O deploy continua manual:

`sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`

Os testes automáticos validam física, capacidade de 20 jogadores, agrupamento sequencial no ONLINE, cosméticos, rankings e segurança.
