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


# EIXO V1.1.2 — Ranking, salas e VIP

**Data:** 18/09/2026

## 1. ALTERADO
- Paginação com **ANTERIOR** e **SEGUINTE** dentro das caixas e em escala adequada.
- **SAIR** com o mesmo comportamento de hover dos botões das salas.
- Elementos de personalização VIP aumentados para melhor leitura.

## 2. REMOVIDO
- Bandeira do lado esquerdo do nome no ranking das salas.
- Falta de tags de posição/VIP no ranking das salas.

## 3. ADICIONADO
- Bandeira junto à pontuação no lado direito.
- Tags GLOBAL, país e VIP nas salas quando aplicáveis.
- Cores e efeitos individuais das letras nas salas.

## 4. BUGS FIXED
- **FIXED:** paginação desproporcional após remoção das setas.
- **FIXED:** hover ausente no botão **SAIR**.
- **FIXED:** bandeira no lado errado.
- **FIXED:** tags e personalização não eram preservadas no ranking das salas.
- **FIXED:** controlos VIP demasiado pequenos.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.3 — Dados de ranking nas salas

**Data:** 18/09/2026  
**Tipo:** Correção de dados / ranking

## 1. ALTERADO
- A API das salas passou a devolver também a posição mundial e nacional de cada jogador.

## 2. REMOVIDO
- Dependência de dados incompletos no frontend para determinar as tags do jogador dentro da sala.

## 3. ADICIONADO
- Dados `worldRank` e `countryRank` em cada jogador devolvido pelo ranking da sala.

## 4. BUGS FIXED
- **FIXED:** As tags GLOBAL e nacional não podiam aparecer corretamente na sala porque as respetivas posições não eram fornecidas pela API.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.4 — Correção de entrada nas salas e escala VIP

**Data:** 18/09/2026  
**Tipo:** Correção crítica / interface

## 1. ALTERADO
- Corrigida a chamada do renderizador do ranking ao entrar numa sala.
- Interface de personalização VIP aumentada de forma proporcional.

## 2. REMOVIDO
- Referência incorreta a uma função inexistente durante a entrada numa sala.
- Escala demasiado pequena dos controlos de letras VIP.

## 3. ADICIONADO
- Renderização correta do ranking imediatamente após entrar na sala.
- Maior legibilidade nos cabeçalhos, caracteres, seletores e pré-visualização VIP.

## 4. BUGS FIXED
- **FIXED:** Ao carregar em **ENTRAR NA SALA**, aparecia o erro `renderRoomPlayers is not defined`.
- **FIXED:** A personalização VIP continuava visualmente demasiado pequena.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.5 — Gestão de salas

**Data:** 18/09/2026  
**Tipo:** Nova funcionalidade / gestão de salas

## 1. ALTERADO
- O botão **SAIR DA SALA** passou a significar apenas sair da visualização da sala atual.
- O botão **SAIR** que aparecia em **AS MINHAS SALAS** foi removido.
- As ações da sala ativa foram reposicionadas para o lado direito.

## 2. REMOVIDO
- A ação de remoção da sala através do botão **SAIR DA SALA**.
- O botão pequeno **SAIR** dentro de **AS MINHAS SALAS**.

## 3. ADICIONADO
- Novo botão **ABANDONAR SALA** na sala ativa.
- Janela de confirmação antes de abandonar uma sala.
- Explicação de que abandonar remove o jogador da sala e faz com que ela deixe de aparecer em **AS MINHAS SALAS**.
- Nova operação de servidor `/api/rooms/abandon` separada da ação de sair da visualização.

## 4. BUGS FIXED
- **FIXED:** Não existia distinção entre sair da visualização e abandonar efetivamente uma sala.
- **FIXED:** O botão **SAIR DA SALA** estava demasiado centrado no painel.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.6 — Botão de entrada nas salas

**Data:** 18/09/2026  
**Tipo:** Correção de interface / funcionalidade

## 1. ALTERADO
- **AS MINHAS SALAS** voltou a apresentar o botão **ENTRAR NA SALA**.
- O botão permite abrir e visualizar a sala diretamente a partir da lista.

## 2. REMOVIDO
- Nenhum novo elemento removido nesta atualização.

## 3. ADICIONADO
- Ligação funcional entre o botão **ENTRAR NA SALA** e a visualização da sala.

## 4. BUGS FIXED
- **FIXED:** O botão **ENTRAR NA SALA** tinha desaparecido de **AS MINHAS SALAS**.
- **FIXED:** A lista de salas não tinha acesso à função que abre a sala ativa.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.7 — Contacto, sugestões e entrada nas salas

**Data:** 18/09/2026  
**Tipo:** Correção funcional / interface

## 1. ALTERADO
- **CONTACTO** e **SUGESTÕES** passaram a abrir janelas pop-up independentes.
- **SUGESTÕES** tem formulário próprio e envio identificado como sugestão.

## 2. REMOVIDO
- Comportamento anterior em que **SUGESTÕES** reutilizava e alterava a janela de **CONTACTO**.

## 3. ADICIONADO
- Pop-up dedicado a sugestões.
- Formulário e botão **ENVIAR SUGESTÃO**.
- Ligação funcional do botão **ENTRAR NA SALA** à função que abre a sala.

## 4. BUGS FIXED
- **FIXED:** CONTACTO e SUGESTÕES abriam a mesma janela.
- **FIXED:** **ENTRAR NA SALA** não executava qualquer ação porque a função de abertura não estava exposta corretamente ao botão da lista.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.8 — Entrada nas salas e sugestões

**Data:** 18/09/2026  
**Tipo:** Correção funcional

## 1. ALTERADO
- O botão **ENTRAR NA SALA** passou a executar diretamente a abertura e carregamento do ranking da sala através de `rooms.js`.
- A janela de sugestões deixou o campo de título vazio por defeito.

## 2. REMOVIDO
- Valor automático **SUGESTÃO** no campo de título.
- Dependência da camada antiga de entrada nas salas.

## 3. ADICIONADO
- Carregamento direto dos jogadores da sala selecionada.
- A sala ativa é apresentada no painel de salas por baixo dos rankings.

## 4. BUGS FIXED
- **FIXED:** **ENTRAR NA SALA** podia não executar porque dependia de uma função global criada noutra camada.
- **FIXED:** O título das sugestões aparecia preenchido automaticamente com **SUGESTÃO**.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.
