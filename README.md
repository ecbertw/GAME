# EIXO — Changelog

# EIXO V2.1.0 — Administração, moderação e perfis de conta

**Data:** 22/09/2026  
**Tipo:** Segurança / administração / moderação / perfis

## 1. ALTERADO

- O sistema VIP deixou de permitir compras/ativações de teste.
- O VIP fica indisponível para jogadores enquanto não existir um sistema de pagamentos real.
- A conta **Bala** existente é promovida a administrador no arranque da base de dados.
- O perfil de conta passa a permitir alterar nome, avatar e borda do avatar.
- Avatares e bordas passam a ser enviados no chat; jogadores VIP têm acesso a opções de borda adicionais.

## 2. REMOVIDO

- Removida a possibilidade de qualquer jogador ativar VIP através do endpoint de compra de teste.

## 3. ADICIONADO

- Cargo **ADMIN**, reservado à conta Bala.
- Cargo **MOD**, que apenas o administrador pode atribuir ou remover.
- TAG ADMIN/MOD junto do nome no chat e identificação na conta.
- Painel de administração nas definições da conta.
- Administração de níveis VIP (0–6) pelo administrador.
- Banimento permanente exclusivo do administrador.
- Banimento temporário até 24h para moderadores.
- Expulsão de sessão (kick) para administrador e moderadores.
- Proteções para impedir moderadores de agir sobre ADMIN ou outros MOD.
- Eliminação de mensagens do chat global/nacional exclusiva do administrador.
- Botões **DEFINIÇÕES** e **SAIR DA CONTA** na barra superior para utilizadores autenticados.
- Persistência PostgreSQL para cargo, borda de avatar e estado de banimento.

## 4. SEGURANÇA

- Todas as ações administrativas são validadas no servidor; esconder botões no frontend não concede permissões.
- Jogadores bloqueados deixam de conseguir restaurar a sessão e ficam impedidos de usar endpoints autenticados.
- Alterações VIP, MOD e banimentos não podem ser executadas por jogadores normais.

---

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
