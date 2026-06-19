# Conectar o BEP.ai ao NotebookLM (modo consulta)

O app pode usar o **NotebookLM** como motor de IA: cada "Gerar IA"/"Sugerir"
consulta um **projeto (notebook)** seu e preenche as seções do BEP a partir das
fontes (edital/EIR) que estão **dentro** desse notebook.

A ponte é embutida no dev server do Vite (rotas `/api/notebooklm/*`), então
**não há servidor separado** — `npm run dev` já sobe tudo.

## Setup (uma vez por máquina)

```bash
npm run setup
# = npm install
#   && pip install "notebooklm-py[browser]"     (CLI + Playwright)
#   && python -m playwright install chromium     (baixa o Chromium do login)
```

Requisitos: **Node** e **Python + pip** instalados. O `setup` já baixa o
Chromium que o login usa — sem ele o login dá `exit 1` ("The browser window was
closed during login") em máquinas novas. **O login é feito pelo app** (não
precisa rodar nada no terminal).

## Uso em aula

```bash
npm run dev              # abre em http://localhost:3000
```

No app (tudo pela tela):
1. Botão **"IA: DeepSeek"** (topo do editor) → troca para **NotebookLM**.
2. **Entrar com Google** → abre o Chromium para login (só na 1ª vez).
3. Escolhe o **projeto/notebook** na lista.
4. Em cada seção, clicar **"Gerar IA"** → consulta o notebook e preenche.

> A fonte (edital) precisa já estar adicionada **dentro** do notebook no
> NotebookLM. O app só pergunta; não envia arquivos.

Alternativas pelo terminal (funcionam em qualquer máquina, sem depender do PATH):

```bash
npm run notebooklm:login    # login pelo navegador
npm run notebooklm:check    # status da sessão
npm run notebooklm:logout   # limpa a sessão/cookies salvos
npm run notebooklm:doctor   # diagnóstico de auth/instalação
npm run notebooklm -- <cmd> # repassa qualquer comando ao CLI
```

> Esses scripts chamam `scripts/notebooklm.mjs`, um launcher Node que localiza o
> CLI automaticamente — testa `notebooklm`, depois `python -m notebooklm`,
> `py -m notebooklm` e `python3 -m notebooklm`. Por isso funcionam mesmo quando o
> `pip` instala o executável **fora do PATH** (comum no Windows).

## Observações

- **Só consulta**: a ponte usa apenas `notebooklm list` e `notebooklm ask`.
  Nunca gera podcasts/vídeos nem apaga nada.
- **Latência**: cada consulta leva ~5-20s (round-trip ao Google).
- **Auth por máquina/conta**: cada aluno faz login com a própria conta Google.
  Não é compartilhável.
- **Erro "CLI não encontrado"**: rode `npm run setup` (ou `pip install
  notebooklm-py`). Não é preciso ajustar o PATH — o launcher e o bridge do dev
  server localizam o CLI via `python -m notebooklm` automaticamente.
- A escolha de motor (DeepSeek/NotebookLM) e o notebook ficam salvos no
  navegador (localStorage).
