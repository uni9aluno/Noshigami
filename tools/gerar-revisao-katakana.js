'use strict';

/* Gera docs/revisao-katakana.md a partir das regras atuais de
   katakana-transliterator.js. Rode depois de qualquer mudança no conversor:

       node tools/gerar-revisao-katakana.js

   A lista usa apenas nomes comuns, nunca dados de clientes. */

const fs = require('node:fs');
const path = require('node:path');

global.wanakana = require('../vendor/wanakana.min.js');
const katakana = require('../katakana-transliterator.js');

// Casos em que mais de uma grafia é usada ou a leitura depende da família.
// Ficam no topo do documento para a revisão começar por eles.
const DUVIDOSOS = [
    ['Aline', 'O "e" final soa "i" no português: アリネ ou アリーニ/アリニ?'],
    ['Jorge', 'ジョルジェ ou ジョルジ (como se pronuncia no Brasil)?'],
    ['Simone', 'シモネ ou シモーネ (vogal longa)?'],
    ['Helena', 'O "h" é mudo no português: ヘレナ ou エレナ?'],
    ['Hugo', 'O "h" é mudo no português: フゴ ou ウーゴ?'],
    ['Vitor', 'ビトル, ヴィトル ou ビトール?'],
    ['Martins', 'マルチンス (como se fala no Brasil) ou マルティンス?'],
    ['Carvalho', 'カルバリョ ou カルヴァーリョ?'],
    ['Lucas', 'ルカス ou ルーカス?'],
    ['Denise', 'デニセ ou デニーズ (o "s" entre vogais soa "z")?'],
    ['Souza', 'ソウザ ou ソーザ?'],
    ['Ono', 'Depende do kanji: 小野 é オノ, 大野 é オオノ. Perguntar à família.'],
    ['Higa', 'Sobrenome okinawano frequente no Brasil: confirmar ヒガ.'],
    ['Chinen', 'Sobrenome okinawano: confirmar チネン.'],
    ['Kinjo', 'Sobrenome okinawano (金城): confirmar キンジョウ.'],
    ['Oshiro', 'Sobrenome okinawano (大城): confirmar オオシロ.'],
    ['Miyagi', 'Sobrenome okinawano: confirmar ミヤギ.'],
    ['Shinichi', 'Sem apóstrofo vira シニチ; digitando Shin\'ichi sai シンイチ. Confirmar a leitura e se vale orientar os vendedores.']
];

const BRASILEIROS = [
    'Maria', 'Ana', 'José', 'João', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro',
    'Lucas', 'Luiz', 'Marcos', 'Luís', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Bruno',
    'Eduardo', 'Felipe', 'Rodrigo', 'Manoel', 'Armando', 'Gerônimo', 'Regina', 'Rogério',
    'Fernanda', 'Juliana', 'Patrícia', 'Aline', 'Camila', 'Sandra', 'Vitor', 'Vera',
    'Cecília', 'Helena', 'Sérgio', 'Jorge', 'Guilherme', 'Thiago', 'Diego', 'Silva',
    'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima',
    'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Gonçalves',
    'Rocha', 'Machado', 'Nogueira'
];

const JAPONESES = [
    'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura',
    'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue',
    'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki', 'Mori', 'Abe', 'Ikeda', 'Hashimoto',
    'Ishikawa', 'Ogawa', 'Okada', 'Hasegawa', 'Fujita', 'Goto', 'Kondo', 'Murakami', 'Endo',
    'Aoki', 'Sakamoto', 'Saito', 'Fukuda', 'Ota', 'Nishimura', 'Fujii', 'Okamoto', 'Matsuda',
    'Nakagawa', 'Harada', 'Oshiro', 'Higa', 'Miyagi', 'Chinen', 'Kinjo', 'Tsuchiya', 'Chiba',
    'Uchida', 'Iwamoto', 'Ohno', 'Hattori', 'Shigeru', 'Hiroshi', 'Takeshi', 'Kenji',
    'Michiko', 'Yoko', 'Keiko', 'Akemi', 'Tsuyoshi', 'Taro', 'Ryu'
];

