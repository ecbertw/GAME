# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

# EIXO V3.1.0 — interface contemporânea e carregamento estável

**Data:** 27/09/2026
**Estado:** validado localmente, pronto para deploy

- Redesenha a página inicial, a área VIP, o Passport e os diálogos de personalização, guarda-roupa, conta e administração com uma linguagem mais moderna, maior escala e melhor hierarquia.
- Reduz a tipografia pixel aos elementos onde reforça a identidade dos jogos e mantém intactas todas as cores, efeitos e opções já desbloqueadas.
- Alarga o conteúdo nos ecrãs grandes, melhora a adaptação a portátil e telemóvel e dá mais presença ao hero, cartões, badges e personagem.
- Elimina o aparecimento momentâneo da interface antiga durante uma atualização através de um ecrã de arranque consistente.
- O Passport deixa de mostrar o boneco antigo enquanto carrega; apresenta um estado neutro até o renderer e o equipamento atual estarem prontos.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
---

# EIXO V3.0.4 — locomoção biomecânica e capa física

**Data:** 27/09/2026
**Estado:** validado localmente, pronto para deploy

- Reconstrói a locomoção com contacto, absorção, apoio, propulsão, recuperação e fase aérea; os braços compensam as pernas e o tronco acompanha a rotação.
- Arranque e paragem usam transições com inércia. O salto coordena anca, tronco, cabeça e membros, e a aterragem absorve o impacto antes de regressar ao repouso.
- A capa usa uma simulação leve com ponto fixo no ombro, gravidade, arrasto, amortecimento e atraso vertical. Cai em repouso e conserva volume durante corrida e salto.
- Retira o cachecol e a bolsa de explorador do guarda-roupa. Equipamentos antigos são convertidos automaticamente para a capa.
- Mantém as cores, efeitos, física e pontuação existentes. 97 testes aprovados e poses verificadas no browser nos dois sentidos.
- Deploy: `sudo bash /opt/eixo/ops/deploy/eixo-deploy.sh`.
