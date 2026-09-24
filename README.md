# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

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

---

# EIXO V2.3.2 — Deploy autoatualizável

**Data:** 24/09/2026  
**Tipo:** Deploy / manutenção / robustez

## 1. ALTERADO

- O script de deploy passa a detetar quando o próprio `eixo-deploy.sh` foi alterado pelo `git pull`.
- Quando isso acontece, o deploy reinicia automaticamente uma única vez com a versão acabada de descarregar.

## 2. BUGS FIXED

- **FIXED:** um deploy iniciado com uma versão antiga do script podia continuar a executar as instruções antigas mesmo depois de o `git pull` substituir o ficheiro no disco.
- **FIXED:** alterações futuras ao próprio script de deploy passam a ter efeito no mesmo deploy, sem exigir uma execução manual adicional.

## 3. VALIDAÇÃO

- O reinício usa a variável `EIXO_DEPLOY_REEXEC` para impedir loops.
- Se não houver atualização do commit, o deploy continua normalmente sem reiniciar.
- O deploy continua manual através de `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
