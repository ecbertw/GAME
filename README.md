# EIXO

Protótipo do jogo minimalista de reflexos em pixel art.

## Mecânica

- A bola percorre o eixo horizontal continuamente.
- **Centro pequeno:** +2 pontos.
- **Círculo exterior:** +1 ponto.
- Fora dos círculos: termina a tentativa e reinicia a zero.
- Controlos: toque no telemóvel, clique do rato, `Space` ou `Enter`.
- A velocidade aumenta gradualmente depois de cada acerto.

## Interface

A primeira versão reproduz a direção visual da referência: interface escura, bordas pixelizadas, tipografia arcade, botões coloridos e uma moldura de publicidade/pixel art à volta da área principal.

## Idiomas / países

O seletor no topo já permite alternar entre Portugal, Espanha, França, Reino Unido, Brasil, Alemanha e Itália. Nesta fase a tradução e os rankings são dados locais de demonstração.

## Próxima fase

Para transformar o protótipo num jogo realmente online, o próximo passo é ligar:

1. autenticação / nickname;
2. base de dados para pontuações;
3. ranking mundial e ranking por país em tempo real;
4. salas privadas;
5. proteção contra resultados falsificados;
6. área de publicidade com slots reais;
7. PWA para instalar no telemóvel.


# EIXO V1.1.1 — UI limpa e personalização nas salas

**Data:** 18/09/2026  
**Tipo:** Atualização funcional / correções de interface

## 1. ALTERADO

- Uniformização dos botões do site para apresentarem apenas texto.
- Mantidas apenas as setas de dropdown `▼` nos menus da barra superior, conforme a regra de interface definida para o EIXO.
- Área "As minhas salas" atualizada para respeitar a personalização visual do jogador.
- Ranking dentro das salas passou a suportar nome visual, cores individuais por letra e efeitos individuais por letra.
- Bandeira do país no ranking das salas passou a ser apresentada como bandeira real, em vez do código ISO.
- Nome visual VIP continua limitado a 16 caracteres.

## 2. REMOVIDO

- Símbolos decorativos de botões, incluindo setas de ação, cruzes de fecho e outros símbolos que apareciam junto ao texto.
- Código da lista de salas que ignorava a personalização individual das letras.
- Apresentação do país como código `PT` no ranking das salas.

## 3. ADICIONADO

- Camada global de limpeza de símbolos em botões, incluindo botões e conteúdos criados ou atualizados dinamicamente por JavaScript.
- Proteção para que a limpeza não afete as setas dropdown dos menus superiores.
- Renderização das letras personalizadas no ranking das salas usando `letterStyles`.
- Suporte de bandeira real no ranking das salas.

## 4. BUGS FIXED

- **FIXED:** Botões de onboarding continuavam a receber símbolos depois de a tradução/interface ser aplicada.
- **FIXED:** Personalização do nome não era aplicada corretamente dentro das salas.
- **FIXED:** Todas as letras podiam assumir a cor da primeira letra no ranking da sala.
- **FIXED:** Efeitos individuais não eram aplicados no ranking da sala.
- **FIXED:** País do jogador aparecia como `PT` em vez da bandeira.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS

- **Nenhuma sugestão de jogador identificada/documentada nesta atualização.**
- As alterações desta versão resultam de correções e requisitos definidos durante o desenvolvimento.

## 6. NOTA DE DESENVOLVIMENTO

A versão segue a regra de que os elementos visuais do EIXO devem permanecer minimalistas: **botões = texto**, enquanto os dropdowns da barra superior podem manter a indicação visual `▼`.
