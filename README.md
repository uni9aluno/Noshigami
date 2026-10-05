# Noshigami Designer

Aplicação web offline da Tenman-ya para preencher, visualizar, exportar e imprimir Noshigamis.

## Privacidade e funcionamento

O Noshigami Designer é uma aplicação estática: não possui backend, login,
telemetria ou CDN. Os dados digitados permanecem no navegador e são usados
apenas para atualizar a pré-visualização e gerar os arquivos solicitados pelo
usuário. O projeto pode ser aberto sem internet.

## Requisitos

- Navegador moderno (Chrome ou Edge recomendado para os testes automatizados).
- Node.js apenas para executar a suíte de testes; não é necessário para usar o
  aplicativo.
- Para exportação Word, o arquivo `vendor/jszip.min.js` e o template embutido
  em `assets/modelo-docx.js` devem permanecer presentes.

## Como abrir

Abra `index.html` em um navegador moderno. O projeto não requer instalação, servidor, internet ou backend.

## Fluxo de uso

A página é organizada em três etapas contínuas, sem navegação entre telas:

1. **Dados do Noshigami:** preencha os três campos obrigatórios, confira o
   período sincronizado e prepare os nomes em japonês.
2. **Revisão do modelo:** edite a mensagem, confira os indicadores e ajuste os
   textos diretamente na pré-visualização.
3. **Finalização:** confirme que os nomes japoneses e a prévia foram revisados
   com o cliente; essa confirmação libera PDF, Word e impressões.

Os estados das etapas são atualizados imediatamente. Alterar qualquer nome em
português ou japonês cancela a confirmação anterior para evitar que um arquivo
seja produzido com uma leitura ainda não revisada.

## Ajuda integrada

A janela de ajuda é exibida em toda abertura da página e descreve cada campo,
controle, saída e atalho. Depois de fechada, pode ser aberta novamente pelo
botão de ajuda no cabeçalho ou pela tecla `F1`.

## Entrada em japonês

Os campos aceitam texto japonês digitado ou colado. O botão **Sugerir katakana**
gera localmente uma aproximação fonética a partir do nome em português e pede
confirmação antes de preencher o campo. Nenhum nome é enviado pela rede.

O Microsoft IME continua sendo uma alternativa de entrada. Em ambos os casos,
revise nomes próprios manualmente com uma pessoa fluente em japonês.

A avaliação e a arquitetura do transliterador incorporado estão em
[`docs/tradutor-local.md`](docs/tradutor-local.md). A recomendação é implementar
as regras em etapas e manter confirmação humana antes de substituir o campo
japonês.

## Impressão

- **Imprimir Noshigami:** papel personalizado de 36,5 × 16 cm.
- **Imprimir Aprovação e Termo:** A3 paisagem, com o Noshigami em tamanho real e o termo abaixo.

No diálogo de impressão, use escala 100% e desative cabeçalhos e rodapés.

## Exportação Word

O arquivo `Noshigami Okaeshi - Edicao.docx` é o template oficial. O script `tools/generate-docx-template.ps1` gera a cópia embutida utilizada pelo navegador. Execute-o novamente sempre que o template oficial for atualizado.

## Testes

Com Node.js disponível e `jszip` instalado no ambiente:

```powershell
node tests/run-tests.js
node tests/browser-smoke.js
```

Os testes validam períodos, migração do histórico, controles da interface, funcionamento sem recursos externos, preenchimento do DOCX, caracteres japoneses e dimensões das impressões. O teste de navegador reutiliza o Chrome ou Edge já instalado e não baixa outro navegador.

Antes de alterar a lógica, execute também as verificações de sintaxe:

```powershell
node --check script.js
node --check docx-export.js
```

## Publicação

O repositório oficial é `https://github.com/uni9aluno/Noshigami`. Como o
aplicativo é estático, uma publicação compatível deve servir a raiz do
repositório sem processo de build; `index.html` é a entrada. O GitHub Pages
ou qualquer servidor de arquivos estáticos pode ser usado, desde que os
arquivos e diretórios do projeto sejam publicados juntos.

Para publicar uma alteração validada no repositório remoto:

```powershell
git add README.md
git commit -m "docs: documenta uso e publicação do Noshigami"
git push origin main
```

Não inclua dados de clientes, arquivos exportados ou credenciais no commit.
