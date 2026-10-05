'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const JSZip = require('../vendor/jszip.min.js');
const exporter = require('../docx-export.js');
global.wanakana = require('../vendor/wanakana.min.js');
const katakana = require('../katakana-transliterator.js');

const raiz = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(raiz, 'script.js'), 'utf8');
const asset = fs.readFileSync(path.join(raiz, 'assets', 'modelo-docx.js'), 'utf8');
const match = asset.match(/window\.NOSHIGAMI_DOCX_TEMPLATE = '([^']+)'/);

assert.ok(match, 'Template DOCX embutido não encontrado.');

const periodosEsperados = [
    '初七日忌', '二七日忌', '三七日忌', '四七日忌',
    '五七日忌', '六七日忌', '四十九日忌', '百箇日忌'
];

for (const periodo of periodosEsperados) {
    assert.ok(html.includes(`value="${periodo}"`), `Período ausente no formulário: ${periodo}`);
}

assert.ok(html.includes('value="亡" selected'), 'Opção padrão somente 亡 ausente.');
assert.ok(html.includes('id="mensagemPortugues"'), 'Campo de mensagem ausente.');
assert.ok(html.includes('id="termo-compromisso"'), 'Termo de compromisso ausente.');
assert.ok(html.includes('class="help-modal show"'), 'A ajuda não está configurada para abrir com a página.');
for (const secao of ['Campos em português', 'Campos em japonês', 'Mensagem e pré-visualização', 'Termo de compromisso', 'Botões e saídas']) {
    assert.ok(html.includes(secao), `Seção ausente na ajuda: ${secao}`);
}
assert.ok(script.includes("helpModal.classList.add('show')"), 'Inicialização não garante a abertura da ajuda.');
for (const etapa of ['etapa-dados', 'etapa-revisao', 'etapa-finalizacao']) {
    assert.ok(html.includes(`id="${etapa}"`), `Etapa operacional ausente: ${etapa}`);
}
assert.ok(html.includes('id="confirmarJapones"'), 'Confirmação de revisão japonesa ausente.');
assert.ok(script.includes('function atualizarFluxo()'), 'Atualização dos estados do fluxo ausente.');
assert.equal((html.match(/Sugerir katakana/g) || []).length >= 2, true, 'Botões de sugestão em katakana ausentes.');
assert.ok(html.includes('vendor/wanakana.min.js'), 'WanaKana local não está carregado.');
assert.ok(!html.includes('unpkg.com'), 'WanaKana não pode depender de CDN.');
assert.equal(katakana.sugerir('Maria'), 'マリア', 'Transliteração de Maria incorreta.');
assert.equal(katakana.sugerir('Armando'), 'アルマンド', 'Transliteração de Armando incorreta.');
assert.equal(katakana.sugerir('João'), 'ジョアン', 'Transliteração de João incorreta.');
// Nomes de origem japonesa não podem passar pelas regras do português
// (w → u, ch → sh, ge → je); sobrenomes frequentes recebem a vogal longa.
const leiturasEsperadas = {
    Watanabe: 'ワタナベ', Iwamoto: 'イワモト', Ogawa: 'オガワ', Kawasaki: 'カワサキ',
    Chiba: 'チバ', Uchida: 'ウチダ', Michiko: 'ミチコ', Tsuchiya: 'ツチヤ',
    Shigeru: 'シゲル', Gen: 'ゲン', Hattori: 'ハットリ', Homma: 'ホンマ',
    Ohno: 'オオノ', 'Satō': 'サトウ', Sato: 'サトウ', Ito: 'イトウ', Oshiro: 'オオシロ',
    Yamada: 'ヤマダ', Takahashi: 'タカハシ',
    Silva: 'シルバ', 'Gonçalves': 'ゴンサルベス', Vitor: 'ビトル', Oliveira: 'オリベイラ',
    Eduardo: 'エドゥアルド', Thiago: 'チアゴ', Guilherme: 'ギリェルメ', Rodrigues: 'ロドリゲス',
    Nogueira: 'ノゲイラ', Ferreira: 'フェレイラ', Luiz: 'ルイス', Diego: 'ジエゴ',
    Kinjo: 'キンジョウ', Yoko: 'ヨウコ', Taro: 'タロウ',
    Regina: 'レジナ', 'Rogério': 'ロジェリオ', Rocha: 'ロシャ', Machado: 'マシャド',
    'Gerônimo Tacachi Iwamoto': 'ジェロニモ タカシ イワモト', 'Maria Yamada': 'マリア ヤマダ'
};
Object.entries(leiturasEsperadas).forEach(([nome, esperado]) => {
    assert.equal(katakana.sugerir(nome), esperado, `Transliteração de ${nome} incorreta.`);
});
assert.equal(katakana.temOrigemJaponesa('Maria Yamada'), true, 'Sobrenome japonês não detectado.');
assert.equal(katakana.temOrigemJaponesa('Armando Silva'), false, 'Nome português classificado como japonês.');
assert.equal(katakana.temOrigemJaponesa('Maria Souza'), false, 'Maria Souza não deve disparar o alerta de kanji.');
assert.equal(katakana.temOrigemJaponesa('Ana Pereira Ribeiro'), false, 'Ana Pereira Ribeiro não deve disparar o alerta de kanji.');
assert.ok(html.includes('id="tirar-print"'), 'Botão para salvar o Noshigami ausente.');
assert.ok(!html.includes('id="capturar-imagem"'), 'Botão de captura de imagem ainda está presente.');
assert.ok(script.includes("imprimir('noshigami', 'pdf')"), 'Botão Salvar Noshigami não aciona o fluxo de PDF.');
assert.ok(script.includes("if (destino === 'pdf') saveToHistory();"), 'Salvamento em PDF não registra o histórico.');
assert.ok(!script.includes('capturar-imagem'), 'Referência ao botão de captura ainda está presente.');
assert.ok(script.includes('size: A3 landscape'), 'Regra de impressão A3 ausente.');

async function testarDocx() {
    const dados = {
        nomeFalecidoJapones: 'アルマンド',
        nomeFamiliaJapones: '山田',
        relacao: '亡',
        periodoJapones: '初七日忌',
        mensagem: 'Mensagem personalizada de teste.\nSegunda linha.',
        mostrarMensagem: true
    };
    const buffer = await exporter.gerarDocx(JSZip, match[1], dados, 'nodebuffer');
    const destino = path.join(os.tmpdir(), 'noshigami-docx-test.docx');
    fs.writeFileSync(destino, buffer);

    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml').async('string');
    for (const texto of ['アルマンド', '山田家', '亡', '初七日忌', 'Mensagem personalizada de teste.']) {
        assert.ok(xml.includes(texto), `Conteúdo ausente do DOCX: ${texto}`);
    }
    assert.equal((xml.match(/アルマンド/g) || []).length, 2, 'As representações Word e compatível não foram preenchidas.');
    assert.ok(xml.includes('六七日忌'), 'Opção de 42 dias ausente do template exportado.');
    assert.ok(xml.includes('Sem parentesco - 亡'), 'Opção somente 亡 ausente do template exportado.');
    assert.ok(xml.includes('<w:pgSz w:w="20700" w:h="9080"'), 'Dimensão original do documento foi alterada.');
    return destino;
}

testarDocx()
    .then(destino => console.log(`Testes concluídos. DOCX de validação: ${destino}`))
    .catch(erro => {
        console.error(erro);
        process.exitCode = 1;
    });
