# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V3.0.4 — locomoção biomecânica e capa física

**Data:** 27/09/2026
**Estado:** validado localmente, pronto para deploy

- Reconstrói a locomoção com contacto, absorção, apoio, propulsão, recuperação e fase aérea; os braços compensam as pernas e o tronco acompanha a rotação.
- Arranque e paragem usam transições com inércia. O salto coordena anca, tronco, cabeça e membros, e a aterragem absorve o impacto antes de regressar ao repouso.
- A capa usa uma simulação leve com ponto fixo no ombro, gravidade, arrasto, amortecimento e atraso vertical. Cai em repouso e conserva volume durante corrida e salto.
- Retira o cachecol e a bolsa de explorador do guarda-roupa. Equipamentos antigos são convertidos automaticamente para a capa.
- Mantém as cores, efeitos, física e pontuação existentes. 97 testes aprovados e poses verificadas no browser nos dois sentidos.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
---

# EIXO V3.0.3 — salto e acessórios naturais

**Data:** 27/09/2026
**Estado:** validado localmente, pronto para deploy

- A capa fica caída quando a personagem está parada, abre durante a corrida e reage à subida, ao ponto mais alto e à descida do salto.
- Cachecol e bolsa receberam uma primeira revisão visual, substituída na versão seguinte pela remoção pedida.
- O salto passa a envolver ancas, tronco, cabeça, braços e pernas. A personagem estica na saída, recolhe as pernas no ar e prepara a aterragem.
- Mantém todas as cores, efeitos e opções de personalização existentes.
- 94 testes aprovados e poses verificadas no browser em repouso, corrida, subida, ponto mais alto e descida.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
