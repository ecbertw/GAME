# EIXO — Changelog

> Este documento mantém **apenas os dois relatórios de atualização mais recentes**. Em cada nova atualização, o relatório mais antigo deve ser removido e o novo relatório colocado no topo.

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

---

# EIXO V2.9.0 — redesign dos jogos JUMP e PULSE

**Data:** 26/09/2026

- Página inicial ocupa toda a altura útil do ecrã.
- Primeira passagem visual pelos três cenários JUMP e pela arena PULSE.
- Área de jogo ampliada, com chat e ranking na lateral.
- Passport ganhou a prévia da personagem e o conceito visual de badges.
- Navegação passou a suspender jogos fora das páginas de jogo.
- Cores, efeitos e personalizações existentes foram preservados.
