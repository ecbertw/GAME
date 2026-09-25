# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V2.6.1 — JUMP: corrida e efeitos ligados ao movimento

**Data:** 25/09/2026
**Tipo:** JUMP / nitidez / ciclo de corrida / efeitos dos sapatos

- DESERT: as plataformas 1–10 preservam a proporção dos recortes e usam desenho nítido sem sombra desfocada. Larguras, colisões e dificuldade mantêm-se.
- Corrida com tronco inclinado, poses de apoio e recuperação distintas, joelhos articulados e cadência ligada à distância percorrida.
- Efeitos dos sapatos refeitos com pequenas partículas, rastros curtos e emissões de salto/aterragem; dissipam-se ao parar e acompanham corretamente a câmara.
- Emissores independentes para jogador, preview e jogadores ONLINE. Reinícios e mudanças de efeito eliminam rastros antigos.
- 56 testes automáticos aprovados e verificações no navegador; pré-visualização animada cobre corrida, salto, inversão e paragem.
- Referências, decisões e comandos de teste em `docs/jump-animation.md`. Arte original reutilizada; física e APIs preservadas.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.

---

# EIXO V2.6.0 — JUMP: novo DESERT e animação de corrida

**Data:** 25/09/2026
**Tipo:** JUMP / cenário aprovado / animação / recortes / controlos

- Teclas alternativas e dedos são agora acompanhados individualmente: soltar uma entrada não cancela outra que continua premida.
- Perder o foco, ocultar o separador ou entrar num formulário liberta os controlos e solicita sincronização com o servidor.
- Abrir painéis, trocar de jogo e recomeçar limpa todas as entradas anteriores.
- Seis testes de comportamento cobrem as teclas suportadas, entradas simultâneas, cancelamento de toque e alterações de foco.
- DESERT usa a folha enviada pelo criador em 25/09: panorama, chão e quatro plataformas. O panorama mantém as proporções com enquadramento no sol e arco; legendas e quadriculado da folha não aparecem no jogo.
- Pernas articuladas alternam os passos e dobram o joelho na recuperação; personagem parada e poses de salto mantêm a arte aprovada.
- Recortes individuais das plataformas dos quatro ambientes excluem fragmentos vizinhos. As poses de salto excluem os restos dos pés da linha superior.
- A limpeza das silhuetas é feita uma vez por recorte e guardada em cache. Plataformas frágeis mantêm a indicação de desgaste, incluindo DESERT.
- Física, colisões, APIs e regras de pontuação preservadas. Cache do cliente atualizada.
- Validação: 48 testes automáticos e `tests/browser-renderer.cjs` no navegador, com inspeção visual dos quatro ambientes e das poses. O teste de navegador requer Playwright; `JUMP_BROWSER_CHANNEL=msedge` permite usar Edge instalado. As chamadas de API nesse teste usam respostas locais simuladas.
- Deploy manual após integração: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
