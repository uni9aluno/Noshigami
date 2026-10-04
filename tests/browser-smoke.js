'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const JSZip = require('../vendor/jszip.min.js');

const raiz = path.resolve(__dirname, '..');
const tipos = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

function iniciarServidor() {
    return new Promise(resolve => {
        const servidor = http.createServer((req, res) => {
            const url = new URL(req.url, 'http://127.0.0.1');
            const relativo = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
            const arquivo = path.resolve(raiz, '.' + relativo);
            if (!arquivo.startsWith(raiz + path.sep) || !fs.existsSync(arquivo) || !fs.statSync(arquivo).isFile()) {
                res.writeHead(404).end('Not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream' });
            fs.createReadStream(arquivo).pipe(res);
        });
        servidor.listen(0, '127.0.0.1', () => resolve(servidor));
    });
}

(async () => {
    const servidor = await iniciarServidor();
    const porta = servidor.address().port;
    const navegadores = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const executavel = navegadores.find(fs.existsSync);
    assert.ok(executavel, 'Chrome ou Edge não encontrado para o teste local.');
    const browser = await chromium.launch({ headless: true, executablePath: executavel });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
    const erros = [];
    const externos = [];
    page.on('console', mensagem => {
        if (mensagem.type() === 'error') erros.push(mensagem.text());
    });
    page.on('pageerror', erro => erros.push(erro.message));
    await page.route('**/*', async route => {
        const destino = new URL(route.request().url());
        if (destino.hostname !== '127.0.0.1') {
            externos.push(destino.href);
            await route.abort();
            return;
        }
        await route.continue();
    });
    await page.addInitScript(() => {
        if (!localStorage.getItem('noshigamiHistory')) {
            localStorage.setItem('noshigamiHistory', JSON.stringify([{
                id: 1,
                nomeFalecido: 'Registro Antigo',
                nomeFamilia: 'Família Antiga',
                periodonumeral: '7º dia',
                periodo: '初七日',
                relacao: '',
                timestamp: '2026-01-01T12:00:00.000Z'
            }]));
        }
    });

    try {
        await page.goto(`http://127.0.0.1:${porta}/index.html`, { waitUntil: 'networkidle' });
        await page.locator('.history-toggle').click();
        await page.locator('.history-item').click();
        assert.equal(await page.locator('#periodo').inputValue(), '初七日忌', 'Histórico antigo não foi migrado.');
        await page.locator('#nomeFalecido').fill('Armando Teste');
        await page.locator('#nomeFamilia').fill('Yamada');
        await page.locator('#nomeFalecidoJapones').fill('アルマンド');
        await page.locator('#nomeFamiliaJapones').fill('山田');
        await page.locator('#periodonumeral').selectOption('7º dia');
        await page.locator('#relacao').selectOption('亡');
        assert.equal(await page.locator('#periodo').inputValue(), '初七日忌');
        assert.equal(await page.locator('#relacao').inputValue(), '亡');
        assert.match(await page.locator('#mensagemPortugues').inputValue(), /Armando Teste/);

        await page.locator('#mensagemPortugues').fill('Mensagem personalizada para aprovação.');
        await page.locator('#mostrarMensagem').uncheck();
        assert.equal(await page.locator('#texto-fixo').evaluate(el => getComputedStyle(el).display), 'none');
        await page.locator('#mostrarMensagem').check();

        await page.locator('#alternar-termo').click();
        assert.equal(await page.locator('#termo-compromisso').isVisible(), true);
        await page.locator('#nomeCliente').fill('Cliente Teste');
        await page.locator('#aceiteTermo').check();

        const downloadPromise = page.waitForEvent('download');
        await page.locator('#exportar-docx').click();
        const download = await downloadPromise;
        const docx = path.join(os.tmpdir(), 'noshigami-browser-test.docx');
        await download.saveAs(docx);
        assert.ok(fs.statSync(docx).size > 100000, 'DOCX baixado está vazio.');
        const zipExportado = await JSZip.loadAsync(fs.readFileSync(docx));
        const xmlExportado = await zipExportado.file('word/document.xml').async('string');
        for (const texto of ['アルマンド', '山田家', '初七日忌', 'Mensagem personalizada para aprovação.']) {
            assert.ok(xmlExportado.includes(texto), `Conteúdo ausente do DOCX baixado: ${texto}`);
        }

        const screenshot = path.join(os.tmpdir(), 'noshigami-browser-smoke.png');
        await page.screenshot({ path: screenshot, fullPage: true });

        await page.evaluate(() => {
            const tela = window.__montar(3104 / 1794);
            document.querySelector('#print-noshigami-image').src = tela.toDataURL('image/png');
            document.querySelector('#print-nome-cliente').textContent = 'Cliente Teste';
            document.querySelector('#print-data-termo').textContent = '04/10/2026';
            document.querySelector('#print-area').setAttribute('aria-hidden', 'false');
            document.body.classList.add('print-aprovacao');
            const estilo = document.createElement('style');
            estilo.id = 'print-page-style';
            estilo.textContent = '@page { size: A3 landscape; margin: 0; }';
            document.head.appendChild(estilo);
        });
        await page.emulateMedia({ media: 'print' });
        await page.setViewportSize({ width: 1600, height: 1130 });
        const medidas = await page.evaluate(() => ({
            folha: parseFloat(getComputedStyle(document.querySelector('#print-area')).width),
            noshigami: parseFloat(getComputedStyle(document.querySelector('#print-noshigami-image')).width)
        }));
        assert.ok(Math.abs(medidas.folha - 1587.4) < 2, 'Largura A3 incorreta.');
        assert.ok(Math.abs(medidas.noshigami - 1379.5) < 2, 'Noshigami não está com 36,5 cm na impressão.');
        const printScreenshot = path.join(os.tmpdir(), 'noshigami-print-a3.png');
        await page.screenshot({ path: printScreenshot, fullPage: true });
        const printPdf = path.join(os.tmpdir(), 'noshigami-print-a3.pdf');
        await page.pdf({ path: printPdf, width: '420mm', height: '297mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });

        await page.evaluate(() => {
            document.body.classList.remove('print-aprovacao');
            document.body.classList.add('print-noshigami');
            document.querySelector('#print-page-style').textContent = '@page { size: 36.5cm 16cm; margin: 0; }';
        });
        const medidaFinal = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#print-area')).width));
        assert.ok(Math.abs(medidaFinal - 1379.5) < 2, 'Folha final não está com 36,5 cm.');
        const finalPdf = path.join(os.tmpdir(), 'noshigami-print-final.pdf');
        await page.pdf({ path: finalPdf, width: '365mm', height: '160mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });

        await page.emulateMedia({ media: 'screen' });
        await page.evaluate(() => localStorage.setItem('noshigamiHistory', '{invalido'));
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('#nomeFalecido').isVisible(), true, 'Histórico corrompido impediu a inicialização.');

        assert.deepEqual(externos, [], 'A aplicação tentou acessar recursos externos.');
        assert.deepEqual(erros, [], 'Erros no navegador: ' + erros.join(' | '));
        console.log(`Teste de navegador concluído. Screenshot: ${screenshot}`);
        console.log(`Prévia A3: ${printScreenshot}`);
        console.log(`PDF A3: ${printPdf}`);
        console.log(`PDF final: ${finalPdf}`);
        console.log(`DOCX baixado no navegador: ${docx}`);
    } finally {
        await browser.close();
        servidor.close();
    }
})().catch(erro => {
    console.error(erro);
    process.exitCode = 1;
});
