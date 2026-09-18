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


# EIXO V1.1.9 — Controlo de saída e abandono de salas

**Data:** 18/09/2026  
**Tipo:** Correção funcional

## 1. ALTERADO
- Os botões **SAIR DA SALA** e **ABANDONAR SALA** passaram a ser tratados diretamente pelo módulo de salas.

## 2. REMOVIDO
- Handlers duplicados dos botões de sala em `enhancements.js`, evitando conflitos entre implementações.

## 3. ADICIONADO
- **SAIR DA SALA:** fecha a visualização da sala sem remover o jogador.
- **ABANDONAR SALA:** abre a confirmação e, em **SIM**, remove o jogador da sala através da API.
- Após abandonar, a lista **AS MINHAS SALAS** é atualizada.

## 4. BUGS FIXED
- **FIXED:** Os botões da sala podiam não responder porque os handlers estavam numa camada diferente da implementação atual da entrada nas salas.
- **FIXED:** Potencial conflito provocado por handlers duplicados.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.10 — Estilo da confirmação de abandono

**Data:** 18/09/2026  
**Tipo:** Correção visual

## 1. ALTERADO
- O botão **NÃO** da confirmação de abandono passou a usar o estilo visual escuro dos restantes botões do EIXO.

## 2. REMOVIDO
- Fundo claro que fazia o texto branco do botão **NÃO** ficar praticamente ilegível.

## 3. ADICIONADO
- Fundo escuro, borda e texto contrastante.
- Estado hover consistente com os restantes botões.

## 4. BUGS FIXED
- **FIXED:** Texto **NÃO** ficava branco sobre fundo claro no pop-up de abandono.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.11 — Submenu VIP

**Data:** 18/09/2026  
**Tipo:** Organização de interface / funcionalidade

## 1. ALTERADO
- A opção **VIP** no menu do jogador passa a controlar explicitamente o seu submenu.
- O estado aberto/fechado do submenu fica sincronizado com `aria-expanded`.

## 2. REMOVIDO
- Comportamento ambíguo do estado do submenu ao fechar o menu principal.

## 3. ADICIONADO
- **COMPRAR VIP** → abre o pop-up de compra do VIP.
- **PERSONALIZAR NOME VIP** → abre o pop-up de personalização quando a conta tem VIP.
- Estilo próprio e hover para as duas opções do submenu.

## 4. BUGS FIXED
- **FIXED:** Estado do submenu VIP podia ficar aberto depois de o menu principal ser fechado.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.12 — Submenu do botão VIP

**Data:** 18/09/2026  
**Tipo:** Correção de interface

## 1. ALTERADO
- O submenu VIP foi retirado do **menu do jogador** e passou para o botão **VIP** independente no topo.

## 2. REMOVIDO
- Submenu VIP associado ao menu do jogador.

## 3. ADICIONADO
- Ao carregar no botão **VIP** do topo abre um submenu próprio com:
  - **COMPRAR VIP**
  - **PERSONALIZAR NOME VIP**
- **COMPRAR VIP** abre o pop-up de compra.
- **PERSONALIZAR NOME VIP** abre a personalização para contas com VIP.

## 4. BUGS FIXED
- **FIXED:** O submenu estava a ser implementado no menu do jogador em vez de estar associado ao botão VIP independente.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.13 — Persistência de conta no browser

**Data:** 18/09/2026  
**Tipo:** Correção de conta / persistência

## 1. ALTERADO
- A conta criada no browser deixa de ser apagada quando o código frontend muda de versão.
- `eixo_player` e `eixo_country` passam a permanecer no armazenamento local do browser.

## 2. REMOVIDO
- Reset automático de conta provocado pela alteração da versão do frontend.

## 3. ADICIONADO
- Persistência da sessão local para que fechar e voltar a abrir a página mantenha o mesmo jogador.

## 4. BUGS FIXED
- **FIXED:** Ao fechar e reabrir a página, o browser podia voltar ao onboarding e permitir criar uma segunda conta.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.

## 6. NOTA
- A conta local continua a ser validada pelo servidor através do token. Se o servidor tiver eliminado a conta, será necessário novo registo; esta versão elimina o reset local causado apenas por alterações de frontend.


# EIXO V1.1.12b — Menu VIP no topo

**Data:** 18/09/2026  
**Tipo:** Correção visual / menu

## 1. ALTERADO
- O submenu do botão VIP no topo passa a ficar oculto por defeito e só é mostrado quando o botão VIP é carregado.
- O submenu foi redimensionado para mobile e desktop.

## 2. REMOVIDO
- Aspeto branco, arredondado e desproporcional causado por estilos de botão não compatíveis com o visual do EIXO.

