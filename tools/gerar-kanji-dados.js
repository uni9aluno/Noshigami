'use strict';

/* Gera assets/kanji-dados.js: grafias em kanji de sobrenomes e nomes
   japoneses para a tela em que o CLIENTE escolhe a escrita da família.

   Fontes (baixe e informe a pasta):
   - Japanese Personal Name Dataset (MIT) — sobrenomes com população estimada
     e nomes com variações em kanji:
       https://github.com/shuheilocale/japanese-personal-name-dataset
       arquivos last_name_org.csv, first_name_man_org.csv, first_name_woman_org.csv
   - KANJIDIC2 (EDRDG, CC BY-SA 4.0), em JSON pelo jmdict-simplified:
       https://github.com/scriptin/jmdict-simplified/releases (kanjidic2-en-*.json)
     Usado SÓ aqui, para filtrar: uma grafia de nome entra apenas se a leitura
     puder ser formada pelas leituras dos próprios kanji (恵子 não é Toshiko).
     Nenhum dado do KANJIDIC2 vai para o app.

   Uso:
       node tools/gerar-kanji-dados.js <pasta-com-os-csv> <kanjidic2-en.json>

   Ordem das opções:
   - sobrenomes: pela população estimada (渡辺 antes de 渡邊);
   - nomes: pela frequência de cada kanji nos nomes da base, preferindo
     grafias de 1 a 2 kanji. As grafias curadas em kanji-nomes.js continuam
     vindo antes destas. */

const fs = require('node:fs');
const path = require('node:path');
global.wanakana = require('../vendor/wanakana.min.js');
require('../katakana-transliterator.js');
const { chave } = require('../kanji-nomes.js');

const [pastaCsv, arquivoKanjidic] = process.argv.slice(2);
if (!pastaCsv || !arquivoKanjidic) {
    console.error('Uso: node tools/gerar-kanji-dados.js <pasta-com-os-csv> <kanjidic2-en.json>');
    process.exit(1);
}

const MAX_POR_NOME = 30; // a tela mostra 7 e o resto em "Ver mais"

