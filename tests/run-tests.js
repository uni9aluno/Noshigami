'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const JSZip = require('../vendor/jszip.min.js');
const exporter = require('../docx-export.js');

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
