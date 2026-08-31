# Cofre Digital — Bella Renda

Backend do sorteio (Fase 2). Endpoints:

- `POST /api/sortear` — body: `{ "nome": "...", "whatsapp": "..." }`
  → retorna `{ senha, linkWhatsapp }`
- `POST /api/verificar` — body: `{ "senha": "123456" }`
  → retorna `{ resultado: "GANHOU" | "PERDEU", premio }`

## Colocar no ar (passo a passo)

1. **Suba este projeto pro GitHub** (crie um repositório novo e envie estes arquivos).
2. **Importe o repositório na Vercel** (vercel.com → Add New → Project → selecione o repo).
3. Antes de clicar em Deploy, abra **Environment Variables** e cadastre:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — o `client_email` do seu arquivo JSON.
   - `GOOGLE_PRIVATE_KEY` — o `private_key` do arquivo JSON (cole com aspas e os `\n` como estão no arquivo).
   - `GOOGLE_SHEET_ID` — o ID da planilha (pedaço da URL entre `/d/` e `/edit`).
   - `URL_DO_COFRE` — pode deixar em branco por enquanto; depois do primeiro deploy você pega a URL gerada pela Vercel e volta aqui pra preencher.
4. Clique em **Deploy**.
5. Teste com o comando abaixo (troque a URL pela sua):

```bash
curl -X POST https://SEU-SITE.vercel.app/api/sortear \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria Teste","whatsapp":"62999990000"}'
```

Se retornar uma senha e um link de WhatsApp, o backend está funcionando.

## Rodando localmente (opcional, antes de subir pra Vercel)

```bash
npm install
cp .env.example .env.local   # depois edite com suas credenciais reais
npm run dev
```

## Próxima fase

Fase 3: a tela visual do cofre em React (animação de abrir, som de fogos de
artifício, som de decepção, exibição do prêmio) consumindo o endpoint
`/api/verificar`.
