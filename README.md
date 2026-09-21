# EIXO — Changelog

# EIXO V2.0.0 — Sistema oficial de contas e autenticação

**Data:** 21/09/2026  
**Tipo:** Arquitetura / contas / segurança / base de dados

## 1. ALTERADO

- O EIXO deixa de usar o sistema provisório de jogador baseado em **nome + país + token guardado no navegador**.
- O acesso ao jogo passa a utilizar contas com **email, palavra-passe, nome de jogador e país**.
- As sessões passam a ser geridas pelo servidor através de cookie **HttpOnly + Secure + SameSite**, sem guardar o identificador secreto da sessão em localStorage.
- O PostgreSQL passa a suportar a estrutura definitiva de contas, sessões e recuperação de palavra-passe.
- Os jogadores de teste antigos foram removidos na passagem para a nova arquitetura.

## 2. REMOVIDO

- Removida a janela inicial obrigatória que pedia primeiro o **país** e depois o **nome** antes de jogar.
- Removido o fluxo antigo de criação de jogador através de `/api/players`.
- Removida a dependência do token de autenticação provisório como credencial persistente no navegador.

## 3. ADICIONADO

- Criação de conta.
- Login.
- Logout.
- Sessões persistentes no servidor.
- Recuperação de palavra-passe com tokens de uso único e validade limitada.
- Rate limiting para tentativas de login.
- Proteção de origem para pedidos que alteram dados.
- Hashing de palavras-passe com **scrypt** e salt aleatório.
- Novas tabelas PostgreSQL:
  - `accounts`
  - `sessions`
  - `password_reset_tokens`
- Perfil de jogador ligado diretamente à conta através de `account_id`.
- Compatibilidade temporária com os restantes módulos do jogo através da sessão HttpOnly, sem expor o segredo da sessão ao JavaScript.

## 4. BUGS FIXED

- **FIXED:** O jogador dependia de dados guardados no navegador para manter a autenticação.
- **FIXED:** O primeiro acesso obrigava o utilizador a passar por um fluxo de onboarding separado do sistema de contas.
- **FIXED:** O endpoint antigo de criação de jogadores deixou de fazer parte do fluxo oficial.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS

- Simplificação do primeiro acesso: o jogador passa diretamente para **Entrar** ou **Criar conta**, em vez de receber duas janelas obrigatórias para escolher país e nome.

## 6. REGRA DE PRODUÇÃO

- A sessão autenticada não é guardada em localStorage nem sessionStorage.
- O sistema de recuperação de palavra-passe já possui a estrutura segura de tokens, mas o envio real por email fica dependente da configuração de um fornecedor SMTP/email antes de ser ativado em produção.

---

# EIXO V1.1.29 — Som dos pixels flutuantes

**Data:** 21/09/2026  
**Tipo:** Melhoria visual / interação / áudio

## 1. ALTERADO

- Aumentado novamente o número máximo de pixels do fundo.
- Mantido o campo de interação do cursor em **80px**.
- Mantido o deslocamento permanente dos pixels após serem afastados pelo cursor.
- Mantido o movimento suave através de velocidade e desaceleração progressiva.

## 2. REMOVIDO

- Nenhum.

## 3. ADICIONADO

- Densidade máxima aumentada de **2000 para 2500 pixels**.
- Novo efeito sonoro curto e satisfatório para quando o cursor toca diretamente num pixel flutuante.
- O novo som utiliza o canal de volume **JOGO**, mantendo-se separado da música.
- Proteção contra repetição excessiva do som quando vários pixels estão próximos do cursor.

## 4. BUGS FIXED

- **FIXED:** A densidade máxima dos pixels ainda estava abaixo do novo objetivo.
- **FIXED:** Os pixels podiam gerar interações sonoras repetidas enquanto permaneciam debaixo do cursor.

## 5. SUGESTÕES DE JOGADORES IMPLEMENTADAS

- Adicionada interação sonora dos pixels flutuantes para tornar o movimento do cursor mais satisfatório.

## 6. REGRA DE PRODUÇÃO

- O novo efeito sonoro é apenas visual/interativo e não altera pontuação, rankings, contas ou dados persistentes.
