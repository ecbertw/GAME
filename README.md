# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

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

---

# EIXO V2.4.0 — JUMP Premium Art 2026

**Data:** 24/09/2026  
**Tipo:** JUMP / direção visual / personagem / VFX / ambientes

## 1. ALTERADO

- Os quatro ambientes JUMP foram substituídos por arte premium criada especificamente para o novo target visual: **CITY, FOREST, DESERT e SNOW**.
- Os novos fundos deixam de ser simples construções geométricas do canvas e passam a usar arte pixel detalhada com iluminação, profundidade atmosférica e sensação 2.5D.
- As plataformas foram redesenhadas com espessura, bevel, sombra, materiais próprios de cada ambiente e detalhes luminosos sem alterar a respetiva física/colisão.
- O runner foi totalmente redesenhado: cabeça e rosto mais legíveis, olhos claros, proporções corrigidas, melhor separação de volumes, rim light e shading 2.5D.
- O visual mantém a personalização de cabelo, casaco, detalhes, calças e sapatilhas, incluindo cores VIP.

## 2. ADICIONADO

- Runtime `jump15-art.js` para descodificar os novos fundos premium empacotados e usá-los diretamente no canvas.
- Assets dedicados em `assets/jump15/` para os quatro ambientes.
- Nova camada atmosférica por ambiente, mantendo animação subtil sem destruir a leitura do cenário.
- VFX VIP refeitos para acompanhar o novo personagem: glow, halo, mist, comet, frost, ember, plasma, cosmic e prismatic passam a ficar próximos do corpo e a usar transparência/iluminação mais natural.

## 3. BUGS FIXED

- **FIXED:** rosto do runner deixa de parecer desfocado/sem olhos na escala normal do jogo.
- **FIXED:** pés, corpo e roupa deixam de parecer blocos planos sem profundidade.
- **FIXED:** efeitos VIP deixam de parecer objetos soltos a orbitar o personagem.
- **FIXED:** plataformas mantêm leitura de gameplay mesmo sobre fundos muito mais detalhados.

## 4. VALIDAÇÃO

- A física e as hitboxes permanecem independentes do novo desenho visual.
- Os fundos premium têm fallback seguro caso a API de descompressão do browser não esteja disponível.
- O deploy continua manual através de `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
