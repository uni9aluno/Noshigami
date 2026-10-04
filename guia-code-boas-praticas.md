# Guia de Boas Práticas 

## Qualidade, economia e consumo inteligente de tokens

Este guia consolida práticas para operar o claude ou codex Code em um projeto real, com foco em três eixos: qualidade do código entregue, economia de custo e consumo inteligente de tokens. As recomendações valem tanto para uso individual quanto para equipe.

## 1. Estrutura de base do projeto

### 1.1 claude ou codex.md

Arquivo na raiz do repositório, versionado junto com o código. Deve conter apenas o que é necessário em toda sessão: convenções de arquitetura, comandos de build e teste, decisões de estilo, regras de negócio recorrentes.

Regra prática: manter abaixo de 200 linhas. Esse arquivo é carregado inteiro no início de cada sessão, então cada linha ali é custo fixo repetido em toda chamada, mesmo em tarefas que não têm relação com o conteúdo.

Modelo mínimo:

```markdown
# Projeto X

## Arquitetura
Descrição curta da stack e dos módulos principais.

## Comandos
Build: comando exato
Teste: comando exato
Lint: comando exato

## Convenções
Estilo de commit, padrão de nomenclatura, o que nunca deve ser alterado sem aprovação.

# Compact instructions
Ao compactar, preserve trechos de código e decisões de arquitetura; descarte saída de log bruta.
```

A seção de instruções de compactação no próprio claude ou codex.md direciona o que o claude ou codex deve preservar quando a sessão for resumida automaticamente ou via /compact.

### 1.2 Skills em vez de instruções pesadas no claude ou codex.md

Instruções especializadas e usadas com pouca frequência (revisão de PR, migração de banco, checklist de deploy, procedimento de auditoria) não devem entrar no claude ou codex.md. Devem virar skills em .claude ou codex/skills/, carregadas sob demanda apenas quando invocadas. Isso mantém o contexto base pequeno sem perder conhecimento de domínio.

### 1.3 Subagentes e comandos versionados

Subagentes específicos do projeto ficam em .claude ou codex/agents/, com frontmatter definindo nome, descrição, ferramentas permitidas e modelo. Slash commands reutilizáveis, para fluxos que se repetem com a mesma instrução, ficam em .claude ou codex/commands/.

Exemplo de subagente restrito a leitura:

```markdown
---
name: code-reviewer
description: Revisa código recém-modificado em busca de falhas de segurança, performance e legibilidade. Usar após qualquer edição.
tools: Read, Grep, Glob
model: sonnet
---

Você é um revisor de código sênior. Para cada problema encontrado,
explique o risco, mostre o trecho atual e proponha a correção.
Não edite arquivos.
```

Versionar claude ou codex.md, agents, commands e o settings.json de projeto garante que qualquer pessoa da equipe trabalhe com o mesmo contexto, sem precisar reconstruir convenções a cada sessão.

## 2. Fluxo de trabalho para qualidade

### 2.1 Plan mode antes de mudanças não triviais

Ativado com Shift+Tab duas vezes. Nesse modo, o claude ou codex só lê, busca e propõe um plano; nenhuma alteração é aplicada até aprovação explícita. Evita retrabalho caro quando a direção inicial está errada, que é o cenário mais desperdiçador de tokens que existe, porque descarta contexto já processado.

Para tarefas médias a grandes, o padrão mais robusto é: plano em modo de leitura, gravação do plano em um arquivo de especificação, revisão humana desse arquivo, e só então execução contra a especificação já fechada.

### 2.2 Ciclo de trabalho

Pesquisar, planejar, executar, revisar, publicar, com um ponto de aprovação humana em cada etapa. Delegar o ciclo inteiro de uma vez, sem gates intermediários, é o que costuma gerar as sessões mais caras e com pior resultado.

### 2.3 Prompts específicos

Prompts vagos disparam varredura ampla do projeto inteiro. Prompts específicos limitam a exploração ao necessário.

Exemplo de prompt fraco: melhorar esse código.
Exemplo de prompt forte: adicionar validação de input na função de login em auth.ts, rejeitando strings vazias e maiores que 254 caracteres.

O segundo gera menos leitura de arquivo, menos ambiguidade e resultado mais previsível.

### 2.4 Alvos de verificação