function lerCsv(arquivo) {
    return fs.readFileSync(path.join(pastaCsv, arquivo), 'utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .map(linha => linha.split(','));
}

// ---------------------------------------------------------------- KANJIDIC2
const hiragana = texto => texto.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const SONORA = { か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご', さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ',
    た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど', は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ' };
const SEMI = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' };
// Terminações de verbo/adjetivo que aparecem em nomes (勉める → つとむ).
const OKURIGANA = 'うくすつぬふむゆるいきしちにひみりえけせてねへめれお';

const leituras = new Map();
JSON.parse(fs.readFileSync(arquivoKanjidic, 'utf8')).characters.forEach(caractere => {
    const brutas = new Set();
    const rm = caractere.readingMeaning || {};
    (rm.groups || []).forEach(grupo => grupo.readings.forEach(leitura => {
        if (leitura.type !== 'ja_on' && leitura.type !== 'ja_kun') return;
        const valor = hiragana(leitura.value).replace(/-/g, '');
        const [radical, okuri] = valor.split('.');
        brutas.add(radical);
        if (okuri) {
            brutas.add(radical + okuri);
            for (const final of OKURIGANA) brutas.add(radical + final);
        }
    }));
    (rm.nanori || []).forEach(n => brutas.add(hiragana(n)));

    const variantes = new Set();
    brutas.forEach(v => {
        if (!v) return;
        variantes.add(v);
        // rendaku (しげ → じげ não; た → だ em 山田), sokuon (いち → いっ)
        if (SONORA[v[0]]) variantes.add(SONORA[v[0]] + v.slice(1));
        if (SEMI[v[0]]) variantes.add(SEMI[v[0]] + v.slice(1));
        if (v[0] === 'ち') variantes.add('じ' + v.slice(1));
        if ('つちくき'.includes(v[v.length - 1])) variantes.add(v.slice(0, -1) + 'っ');
        if (v.endsWith('う')) { variantes.add(v.slice(0, -1)); variantes.add(v.slice(0, -1) + 'お'); }
        if (v.endsWith('お')) variantes.add(v.slice(0, -1) + 'う');
    });
    leituras.set(caractere.literal, variantes);
});

function compativel(kanji, leitura) {
    const letras = Array.from(kanji);
    const memo = new Map();
    function encaixa(i, j) {
        if (i === letras.length) return j === leitura.length;
        const k = i + ':' + j;
        if (memo.has(k)) return memo.get(k);
        let possiveis = leituras.get(letras[i] === '々' && i > 0 ? letras[i - 1] : letras[i]) || new Set();
        if (letras[i] === '々') possiveis = new Set([...possiveis, ...[...possiveis].map(v => (SONORA[v[0]] || v[0]) + v.slice(1))]);
        let ok = false;
        for (const v of possiveis) {
            if (leitura.startsWith(v, j) && encaixa(i + 1, j + v.length)) { ok = true; break; }
        }
        memo.set(k, ok);
        return ok;
    }
    return encaixa(0, 0);
}

// ---------------------------------------------------------------- sobrenomes
const sobrenomes = new Map(); // chave → [{kanji, pop}]
lerCsv('last_name_org.csv').forEach(([kanji, populacao, , romaji]) => {
    if (!kanji || !romaji) return;
    const k = chave(romaji);
    const lista = sobrenomes.get(k) || [];
    lista.push({ kanji, pop: Number(populacao) || 0 });
    sobrenomes.set(k, lista);
});

// ---------------------------------------------------------------- nomes
const brutos = [...lerCsv('first_name_man_org.csv'), ...lerCsv('first_name_woman_org.csv')];
let total = 0;
let aceitos = 0;
const nomes = new Map(); // chave → Set(kanji)
brutos.forEach(([leitura, romaji, ...grafias]) => {
    if (!leitura || !romaji) return;
    const k = chave(romaji);
    const conjunto = nomes.get(k) || new Set();
    grafias.filter(Boolean).forEach(grafia => {
        total += 1;
        if (!compativel(grafia, leitura)) return;
        aceitos += 1;
        conjunto.add(grafia);
    });
    if (conjunto.size) nomes.set(k, conjunto);
});

// Frequência de cada kanji entre todas as grafias aceitas: aproxima quais
// kanji são realmente usados em nomes (子, 美, 雄, 夫...).
const usoEmNomes = new Map();
nomes.forEach(conjunto => conjunto.forEach(grafia => {
    for (const c of grafia) usoEmNomes.set(c, (usoEmNomes.get(c) || 0) + 1);
}));
function pontuacao(grafia) {
    const letras = Array.from(grafia);
    const media = letras.reduce((soma, c) => soma + Math.log(usoEmNomes.get(c) || 1), 0) / letras.length;
    return media - 1.5 * Math.max(0, letras.length - 2);
}

const dados = { sobrenomes: {}, nomes: {} };
[...sobrenomes.keys()].sort().forEach(k => {
    dados.sobrenomes[k] = sobrenomes.get(k).sort((a, b) => b.pop - a.pop).map(item => item.kanji);
});
[...nomes.keys()].sort().forEach(k => {
    dados.nomes[k] = [...nomes.get(k)].sort((a, b) => pontuacao(b) - pontuacao(a)).slice(0, MAX_POR_NOME);
});

const destino = path.join(__dirname, '..', 'assets', 'kanji-dados.js');
const cabecalho = `/* Gerado por tools/gerar-kanji-dados.js — não edite à mão.
   Fonte: Japanese Personal Name Dataset (MIT, (c) 2022 shuheilocale),
   https://github.com/shuheilocale/japanese-personal-name-dataset
   Grafias de nomes filtradas com as leituras do KANJIDIC2 (EDRDG). */\n`;
// Funciona no navegador (window) e no Node (testes e este gerador).
fs.writeFileSync(destino, cabecalho +
    "(typeof window !== 'undefined' ? window : globalThis).NOSHIGAMI_KANJI_DADOS = " +
    JSON.stringify(dados) + ';\n', 'utf8');
console.log(`Sobrenomes: ${Object.keys(dados.sobrenomes).length} leituras. ` +
    `Nomes: ${Object.keys(dados.nomes).length} leituras (${aceitos} de ${total} grafias aceitas). ` +
    `Arquivo: ${(fs.statSync(destino).size / 1024).toFixed(0)} KB`);
