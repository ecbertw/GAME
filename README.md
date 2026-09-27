# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V3.0.3 — salto e acessórios naturais

**Data:** 27/09/2026
**Estado:** validado localmente, pronto para deploy

- A capa fica caída quando a personagem está parada, abre durante a corrida e reage à subida, ao ponto mais alto e à descida do salto.
- Cachecol redesenhado com volta no pescoço, nó e duas pontas; bolsa de explorador redesenhada com alça, aba, fecho e movimento próprio.
- O salto passa a envolver ancas, tronco, cabeça, braços e pernas. A personagem estica na saída, recolhe as pernas no ar e prepara a aterragem sem o efeito de pernas de mola.
- Mantém todas as cores, efeitos e opções de personalização existentes.
- 94 testes aprovados e poses verificadas no browser em repouso, corrida, subida, ponto mais alto e descida.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
---

# EIXO V3.0.2 — braços da personagem corrigidos

**Data:** 27/09/2026
**Estado:** validado localmente, pronto para deploy

- Corrige a montagem dos braços: o braço visível encaixa no ombro da camisola; o braço distante passa atrás do tronco.
- Ombro, cotovelo e pulso usam pontos de articulação próprios, preservando a forma e o comprimento das mãos. Corrida com braços e pernas em movimentos opostos.
- Mantém a arte, as cores, a roupa, os acessórios, os efeitos e a física do jogo. Atualiza a versão dos recursos para o browser carregar a correção.
- 93 testes aprovados e poses verificadas no browser: repouso, corrida e salto, virado para ambos os lados.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
