# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

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

---

# EIXO V2.5.0 — JUMP: arte de referência integrada

**Data:** 24/09/2026  
**Tipo:** JUMP / imagens aprovadas / animação / quatro biomas

## 1. ALTERADO

- Os quatro fundos são agora imagens efetivas das referências aprovadas pelo criador, em vez dos anteriores mapas reduzidos para 120×68 píxeis.
- As plataformas passam a ser desenhadas a partir dos quatro atlas transparentes aprovados, mantendo largura, movimento, fragilidade e colisões definidos na física do jogo.
- A personagem utiliza as seis poses recortadas da folha de sprites fornecida, com seleção de pose por movimento, salto e queda, orientação esquerda/direita e tentativa de recoloração das opções de personalização.
- Os efeitos VIP utilizam o atlas visual fornecido, com escala, brilho e variação temporal; a animação original permanece como fallback em caso de erro de carregamento.

## 2. ADICIONADO

- `jump-exact-renderer.js` e dez assets reais, codificados em WebP dentro de scripts estáticos em `assets/jump-exact/`; não exigem CDN externa nem alteração à base de dados.
- Verificações automáticas de formato WebP, carregamento por ordem e integração com o motor em `tests/jump-exact-assets.test.js`.
- Validação sintática dos scripts gráficos durante o deploy.

## 3. GARANTIAS

- A física em `jump-physics.js`, as APIs e tabelas de contas, pontuações, rankings e pagamentos PayPal não são alteradas.
- A alteração está limitada à camada visual; se uma imagem não carregar, o JUMP mantém o renderer anterior.
- As referências originais são preservadas em composições WebP adaptadas ao tamanho do canvas; os atlas mantêm transparência.

## 4. DEPLOY

- Depois de integrar esta atualização em `main`, continuar a usar `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
