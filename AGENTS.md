# Noshigami Designer

## Contexto essencial

- Aplicacao web estatica, offline e sem backend. Entradas: `index.html` e `script.js`; exportacao Word: `docx-export.js`.
- Nao adicione CDN, telemetria nem envio de dados. Dados pessoais devem permanecer no navegador.
- `Noshigami.pdf` e a referencia visual; `Noshigami Okaeshi - Edicao.docx` e o template Word oficial.
- `assets/modelo-docx.js` e gerado por `tools/generate-docx-template.ps1`; nao edite o Base64 manualmente.

## Fluxo de trabalho

- Antes de qualquer escrita, crie e valide um backup novo fora do repositorio, incluindo arquivos rastreados, nao rastreados e historico Git. Nunca sobrescreva ou apague backups.
- Para mudancas nao triviais, primeiro explore em modo somente leitura, defina escopo e criterios de aceite, e so entao edite.
- Trabalhe em incrementos pequenos e teste cada lote relevante. Nao refatore fora do escopo nem altere trabalho do usuario.
- Use a ferramenta minima necessaria. Prefira `rg`, buscas direcionadas e scripts existentes; nao varra nem releia arquivos grandes sem necessidade.
- Limite saidas de comandos e preserve apenas falhas, decisoes e resultados relevantes. Nao despeje logs brutos no contexto.

## Verificacao

- Execute `node --check script.js`, `node --check docx-export.js` e `node tests/run-tests.js` apos mudancas de logica.
- Execute `node tests/browser-smoke.js` quando houver suporte ao Playwright e mudancas de interface, impressao ou download.
- Alteracoes em PNG, impressao ou DOCX exigem teste funcional e inspecao visual do artefato final.
- Nao conclua com cortes, sobreposicoes, dimensoes incorretas, perda de caracteres japoneses ou dependencia externa.
- A aprovacao para producao e humana; apresente limitacoes e validacoes nao executadas com clareza.

## Economia de contexto

- Este arquivo e a sintese operacional de `guia-code-boas-praticas.md`; nao carregue o guia completo rotineiramente.
- Mantenha estas instrucoes curtas e universais. Procedimentos especializados devem ficar em scripts ou skills carregados sob demanda.
- Ao resumir uma sessao, preserve decisoes, arquivos alterados, comandos de teste, resultados e trabalho pendente; descarte logs repetitivos.