Incluir no prompt casos de teste, prints de tela ou a saída esperada. Quando o claude ou codex consegue validar o próprio trabalho contra um critério concreto, o erro é pego antes de chegar à revisão humana.

### 2.5 Teste incremental

Escrever um arquivo, testar, prosseguir. Erro pego cedo é barato de corrigir. Erro acumulado ao longo de uma sessão longa é caro de rastrear, porque toda a sessão até aquele ponto já foi paga em tokens e o diagnóstico exige reler contexto antigo.

### 2.6 Commits frequentes

Commitar antes de mudanças estruturais cria uma rede de segurança. Isso não é apenas disciplina de engenharia: é o que permite usar /rewind ou duplo Esc para restaurar um checkpoint anterior sem precisar reabrir uma sessão do zero.

### 2.7 Correção de rumo antecipada

Esc interrompe a execução imediatamente. Não deixar o claude ou codex terminar uma linha de raciocínio que já está visivelmente errada evita gastar tokens duas vezes: uma na tentativa descartada, outra na correção.

### 2.8 Revisão humana obrigatória

O claude ou codex é assistente, não substituto de revisão. A responsabilidade técnica, e em contextos regulados a responsabilidade jurídica, pela mudança em produção continua sendo de quem aprova o merge.

### 2.9 Subagentes focados

Preferir subagentes com escopo estreito a um agente genérico fazendo tudo. Um subagente de leitura, ou um subagente dedicado a análise de log, preserva contexto melhor, comporta-se de forma mais previsível e evita que saída verbosa de uma tarefa auxiliar contamine a conversa principal.

### 2.10 Hooks de checagem automática

Hooks executados após edição (lint, checagem de tipos, testes) capturam erro de forma determinística, sem gastar uma rodada extra de raciocínio do modelo para descobrir o que um script já resolveria de forma mais barata e mais confiável.

### 2.11 Plugins de code intelligence

Para linguagens tipadas, plugins de code intelligence dão navegação precisa de símbolo em vez de busca textual. Uma chamada de ir para definição substitui um grep seguido de leitura de vários arquivos candidatos, e o language server reporta erro de tipo automaticamente após a edição, sem precisar rodar o compilador manualmente.

## 3. Economia e consumo inteligente de tokens

### 3.1 O mecanismo de custo

O claude ou codex Code não tem memória entre chamadas de API. A cada turno, reenvia o histórico inteiro da conversa. Isso faz o custo crescer de forma aproximadamente quadrática com o comprimento da sessão, não linear: uma sessão de 200 mil tokens custa cerca de dez vezes uma de 20 mil, em cada turno subsequente que ela ainda sobrevive. Entender isso é a base de toda decisão de economia abaixo.

### 3.2 Limpeza de contexto

/clear entre tarefas não relacionadas é a alavanca de maior impacto pelo menor esforço. Contexto obsoleto de uma tarefa já resolvida continua sendo cobrado em cada mensagem seguinte se a sessão não for limpa. Usar /rename antes de limpar permite localizar e retomar depois com /resume.

/compact nos pontos de quebra natural de uma tarefa longa, em vez de deixar a sessão crescer sem controle. É possível direcionar o que preservar, por exemplo: foque em trechos de código e uso de API. Essa instrução também pode ficar fixa no claude ou codex.md, como mostrado na seção 1.1.

### 3.3 Escolha de modelo por tarefa

Sonnet cobre a maioria das tarefas de codificação com custo menor que Opus. Reservar Opus para decisão arquitetural complexa ou raciocínio multi-etapa. Para subagentes de tarefa simples, especificar Haiku diretamente no frontmatter do agente.

### 3.4 Ajuste de extended thinking

Pensamento estendido é cobrado como token de saída. Para tarefas simples, reduzir o nível de esforço via /effort ou desativar thinking em /config. Em tarefas de arquitetura ou depuração difícil, manter ligado, porque o ganho de qualidade compensa o custo ali.

### 3.5 Redução de overhead de MCP

Preferir ferramentas de linha de comando, como as CLIs de nuvem ou de observabilidade, quando existirem: elas não adicionam listagem de ferramentas ao contexto como um servidor MCP adiciona. Rodar /mcp periodicamente e desativar servidores configurados que não estão em uso ativo.

### 3.6 Delegação de operações verbosas

