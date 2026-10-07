'use strict';

/* Gera assets/fontes-docx.js: as fontes que o .docx exportado leva dentro
   de si (Yuji Syuku para o japonês, Great Vibes para a mensagem).

   A Yuji Syuku completa tem 8,4 MB. Aqui ela é reduzida aos caracteres que
   o app pode produzir: kana, pontuação japonesa, latim básico e todos os
   kanji que aparecem no código e na base de nomes (assets/kanji-dados.js).
   Na exportação, docx-export.js reduz de novo, só aos caracteres usados.

   O arquivo gerado é carregado sob demanda, só ao exportar para Word.

   Uso (depois de mudar fonts/ ou assets/kanji-dados.js):
       node tools/gerar-fontes-docx.js */

const fs = require('node:fs');
const path = require('node:path');
const { esvaziarGlifos, caracteresComContorno } = require('../docx-export.js');

const raiz = path.resolve(__dirname, '..');
const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo));

const caracteres = new Set();
const faixas = [
    [0x20, 0x7E], [0xA0, 0xFF],
    [0x3000, 0x30FF], [0x31F0, 0x31FF], [0xFF00, 0xFFEF]
];
faixas.forEach(([inicio, fim]) => { for (let c = inicio; c <= fim; c += 1) caracteres.add(c); });
const ideograma = /[⺀-⿟㐀-䶿一-鿿豈-﫿]/u;
['assets/kanji-dados.js', 'kanji-nomes.js', 'script.js', 'docx-export.js', 'katakana-transliterator.js', 'index.html']
    .forEach(arquivo => {
        for (const c of ler(arquivo).toString('utf8')) if (ideograma.test(c)) caracteres.add(c.codePointAt(0));
    });

const yuji = esvaziarGlifos(ler('fonts/YujiSyuku-Regular.ttf'), codigo => caracteres.has(codigo));
const greatVibes = ler('fonts/GreatVibes-Regular.ttf');
const cobertos = caracteresComContorno(yuji);

const saida = [
    '/* Gerado automaticamente por tools/gerar-fontes-docx.js.',
    '   Fontes: fonts/YujiSyuku-Regular.ttf (reduzida) e fonts/GreatVibes-Regular.ttf, ambas SIL OFL 1.1.',
    '   Nao edite manualmente. */',
    'window.NOSHIGAMI_FONTES_DOCX = {',
    "    'Yuji Syuku': '" + Buffer.from(yuji).toString('base64') + "',",
    "    'Great Vibes': '" + greatVibes.toString('base64') + "'",
    '};',
    ''
].join('\n');
fs.writeFileSync(path.join(raiz, 'assets/fontes-docx.js'), saida);
console.log(`Yuji Syuku: ${(yuji.length / 1024 / 1024).toFixed(2)} MB, ${cobertos.size} caracteres com contorno.`);
console.log(`Great Vibes: ${(greatVibes.length / 1024).toFixed(0)} KB.`);
console.log(`assets/fontes-docx.js: ${(saida.length / 1024 / 1024).toFixed(2)} MB.`);
