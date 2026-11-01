# EnsinoaDist-ncia
EaD quer dizer Ensino a Distância: um ensino feito online, em que o aluno estuda pela internet, sem ter de ir a uma sala de aula.

# EaD — Ensino a Distância

Plataforma completa de ensino a distância, em português e com ecrãs responsivos.

| Parte | Tecnologia | Pasta |
|---|---|---|
| Base de dados | MySQL / MariaDB (XAMPP serve) | `database/` |
| API | Node.js + Express (JWT, bcrypt, multer) | `backend/` |
| Site (alunos + administração) | Next.js 14 + React 18, HTML/CSS/JavaScript | `web/` |
| Aplicação móvel (alunos) | React Native (Expo) | `mobile/` |

## Funcionalidades

**Alunos** — cadastro e login **pelo e-mail** · aulas em PDF e vídeo · player de vídeo-aulas com lista do curso, retoma onde parou, velocidade, aula seguinte automática e aulas concluídas · downloads · exercícios de escolha múltipla com correção automática (uma submissão por aula) · pontuações e média · alterar palavra-passe · **modo escuro**.

**Administração (só administrador)** — cadastro e login próprios (`/admin/registo`, `/admin/entrar`) · painel com estatísticas e gráfico · gerir aulas (envio de PDF/vídeo), exercícios e alunos · gerir administradores · alterar a própria palavra-passe · **modo escuro**.

## Como executar (Windows + XAMPP)

Inicie o **MySQL** no painel do XAMPP. Depois, em três terminais:

### 1. Backend
```powershell
cd backend
npm install
copy .env.example .env
```
No `.env`: deixe `DB_PASSWORD=` vazio (XAMPP) e preencha:
- `JWT_SECRET` — obrigatório, 32+ caracteres aleatórios. Gere com `npm run segredo`. A API **não arranca** com a chave de exemplo.
- `ADMIN_CODIGO` — código secreto (mín. 12 caracteres) que autoriza criar contas de administrador. Sem ele, o registo de administradores fica desativado.
- `DB_NAME=ead` é o nome da base de dados.
```powershell
npm run db:init     # cria a base "ead" e as tabelas
npm run seed        # cria aluno de demonstração e uma aula (só em desenvolvimento)
npm run dev         # API em http://localhost:4000
```

### 2. Site
```powershell
cd web
npm install
copy .env.local.example .env.local
npm run dev         # http://localhost:3000
```

### 3. App móvel
```powershell
cd mobile
npm install
npx expo install --fix
copy .env.example .env      # EXPO_PUBLIC_API_URL=http://<IP-do-computador>:4000
npx expo start
```

## Contas
**Administrador** — abra http://localhost:3000/admin/registo, preencha os dados e o `ADMIN_CODIGO` do `.env`. Depois entra em http://localhost:3000/admin/entrar. Palavra-passe: mín. 10 caracteres, com maiúsculas, minúsculas e números. Não há administrador nem palavra-passe por defeito. (Em alternativa, defina `SEED_ADMIN_EMAIL` e `SEED_ADMIN_SENHA` no `.env` antes de `npm run seed`.)

**Aluno de demonstração** (só em desenvolvimento): `aluno@ead.com` / `aluno123` em http://localhost:3000/entrar — apague-o ou altere a palavra-passe antes de publicar.

## Uma só base de dados
O projeto usa apenas a base definida em `DB_NAME` (por defeito `ead`). Se ficou uma base antiga (`elearning`, `db_elearning`…), apague-a:
```sql
DROP DATABASE elearning;
```
Atenção: o esquema mudou (cadastro por e-mail). Uma base criada com a versão anterior tem de ser recriada com `npm run db:init`.

## Rotas principais da API
```
POST /api/auth/registo | /api/auth/login                          (alunos, por e-mail)
POST /api/auth/admin/registo (precisa de ADMIN_CODIGO) | /api/auth/admin/login
GET  /api/auth/eu        PUT /api/auth/senha
GET  /api/aulas(/:id)    POST /api/aulas/:id/bilhete  →  GET /api/aulas/:id/ficheiro?b=<bilhete>(&download=1)
GET  /api/aulas/:id/exercicios      POST /api/aulas/:id/submeter
GET  /api/admin/resumo | /relatorio
CRUD /api/admin/aulas (multipart) · /exercicios · /utilizadores (administradores)
GET  /api/admin/alunos(/:id)   DELETE /api/admin/alunos/:id(/resultados/:aulaId)
```

## Segurança
- **Administração só para o administrador**: toda a API `/api/admin` e as páginas `/admin` exigem perfil de administrador, confirmado na base de dados em cada pedido (conta apagada, perfil alterado ou palavra-passe mudada = sessão inválida).
- **Registo de administrador protegido** por `ADMIN_CODIGO` (comparação em tempo constante e limite de tentativas).
- **Sessões**: JWT HS256 com emissor fixo; administração 2 h (guardada só no separador, fecha após 30 min sem uso); alunos 7 dias. Ao mudar a palavra-passe, as sessões antigas deixam de valer.
- **Ficheiros**: a sessão já não vai no endereço dos vídeos/PDFs. Usa-se um *bilhete* de 2 h, válido para uma só aula. Os envios são verificados pelo conteúdo (não só pela extensão).
- **Palavras-passe**: bcrypt (custo 12); alunos 8+ com letras e números; administradores 10+ com maiúsculas, minúsculas e números.
- **Força bruta**: bloqueio de 15 min após 5 falhas (por IP + conta), limite por IP, mensagem de erro igual para qualquer falha e tempo de resposta uniforme.
- **Cabeçalhos**: Helmet na API; no site, CSP (em produção), X-Frame-Options, HSTS, Referrer-Policy e Permissions-Policy. Só o site pode incorporar os PDFs/vídeos da API.
- Consultas SQL parametrizadas e corpo JSON limitado a 100 KB.
- Em produção: HTTPS, `NODE_ENV=production`, `CORS_ORIGIN` com o endereço do site e `TRUST_PROXY=1` atrás de proxy.

## Notas
- A resposta certa só é enviada ao aluno depois de submeter.
- O progresso das vídeo-aulas (onde parou, concluídas) fica guardado no navegador de cada aluno.
- Edite `web/app/painel/sobre/page.js` com o texto da sua instituição.
- Ainda não existe recuperação de palavra-passe por e-mail (exige um servidor SMTP); o administrador pode redefinir a palavra-passe de outros administradores em **Administradores**.