function sugestao(nome) {
    try {
        return katakana.sugerir(nome);
    } catch (erro) {
        return '(erro)';
    }
}

// Converte o katakana de volta para letras latinas, para que quem não lê
// japonês compare com a pronúncia do nome.
function leituraDeVolta(texto) {
    return texto.startsWith('(') ? '' : global.wanakana.toRomaji(texto);
}

function origem(nome) {
    return katakana.origem(nome) === 'japones' ? 'japonesa' : 'portuguesa';
}

function tabela(nomes) {
    const linhas = nomes.map(nome => {
        const kana = sugestao(nome);
        return `| ${nome} | ${origem(nome)} | ${kana} | ${leituraDeVolta(kana)} |  |  |`;
    });
    return [
        '| Nome | Origem detectada | Sugestão | Leitura de volta | OK? | Correção |',
        '|---|---|---|---|---|---|',
        ...linhas
    ].join('\n');
}

const duvidosos = [
    '| Nome | Sugestão | Leitura de volta | Dúvida | Resposta |',
    '|---|---|---|---|---|',
    ...DUVIDOSOS.map(([nome, duvida]) => {
        const kana = sugestao(nome);
        return `| ${nome} | ${kana} | ${leituraDeVolta(kana)} | ${duvida} |  |`;
    })
].join('\n');

const documento = `# Revisão das sugestões de katakana

Documento gerado por \`tools/gerar-revisao-katakana.js\` a partir das regras atuais
de \`katakana-transliterator.js\`. Usa apenas nomes comuns, sem dados de clientes.
Não edite as tabelas à mão para mudar sugestões: anote as respostas e elas serão
incorporadas ao conversor e aos testes; depois o documento é gerado de novo.

## Quem revisa e como

O ideal é uma pessoa fluente em japonês (professor da associação local, Bunkyo,
kenjinkai ou cliente nikkei de confiança). A seção **Casos duvidosos** é a
prioridade: são poucas linhas e cada resposta vira uma regra fixa.

Quem não lê japonês também ajuda nas tabelas completas usando a coluna
**Leitura de volta**: ela mostra o katakana convertido de novo para letras
latinas. Se a leitura não lembrar a pronúncia do nome, há erro. Exemplo: a
versão anterior gerava エヅアルド para Eduardo, cuja leitura de volta é
"ezuarudo" — fácil de perceber mesmo sem saber japonês.

Fontes para conferir sem fluência:

- **Sobrenomes japoneses:** a própria família — Noshigami ou convite de missa
  anterior, tabuleta budista (位牌), lápide, documentos japoneses (koseki) e
  pedidos anteriores da loja. Se a família usa kanji, a sugestão em katakana não
  deve ser usada.
- **Nomes brasileiros:** como a Wikipédia em japonês e os jornais nikkeis de
  São Paulo escrevem o mesmo nome (jogadores, artistas, políticos).

## Casos duvidosos — revisar primeiro

${duvidosos}

## Nomes e sobrenomes brasileiros

${tabela(BRASILEIROS)}

## Nomes e sobrenomes de origem japonesa

${tabela(JAPONESES)}

## Convenções já adotadas

- **V → B:** Silva → シルバ, Gonçalves → ゴンサルベス (forma mais usada no Brasil).
- **RR → R:** Ferreira → フェレイラ.
- **DU/TU → ドゥ/トゥ** e **DI → ジ:** Eduardo → エドゥアルド, Diego → ジエゴ.
- **Vogal longa em sobrenomes japoneses frequentes:** Sato → サトウ, Ito → イトウ,
  Oshiro → オオシロ. Nomes ambíguos (Ono) ficam como digitados.
- **Origem japonesa:** a confirmação da sugestão alerta o vendedor para
  perguntar se a família usa kanji.
`;

const destino = path.join(__dirname, '..', 'docs', 'revisao-katakana.md');
fs.writeFileSync(destino, documento, 'utf8');
console.log(`Gerado: ${path.relative(process.cwd(), destino)}`);