## 3. ADICIONADO
- Fundo escuro, borda ciano, tipografia pixel e hover coerente com o botão VIP.
- Cache-busting do CSS para garantir que o browser recebe os estilos atuais.

## 4. BUGS FIXED
- **FIXED:** Submenu VIP aparecia visualmente aberto no mobile.
- **FIXED:** Opções do submenu apareciam enormes e com fundo branco.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.13 — Personalização normal e VIP separadas

**Data:** 18/09/2026  
**Tipo:** Correção funcional / interface

## 1. ALTERADO
- **PERSONALIZAR NOME** no menu do jogador volta a abrir a janela normal de personalização.
- **PERSONALIZAR NOME VIP** no submenu VIP continua a abrir exclusivamente a janela de personalização VIP.

## 2. REMOVIDO
- Redirecionamento automático de jogadores VIP da personalização normal para a personalização VIP.

## 3. ADICIONADO
- Separação explícita entre os dois fluxos de personalização.
- As permissões da personalização normal continuam a ser calculadas pela posição no ranking.

## 4. BUGS FIXED
- **FIXED:** Um jogador com VIP que escolhesse **PERSONALIZAR NOME** recebia indevidamente o pop-up **PERSONALIZAR NOME VIP**.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.14 — Personalização normal do jogador

**Data:** 18/09/2026  
**Tipo:** Correção funcional

## 1. ALTERADO
- O botão **PERSONALIZAR NOME** do menu do jogador passa a enviar sempre o evento específico da personalização normal.

## 2. REMOVIDO
- Dependência direta da função global para abrir a personalização a partir do menu do jogador.

## 3. ADICIONADO
- Encaminhamento dedicado para a janela `customizeModal` através do evento já tratado pela camada de personalização.
- Cache-busting do `ui.js` para garantir que o browser recebe a versão atual.

## 4. BUGS FIXED
- **FIXED:** Ao carregar em **PERSONALIZAR NOME** no menu do jogador, a janela podia não abrir apesar de a conta ter uma posição elegível no ranking.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.15 — Personalização normal e legibilidade VIP

**Data:** 18/09/2026  
**Tipo:** Correção funcional / visual

## 1. ALTERADO
- **PERSONALIZAR NOME** no menu do jogador passa a abrir diretamente a janela normal de personalização.
- As opções do submenu VIP no topo foram aumentadas para leitura adequada, sobretudo em ecrãs pequenos.

## 2. REMOVIDO
- Dependência do fluxo de evento como único mecanismo para abrir a personalização normal.

## 3. ADICIONADO
- Abertura direta de `customizeModal` através de `window.eixoOpenCustomize` quando a função está disponível.
- Tamanho de letra e área de clique maiores no submenu VIP.

## 4. BUGS FIXED
- **FIXED:** **PERSONALIZAR NOME** podia não abrir a janela normal.
- **FIXED:** Opções do submenu VIP estavam demasiado pequenas para leitura confortável.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.16 — Nova personalização normal

**Data:** 18/09/2026  
**Tipo:** Reconstrução funcional / interface

## 1. ALTERADO
- A antiga janela de **PERSONALIZAR NOME** foi removida da página.
- O botão **PERSONALIZAR NOME** do menu do jogador passa a usar uma nova janela independente.

## 2. REMOVIDO
- Dependência da antiga `customizeModal`.
- Ligações entre a personalização normal e a janela VIP.

## 3. ADICIONADO
- Nova janela `playerCustomizeModal`, criada exclusivamente para a personalização normal.
- Verificação direta da posição mundial e nacional através de `/api/player-rank`.
- Permissões reconstruídas para TOP 1/2/3 mundial e TOP 1/2/3 nacional.
- Cores e efeitos correspondentes às permissões existentes.
- TOP 1 mundial mantém acesso ao nome visual, incluindo Arco-Íris.
- Guardar continua a usar `/api/profile/customize`, pelo que as validações finais continuam no servidor.

## 4. BUGS FIXED
- **FIXED:** O botão **PERSONALIZAR NOME** podia não abrir qualquer janela.
- **FIXED:** A personalização normal podia ficar ligada acidentalmente ao fluxo VIP.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.17 — Personalização: cores e RGB

**Data:** 18/09/2026  
**Tipo:** Correção visual

## 1. ALTERADO
- Removida a frase interna sobre o nome oficial não mudar.
- Os códigos HEX das cores deixaram de ser apresentados ao jogador; passam a aparecer nomes como **BRANCO**, **VERMELHO**, **AZUL**, etc.

## 2. REMOVIDO
- Informação técnica desnecessária na janela de personalização.
- Exibição direta de códigos HEX nas opções de cor.