Rodar suíte de teste completa, buscar documentação extensa ou processar um arquivo de log grande dentro da conversa principal enche o contexto com conteúdo que não será referenciado de novo. Delegar essas operações a um subagente mantém a saída bruta isolada; só o resumo volta para a conversa principal.

### 3.7 Hooks de pré-processamento

Um hook executado antes da ferramenta rodar pode filtrar a saída antes de ela chegar ao modelo. Exemplo: um hook que intercepta comandos de teste e filtra a saída para mostrar só falhas.

```bash
#!/bin/bash
input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command')

if [[ "$cmd" =~ ^(npm test|pytest|go test) ]]; then
  filtered_cmd="$cmd 2>&1 | grep -A 5 -E '(FAIL|ERROR|error:)' | head -100"
  echo "$input" | jq --arg filtered "$filtered_cmd" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "allow", updatedInput: (.tool_input + {command: $filtered})}}'
else
  echo "{}"
fi
```

Esse tipo de filtro reduz o que seria dezenas de milhares de tokens de log para algumas centenas, sem perder a informação que importa para o diagnóstico.

### 3.8 Monitoramento de consumo

/usage mostra tokens da sessão atual e a taxa de acerto do cache de prompt; em plano de equipe, mostra também atribuição de consumo por skill, subagente e servidor MCP. /cost dá o total da sessão corrente. /insights gera relatório de padrões de uso e pontos de atrito ao longo de várias sessões. Configurar a status line para exibir uso de contexto em tempo real evita descobrir o estouro só quando a sessão já compactou sozinha.

### 3.9 Cache de prompt

Evitar ações que invalidam o cache no meio de uma sessão, como trocar a definição de uma ferramenta MCP em uso. Cache quente reduz drasticamente o custo de reprocessar o mesmo prefixo de contexto a cada turno. Um intervalo de inatividade maior que o tempo de vida do cache reprocessa tudo do zero na próxima mensagem.

## 4. Governança de custo em equipe

Quando o uso deixa de ser individual, os seguintes controles evitam que uma sessão de um único desenvolvedor consuma a cota compartilhada de todos:

1. Limite de gasto configurado no workspace, no Console ou no admin da organização.
2. Recomendação de tokens por minuto e requisições por minuto por usuário, ajustada ao tamanho da equipe: equipes menores toleram limites individuais mais altos, equipes maiores dividem uma cota agregada mais enxuta por pessoa.
3. Relatório de gasto por usuário e por modelo, para identificar rapidamente quem está fora do padrão e por quê.
4. Referência de mercado para orçamento: em torno de treze dólares por desenvolvedor por dia ativo, e de cento e cinquenta a duzentos e cinquenta dólares por desenvolvedor por mês, em ambiente empresarial.

## 5. Controle de permissões e segurança

Relevante em qualquer projeto, e especialmente em ambiente com dados sensíveis ou regulados:

1. Restringir a lista de ferramentas de cada subagente ao mínimo necessário para a função dele, como no exemplo da seção 1.3.
2. Usar plan mode como padrão em repositórios de produção, exigindo aprovação explícita antes de qualquer escrita.
3. Revisar o settings.json de projeto quanto a permissões concedidas por padrão, evitando acesso amplo de sistema de arquivos quando o escopo real da tarefa é um diretório específico.
4. Nunca deixar hooks ou comandos automatizados rodarem ações destrutivas sem confirmação explícita.

## 6. Checklist rápido

1. claude ou codex.md enxuto, abaixo de 200 linhas, versionado.
2. Instruções especializadas em skills, não no claude ou codex.md.
3. Plan mode antes de mudanças não triviais.
4. Prompt específico, com alvo de verificação declarado.
5. Commit antes de mudança estrutural; correção de rumo imediata quando o claude ou codex desviar.
6. /clear entre tarefas não relacionadas; /compact nos pontos de quebra de tarefas longas.
7. Modelo certo para a tarefa: Sonnet como padrão, Opus para arquitetura, Haiku para subagentes simples.
8. Operações verbosas delegadas a subagentes; ruído filtrado por hooks antes de chegar ao modelo.
9. /usage, /cost e /insights checados periodicamente, não só quando o limite já foi atingido.
10. Permissões de cada subagente e hook restritas ao mínimo necessário.
