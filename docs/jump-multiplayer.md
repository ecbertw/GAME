# EIXO JUMP — arquitetura e regras de instâncias

**Estado:** especificação para implementação na branch `feature/jump`. Esta branch não é publicada automaticamente na VPS.

## Multiplayer: lotação máxima

- Cada instância JUMP suporta **até 5 jogadores em simultâneo, incluindo o próprio jogador**.
- Este é um limite **imposto pelo servidor**, não apenas uma limitação de quantos avatares o browser desenha. O servidor recusa o 6.º jogador na mesma instância.
- Existem quatro biomas: CITY, FOREST, DESERT e SNOW. **Cada bioma pode ter múltiplas instâncias independentes**, criadas conforme a procura. Não limitar o jogo inteiro a 20 jogadores.
- Ao clicar em JOIN SERVER, o jogador escolhe o bioma. O servidor procura uma instância desse bioma com vaga ou cria outra. Uma instância cheia deve mostrar 5/5 e não permitir entradas adicionais.
- Jogadores numa instância só recebem as posições e eventos dos outros jogadores dessa mesma instância e do mesmo bioma. Não há colisões entre avatares; plataformas e física são individuais.
- Nas salas privadas JUMP, a capacidade máxima é também 5. As regras/limites existentes das salas PULSE mantêm-se inalterados.
- Desligar, sair da instância ou expirar uma ligação liberta a vaga. Reentradas breves devem ser tratadas para não duplicar o jogador. O número mostrado é de participantes efetivamente ligados.
- Cada instância partilha uma seed e configuração de geração de plataformas para que os jogadores vejam o mesmo mapa. Cada participante tem a sua câmara vertical, pontuação e estado de jogo.
- Não enviar atualizações de jogadores de biomas/instâncias diferentes. Não escrever a posição de cada frame na base de dados. Utilizar frequência de rede moderada (a calibrar com testes reais), interpolação de avatares remotos e limitar payloads.
- O jogo individual funciona sem entrar em instância multiplayer. O servidor é a autoridade para lotação, identidade, resultados e validações anti-abuso.
- Rankings WORLD/COUNTRY do JUMP usam dados separados dos rankings PULSE e não misturam pontuações; as quatro instâncias/biomas contribuem para o mesmo ranking JUMP.
- O botão EAT mantém-se apenas como futuro jogo, sem alterar a lógica JUMP/PULSE.

## Critérios de aceitação

1. Uma instância com cinco jogadores recusa uma sexta entrada sem afetar quem já joga.
2. O sexto jogador pode entrar numa **nova instância do mesmo bioma** automaticamente.
3. Não se veem jogadores de outras instâncias nem de outros biomas.
4. Quando alguém sai, a vaga fica disponível; a contagem regressa a 4/5.
5. Salas e ranking do PULSE preservam o comportamento atual.
6. No modo individual, não é necessária qualquer ligação multiplayer.
