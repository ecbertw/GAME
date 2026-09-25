# JUMP — corrida, plataformas e efeitos dos sapatos

## Corrida

O ciclo usa contacto, compressão, impulso, recuperação com o calcanhar levantado e extensão para o próximo apoio. As pernas estão desfasadas meio ciclo. Existe uma fase de suspensão, sem dois pés apoiados simultaneamente; ao cruzarem-se horizontalmente, os pés ficam separados em altura.

`jump-motion.js` calcula o percurso dos tornozelos e os joelhos com dois segmentos. O renderer utiliza máscaras das pernas da arte existente e os troncos inclinados das poses de corrida aprovadas. Os sapatos mantêm os seus próprios recortes; não são rodados como se fossem prolongamentos das canelas. A cadência acompanha a distância horizontal percorrida. Premir contra uma parede ou estar parado numa plataforma móvel não ativa a corrida.

## Efeitos

Os efeitos são pequenos elementos desenhados no canvas, inspirados nas famílias da referência do criador: luz azul, ouro, gelo, brasas, névoa, cometa, prisma e cósmico. Não é desenhada uma imagem estática do tamanho da personagem.

- Emissão junto às solas, com frequência por distância percorrida.
- Pequenas emissões adicionais no impulso do salto e na aterragem.
- Partículas persistem em coordenadas do mundo; apenas o desenho aplica o deslocamento da câmara.
- Cada partícula vive 0,32–0,54 segundos, move-se e desvanece-se. Parado, o jogador não gera partículas novas.
- Rastros luminosos ligam apenas as emissões mais recentes, com extremidade transparente.
- Limite de 64 partículas por personagem; preview, jogador local e jogadores remotos têm estados separados.
- Reinício, teletransporte, mudança de efeito ou regresso de um separador suspenso limpa partículas antigas.

## Plataformas

Nas plataformas DESERT 1–10, a altura decorativa acompanha a largura segundo a proporção original de cada recorte. A interpolação e a sombra desfocada são desativadas nessas dez plataformas. A superfície visual continua alinhada com a colisão. O chão inicial e as plataformas posteriores mantêm as regras anteriores; não há alteração da física, pontuação ou dificuldade.

## Referências consultadas

- [AnimSchool — The Key Poses of a Run Cycle](https://blog.animschool.edu/2024/04/10/the-key-poses-of-a-run-cycle/): contacto, compressão, impulso, suspensão e clareza das silhuetas.
- [Rusty Animator — Run Cycle Step by Step](https://rustyanimator.com/run-cycle/): construção do ciclo por poses principais e passagem das pernas.
- [Godot 4.6 — 2D particle systems](https://docs.godotengine.org/en/4.6/tutorials/2d/particle_systems_2d.html): tempo de vida, emissões pontuais e independência entre partículas emitidas e movimento do emissor.

## Validação

`node --test tests/*.test.js` cobre proporções, apoio/recuperação, articulações, paragem, saltos, aterragens, reinícios e isolamento dos emissores, além dos testes existentes.

Com Playwright disponível, `node tests/browser-renderer.cjs` valida o renderer e os controlos na página real com APIs simuladas. `node tests/browser-motion.cjs` grava seis segundos de corrida, salto, inversão e paragem com nove efeitos; os resultados ficam em `tmp/jump-qa/`. Pode usar-se `JUMP_BROWSER_CHANNEL=msedge` para executar no Edge instalado.
