# Avaliação de transliteração local para japonês

## Objetivo

Reduzir a dependência do Microsoft IME nos campos de nomes japoneses sem criar
backend, usar CDN ou enviar nomes de clientes para terceiros. Para nomes
estrangeiros, o problema principal é **transliteração fonética para katakana**,
e não tradução de significado.

## Restrições do projeto

- funcionamento integralmente offline;
- bibliotecas e modelos armazenados no próprio repositório;
- nenhuma telemetria ou chamada de rede;
- preservação de nomes e demais dados pessoais no navegador;
- resultado sempre revisável antes de preencher o campo japonês;
- suporte a abertura direta de `index.html`, sem servidor ou processo de build.

## Alternativas avaliadas

### 1. WanaKana empacotado localmente — base recomendada

O WanaKana converte romaji em hiragana/katakana e pode ser carregado no navegador
como um arquivo JavaScript local. É pequeno, não precisa de backend e também
oferece associação direta a campos de texto.

Limitação: ele interpreta romanização japonesa (como `yamada` → `ヤマダ`), não a
ortografia e a pronúncia do português brasileiro. Nomes como `João`, `Gonçalves`
ou `Gerônimo` exigem normalização fonética anterior e podem ter mais de uma
representação aceitável.

### 2. Kuroshiro + Kuromoji — não indicado para este caso

Essas ferramentas analisam texto que **já está em japonês**, obtêm leituras de
kanji e convertem japonês entre kana e romaji. O dicionário do Kuromoji também
aumenta bastante o pacote. Elas não convertem com qualidade nomes portugueses
em katakana e, portanto, não substituem o IME neste fluxo.

### 3. Serviço de tradução externo — rejeitado

APIs de tradução ou modelos hospedados poderiam melhorar alguns casos, mas
enviariam nomes pessoais pela rede, dependeriam de credenciais e quebrariam o
requisito offline. Não são compatíveis com a arquitetura do Noshigami.

### 4. Conversor próprio PT-BR → katakana — útil como camada assistiva

Um módulo local pode normalizar acentos, separar sílabas e aplicar regras
específicas, antes de usar uma tabela romaji → katakana. Essa abordagem mantém
a privacidade, mas não deve preencher o nome silenciosamente: sobrenomes,
regionalismos e preferências familiares não têm uma única resposta correta.

## Proposta em partes

### Parte A — prova de conceito (implementada)

1. Adicionar uma cópia versionada do WanaKana em `vendor/`, com licença.
2. Criar um módulo próprio e testável para normalização fonética PT-BR.
3. Exibir ao lado de cada nome japonês um botão **Sugerir katakana**.
4. Mostrar a sugestão antes de aplicá-la; nunca substituir automaticamente o
   conteúdo digitado.
5. Garantir que o recurso não faça requisições externas.

### Parte B — vocabulário e revisão

1. Criar testes com nomes reais anonimizados e exemplos aprovados pela equipe.
2. Manter um pequeno dicionário local de exceções e sobrenomes recorrentes.
3. Permitir editar a sugestão e registrar somente o valor final no histórico.
4. Identificar visualmente o resultado como **sugestão fonética**.

### Parte C — validação para produção

1. Revisão dos exemplos por pessoa fluente em japonês.
2. Testes offline abrindo `index.html` diretamente.
3. Testes de caracteres longos, espaços, hífens, acentos e nomes compostos.
4. Verificação de que PDF, DOCX, TXT e histórico recebem exatamente o texto
   confirmado pelo usuário.

## Critérios de aceite sugeridos

- nenhuma chamada de rede durante entrada ou conversão;
- sugestão gerada em menos de 100 ms para nomes comuns;
- entrada original nunca apagada sem ação explícita;
- botão de desfazer ou edição livre após aplicar;
- aviso permanente de revisão humana;
- licença e versão da biblioteca registradas no repositório;
- conjunto de testes aprovado pela equipe japonesa.

## Decisão

É tecnicamente viável reduzir a dependência do Windows com um transliterador
local assistivo. A opção recomendada é **WanaKana local + camada fonética PT-BR +
dicionário de exceções**, entregue em um lote separado da Ajuda. Não se recomenda
chamar o recurso de “tradutor automático” nem remover a revisão humana.

## Estado da implementação

A Parte A foi incorporada com WanaKana 5.3.1, uma camada fonética PT-BR isolada
em `katakana-transliterator.js` e botões de sugestão nos dois campos de nomes.
O resultado só é aplicado após confirmação e pode ser editado livremente. As
Partes B e C continuam necessárias antes da aprovação humana para produção.

### Nomes de origem japonesa

Cada palavra do nome é classificada antes da conversão. Palavras que formam
romanização Hepburn válida (Watanabe, Chiba, Shigeru, Iwamoto) são convertidas
direto pelo WanaKana, sem a camada fonética PT-BR — antes, `w` virava `u`,
`ch` virava `sh` e `ge` virava `je` (ウアタナベ, シバ, シジェル). Palavras com
acento português, letras fora do Hepburn (l, v, c, x) ou listadas em
`NOMES_PORTUGUESES` (Regina, Rocha, Machado) seguem a camada PT-BR.
Sobrenomes frequentes grafados sem vogal longa (Sato, Ito, Oshiro) usam o
dicionário `LEITURAS_JAPONESAS` (サトウ, イトウ, オオシロ).

Quando o nome tem origem japonesa, a confirmação da sugestão orienta o
vendedor a perguntar se a família usa kanji (山田家): nesse caso o kanji deve
ser digitado com o IME e a sugestão em katakana não deve ser aplicada.

## Referências consultadas em 4 de outubro de 2026

- WanaKana: <https://github.com/WaniKani/WanaKana>
- Kuroshiro: <https://github.com/hexenq/kuroshiro>
- Kuromoji.js: <https://github.com/takuyaa/kuromoji.js>
