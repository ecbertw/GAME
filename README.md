# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V3.0.1 — Astral, personagem e contacto corrigidos

**Data:** 26/09/2026
**Estado:** validado localmente, pronto para deploy

- Apenas o Santuário Astral fica ativo no JUMP, incluindo partidas públicas e grupos de amigos. Os restantes mapas ficam desativados e os seus recursos deixam de ser carregados.
- Remove do arranque os antigos pacotes de imagens e os objetos que já não são usados.
- Corrige o carregamento do manifesto da personagem no servidor real. O jogo usa as partes da arte aprovada e aguarda por elas antes de iniciar a partida.
- Personagem de 42 píxeis lógicos, com proporções da referência, botas assentes na superfície e animação de corrida a cerca de duas passadas completas por segundo.
- Velocidade horizontal reduzida de 272 para 216, com as distâncias e movimentos das plataformas ajustados para manter os saltos alcançáveis.
- Chão e plataformas usam recortes explícitos e a linha física de contacto, removendo margens vazias e fragmentos soltos dos módulos.
- Configuração visual separada em jump-art-layout.js; luzes, bandeiras, cascatas e cristais animados em jump-scenery.js, presos às coordenadas do cenário.
- Paleta original de linho, cobre e couro disponível para todos; cores e efeitos já equipados mantêm-se.
- PULSE começa a 1,65 rad/s e progride até 3,8 rad/s aos 100 pontos; iluminação, cascatas de luz e estrelas animadas. Pontuação acima do separador.
- 90 testes aprovados, incluindo acesso real ao manifesto, correspondência entre desenho e colisão, matchmaking Astral e 76 800 saltos simulados. Páginas reais JUMP e PULSE verificadas no browser.
- Corrige uma repetição infinita na tradução de rankings vazios que podia bloquear o carregamento da página.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.

---

# EIXO V3.0.0 — novos JUMP, PULSE e Passport

**Data:** 26/09/2026
**Estado:** validado localmente, pronto para deploy

- JUMP passa a existir apenas online, com instâncias públicas até 20 jogadores.
- Lobbies permitem juntar até cinco amigos e colocam o grupo inteiro na mesma instância sem exceder a capacidade.
- O jogo usa uma área lógica 16:9 de 960 × 540 e um boneco articulado pequeno, com pernas, braços e capa reativos ao movimento.
- Quatro mapas: Jardins do Céu, Aquedutos do Sol, Observatório de Gelo e Santuário Astral.
- Fundos, chão, plataformas, bandeiras, luzes, vegetação, cristais, colecionáveis e partes do boneco são módulos independentes.
- PULSE foi transformado num jogo orbital de precisão, com alvo dourado, inversão de direção, streak e validação de resultados no servidor.
- Passport atribui EXP em partidas validadas, calcula níveis e mostra badges reais: Primeiros 100, Nas Alturas e Explorador.
- Guarda-roupa mantém todas as cores e efeitos existentes e acrescenta acessórios independentes: capa, cachecol e bolsa.
- Chat e ranking permanecem na lateral das páginas de jogo; a área central usa melhor o espaço disponível.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
