# EIXO — Changelog

# EIXO V1.1.26 — Interação dos pixels com o cursor

**Data:** 19/09/2026  
**Tipo:** Melhoria visual / interação

## 1. ALTERADO

- Aumentado o número de pixels do fundo para tornar o quadriculado mais preenchido e consistente.
- Aumentado ligeiramente o raio de interação do cursor.
- Os pixels continuam a ser deslocados fisicamente pelo cursor e mantêm a nova posição depois de serem afastados.
- Mantido o movimento suave através de velocidade e desaceleração progressiva.

## 2. REMOVIDO

- Nenhum.

## 3. ADICIONADO

- Maior densidade de partículas no fundo.
- Raio de interação do cursor aumentado para **46px**.

## 4. BUGS FIXED

- **FIXED:** A área de interação do cursor podia parecer demasiado pequena.
- **FIXED:** O fundo tinha uma densidade de pixels inferior à pretendida.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS

- Nenhuma sugestão de jogador identificada/documentada nesta atualização.

## 6. REGRA DE PRODUÇÃO

- As alterações ao efeito visual dos pixels não devem afetar jogadores, rankings, contas ou dados persistentes.

---

# EIXO V1.1.25 — Efeitos VIP independentes por letra

**Data:** 18/09/2026  
**Tipo:** Correção de personalização VIP / animações

## 1. ALTERADO

- Os efeitos do nome VIP passam a respeitar a escolha feita **individualmente em cada letra**.
- A camada geral de efeitos deixa de substituir os efeitos específicos guardados nas letterStyles do VIP.
- A lista de efeitos VIP passa a ter suporte visual completo, incluindo **Faísca, Brilho, Glitch, Inclina, Pop e Scanline**.

## 2. REMOVIDO

- Aplicação automática do efeito da primeira letra a todas as letras de um nome VIP.
- Ausência de animação para os efeitos VIP adicionais.

## 3. ADICIONADO

- Identificação explícita de nomes VIP com estilos por letra no ranking, ranking completo e salas.
- 17 efeitos VIP suportados no frontend, alinhados com a validação existente do servidor.
- Atraso individual de animação por letra sem alterar a escolha de efeito de cada letra.

## 4. BUGS FIXED

- **FIXED:** Escolher **SALTA** na primeira letra fazia todas as restantes letras seguirem o mesmo efeito.
- **FIXED:** **FAÍSCA, BRILHO, GLITCH, INCLINA, POP e SCANLINE** não tinham animações implementadas no frontend.
- **FIXED:** Os efeitos VIP podiam ser removidos pelo processador genérico de efeitos ao atualizar o ranking.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS

- Nenhuma sugestão de jogador identificada/documentada nesta atualização.

## 6. REGRA DE PRODUÇÃO

- As personalizações VIP guardadas no servidor devem ser preservadas entre updates e deploys.
