# JUMP — SOLO, ONLINE, DUO e TRIO (jump8)

## Como jogar

**SOLO:** jogas sozinho, com a tua câmara e pontuação individual.

**ONLINE:** escolhes CITY, FOREST, DESERT ou SNOW. Até cinco pessoas partilham uma instância com a mesma seed, plataformas e relógio de movimento. A sexta pessoa entra noutra instância do mesmo ambiente. Cada jogador tem câmara, progresso e derrota próprios. Se subires mais depressa, os jogadores abaixo saem do teu ecrã; se esperares, podem alcançar-te e reaparecer. Não há colisão entre jogadores nem derrota coletiva. As plataformas antigas são retiradas individualmente conforme o progresso, como no SOLO. SOLO e ONLINE continuam no ranking individual JUMP existente.

**DUO / TRIO:** são 2 / 3 jogadores no total. Cria uma equipa com nome e ambiente, copia o convite e partilha-o com os amigos. Os amigos escolhem DUO ou TRIO e aceitam o código. O convite dura 30 minutos. Todos confirmam ESTOU PRONTO depois de a formação estar completa; só o líder inicia. Cada nova entrada limpa as confirmações anteriores.

A corrente liga membros adjacentes e tem folga para permitir saltos. Acima de 110 unidades do mapa aplica tensão aos dois extremos, incluindo arrasto vertical. Cada membro mantém a sua câmara, mas a corrente obriga a coordenar a subida. Se um membro atingir o limite inferior do seu painel, toda a equipa perde. Sair termina a tentativa; perder contacto durante 10 segundos também. Comandos sem atualização param após 700 ms para evitar movimento preso. Abrir um painel não pausa os parceiros.

A equipa ganha **12 pontos por plataforma alcançada por todos**: o mínimo das melhores plataformas individuais. O servidor calcula a pontuação, a corrente e a derrota. Os clientes não podem enviar pontuações de equipa. DUO e TRIO têm quadros próprios abaixo do ranking individual e páginas de ranking completo. A mesma formação tem um único recorde por modo, independentemente da ordem dos jogadores ou do nome escolhido.

Depois de perder, VOLTAR À EQUIPA permite confirmar presença e tentar novamente. Se alguém sair, o líder passa ao primeiro membro restante e pode entrar um substituto. Uma nova formação tem um recorde separado.

## Implementação e dados

- `jump-worlds.js`: desenho pixel art original em canvas, com parallax, partículas e materiais de plataformas por ambiente. Não depende de imagens externas.
- `jump-server.js`: mantém as tabelas e endpoints individuais e privados existentes. Reserva lugares de instâncias sem operações assíncronas entre a escolha da instância e a entrada. As posições previstas do ONLINE são retransmitidas com limites de deslocação; a validação individual anterior mantém-se.
- `jump-team-server.js`: serviço de equipas independente, simulado no servidor até 60 passos/segundo. HTTP autenticado para lobby, comandos sequenciados e snapshots. Comandos atrasados de outra tentativa são recusados.
- `jump_team_scores`: única tabela nova; criação idempotente, sem apagar dados anteriores. Chave derivada do modo e IDs ordenados dos membros; atualização atómica apenas se o recorde melhorar. Resultado final imutável antes de qualquer saída. Falhas de gravação são sinalizadas e repetidas; impedem recomeçar até guardar.
- `/api/jump/teams/{create,join,ready,start,input,finish,leave}`: POST autenticado, com limites de frequência. `state`: GET autenticado. `rankings?mode=duo|trio&page=1`: GET público paginado.
- PULSE, contas, cosméticos e rankings anteriores não são substituídos. Nenhuma alteração às tabelas PULSE é introduzida.

As instâncias e lobbies vivem num único processo, como as instâncias ONLINE anteriores. Reiniciar o serviço termina tentativas em curso; recordes já gravados permanecem. Para vários processos/VPS será preciso distribuir a autoridade de cada sala e encaminhar pedidos para o processo correto. Esta versão não fornece esse encaminhamento. Um resultado ainda não gravado por indisponibilidade da base pode perder-se se o processo terminar antes da recuperação.

## Validação e publicação

`npm test` executa testes de física, guarda-roupa, isolamento, concorrência de lotação, convites, autorização de líder, corrente, derrota, idempotência e recuperação de gravação. A integração de navegador e PostgreSQL pode ser executada com `node tests/browser-jump.cjs` após instalar as dependências de teste indicadas no próprio ficheiro.

Backup: `backup/jump7-before-teams` aponta para `f36ab791847f6da48511fb33331c53e55bddf868`. Trabalho: `feature/jump-worlds-teams`. O deploy existente continua manual: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`. A nova tabela é criada automaticamente no arranque. A migração anterior de score_version é preservada e foi testada com registos existentes v2.
