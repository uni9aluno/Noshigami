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

1. Preencha os campos em português e japonês.
2. Selecione o período; as opções portuguesa e japonesa são sincronizadas.
3. Revise o título do falecido. A opção padrão `Sem parentesco - 亡` exibe apenas `亡`.
4. Edite, oculte ou restaure a mensagem em português.
5. Ajuste as posições arrastando os textos sobre a pré-visualização.
6. Salve em PNG, exporte para Word ou escolha um modo de impressão.

## Entrada em japonês

Os campos estão preparados para o Microsoft IME, mas o navegador não controla o modo do teclado. Ative o IME Japonês, digite a leitura japonesa e use `F7` para converter hiragana em katakana. Revise nomes próprios manualmente.

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