## 3. ADICIONADO
- Nome legível para cada cor disponível.
- Tratamento RGB reforçado para a janela de personalização e para os nomes nos rankings.
- O modo **ARCO-ÍRIS** usa animação RGB contínua em vez de uma cor fixa.

## 4. BUGS FIXED
- **FIXED:** A opção Arco-Íris podia acabar apresentada como uma cor fixa no ranking.
- **FIXED:** A pré-visualização RGB não tinha o mesmo tratamento robusto do ranking.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.18 — RGB, efeitos e tags de ranking

**Data:** 18/09/2026  
**Tipo:** Correção visual / regras de ranking

## 1. ALTERADO
- O RGB passa a avançar de letra em letra, com atraso progressivo entre letras.
- A cor escolhida para o nome normal passa a ser aplicada corretamente no ranking.
- O ranking mundial passou a aplicar a regra específica das tags nacionais.

## 2. REMOVIDO
- Animação RGB sincronizada para o nome inteiro.
- Regras CSS genéricas que faziam efeitos como **TREME** poderem afetar a caixa inteira.
- Códigos HEX apresentados nas opções de cor da personalização normal.

## 3. ADICIONADO
- Efeitos normais adicionais: **Torção, Cintila e Estica**.
- Validação do servidor alinhada com os efeitos disponibilizados na personalização normal.
- No ranking mundial, **GLOBAL 1/2/3** aparece apenas nos três primeiros; a tag nacional só aparece quando o jogador está fora do TOP 3 mundial e é TOP 3 do país.
- No ranking nacional, é apresentada a tag nacional correspondente.

## 4. BUGS FIXED
- **FIXED:** RGB ficava com uma cor fixa ou mudava no nome inteiro ao mesmo tempo.
- **FIXED:** efeitos podiam animar a BOX em vez de apenas o nome.
- **FIXED:** algumas combinações de cor + efeito podiam ser rejeitadas pelo servidor apesar de aparecerem na interface.
- **FIXED:** nome guardado com cor selecionada podia aparecer cinzento no ranking.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.19 — Efeitos letra a letra

**Data:** 18/09/2026  
**Tipo:** Correção de animações

## 1. ALTERADO
- Os nomes normais no ranking passam a ser construídos com **uma letra por elemento**, tal como no sistema VIP.
- Os efeitos normais passam a poder animar cada letra de forma independente.
- A pré-visualização mantém a mesma estrutura letra a letra.

## 2. REMOVIDO
- O tratamento que colocava o nome inteiro dentro de um único elemento `name-letter`.

## 3. ADICIONADO
- Separação automática de nomes antigos que ainda estejam guardados/renderizados como uma única letra-elemento.
- Atrasos individuais dos efeitos passam a funcionar sobre cada letra do nome.

## 4. BUGS FIXED
- **FIXED:** **SALTA**, **TREME**, **PULSA**, etc. podiam animar o nome inteiro ao mesmo tempo.
- **FIXED:** nomes renderizados anteriormente como um único `name-letter` não recebiam animação independente por letra.
- **FIXED:** a estrutura dos nomes normais passa a seguir o mesmo princípio de letras independentes usado na personalização VIP.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.


# EIXO V1.1.20 — RGB contínuo e pré-visualização de efeitos

**Data:** 18/09/2026  
**Tipo:** Correção de personalização

## 1. ALTERADO
- O **ARCO-ÍRIS** passa a estar disponível também para uma conta VIP quando essa conta é TOP 1 mundial.
- O RGB passa a percorrer continuamente as letras da esquerda para a direita, sem reiniciar ao chegar ao vermelho.
- A animação RGB deixa de controlar a propriedade `animation` das letras, permitindo que o efeito escolhido continue a funcionar em paralelo.

## 2. REMOVIDO
- Restrição que impedia TOP 1 mundial com VIP de guardar Arco-Íris.
- Implementação RGB que podia substituir a animação do efeito selecionado.

## 3. ADICIONADO
- Camada explícita de efeitos e RGB carregada pela página.
- Pré-visualização normal preparada para apresentar os efeitos letra a letra.
- Pré-visualização VIP mantém os efeitos individuais definidos para cada letra.

## 4. BUGS FIXED
- **FIXED:** TOP 1 mundial + VIP não conseguia usar Arco-Íris.
- **FIXED:** RGB parava/recomeçava ao atingir a zona vermelha em vez de manter um fluxo contínuo.
- **FIXED:** RGB podia substituir a animação do efeito escolhido.
- **FIXED:** Efeitos podiam não aparecer corretamente na pré-visualização normal e VIP.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS
- Nenhuma sugestão de jogador identificada/documentada nesta atualização.
