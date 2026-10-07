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
        assert.equal(await page.locator('#helpModal').isVisible(), true, 'A ajuda não abriu automaticamente.');
        assert.match(await page.locator('#helpModal').textContent(), /Nome do Falecido\(a\).*Imprimir Aprovação e Termo/s, 'A ajuda não detalha campos e ações.');
        const helpScreenshot = path.join(os.tmpdir(), 'noshigami-ajuda.png');
        await page.screenshot({ path: helpScreenshot });
        await page.locator('.help-close').click();
        assert.equal(await page.locator('#helpModal').isVisible(), false, 'A ajuda não fechou pelo botão ×.');
        assert.equal(await page.locator('#tirar-print').isDisabled(), true, 'Finalização deveria iniciar bloqueada.');
        await page.locator('.history-toggle').click();
        await page.locator('.history-item').click();
        assert.equal(await page.locator('#periodo').inputValue(), '初七日忌', 'Histórico antigo não foi migrado.');
        await page.locator('#nomeFalecido').fill('Armando Teste');
        await page.locator('#nomeFamilia').fill('Yamada');
        await page.evaluate(() => { window.confirm = () => true; });
        // Nomes em japonês são preenchidos sozinhos, sem clique.
        assert.equal(await page.locator('#nomeFalecidoJapones').inputValue(), 'アルマンド テステ');
        assert.equal(await page.locator('#nomeFamiliaJapones').inputValue(), 'ヤマダ');
        assert.match(await page.locator('#status-nomeFamiliaJapones').textContent(), /Lê-se: Ya-ma-da/, 'Leitura em português ausente.');
        // Digitar no campo japonês é respeitado até voltar ao automático.
        await page.locator('#nomeFamiliaJapones').fill('山田');
        await page.locator('#nomeFamilia').fill('Yamada');
        assert.equal(await page.locator('#nomeFamiliaJapones').inputValue(), '山田', 'Texto manual foi sobrescrito.');
        await page.locator('.voltar-automatico').click();
        assert.equal(await page.locator('#nomeFamiliaJapones').inputValue(), 'ヤマダ', 'Voltar ao automático não funcionou.');
        await page.locator('#confirmarJapones').check();
        assert.equal(await page.locator('#tirar-print').isEnabled(), true, 'Finalização não foi liberada após a revisão.');
        await page.locator('#periodonumeral').selectOption('7º dia');
        await page.locator('#relacao').selectOption('亡');
        assert.equal(await page.locator('#periodo').inputValue(), '初七日忌');
        assert.equal(await page.locator('#relacao').inputValue(), '亡');
        assert.match(await page.locator('#mensagemPortugues').inputValue(), /Armando Teste/);
        assert.equal(await page.locator('#capturar-imagem').count(), 0, 'Botão Capturar Imagem ainda está visível.');

        await page.evaluate(() => {
            window.confirm = () => true;
            window.print = () => { window.__pdfSolicitado = true; };
        });
        await page.locator('#tirar-print').click();
        await page.waitForFunction(() => window.__pdfSolicitado === true);
        assert.equal(await page.locator('#print-page-style').textContent(), '@page { size: 36.5cm 16cm; margin: 0; }');
        await page.evaluate(() => {
            window.dispatchEvent(new Event('afterprint'));
        });

        await page.locator('#mensagemPortugues').fill('Mensagem personalizada para aprovação.');
        const eixoMensagem = await page.evaluate(() => {
            const canvas = document.querySelector('#noshigami-canvas').getBoundingClientRect();
            const mensagem = document.querySelector('#texto-fixo').getBoundingClientRect();
            return {
                canvas: canvas.left + canvas.width / 2,
                mensagem: mensagem.left + mensagem.width / 2
            };
        });
        assert.ok(Math.abs(eixoMensagem.mensagem - eixoMensagem.canvas) < 1, 'Mensagem não está centralizada no Noshigami.');
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
        for (const texto of ['アルマンド テステ', 'ヤマダ家', '初七日忌', 'Mensagem personalizada para aprovação.']) {
            assert.ok(xmlExportado.includes(texto), `Conteúdo ausente do DOCX baixado: ${texto}`);
        }
        assert.ok(!/<w:b(?:Cs)?(\s[^>]*)?\/>/.test(xmlExportado), 'DOCX baixado ainda tem negrito.');
        const fontesBaixadas = Object.keys(zipExportado.files).filter(nome => nome.endsWith('.odttf'));
        assert.equal(fontesBaixadas.length, 2, 'DOCX baixado sem as duas fontes incorporadas.');

        // Fontes da peça: Great Vibes na mensagem e Yuji Syuku no japonês,
        // carregadas de fonts/ (sem internet). As fontes reduzidas para o Word
        // passam pelo validador de fontes do próprio Chrome.
        const fontesPeca = await page.evaluate(async () => {
            const reduzir = (base64, texto) => {
                const codigos = new Set(Array.from(texto, c => c.codePointAt(0)));
                return window.NoshigamiDocx.esvaziarGlifos(base64, codigo => codigos.has(codigo));
            };
            const validar = async (nome, bytes) => {
                try {
                    await new FontFace(nome, bytes).load();
                    return true;
                } catch (erro) {
                    return String(erro);
                }
            };
            const origem = window.NOSHIGAMI_FONTES_DOCX;
            return {
                mensagem: getComputedStyle(document.querySelector('#texto-fixo')).fontFamily,
                greatVibes: document.fonts.check('34px "Great Vibes"', 'Missa'),
                yuji: document.fonts.check('40px "Yuji Syuku"', '亡'),
                yujiBase: await validar('TesteYujiBase', window.NoshigamiDocx.esvaziarGlifos(origem['Yuji Syuku'], () => true)),
                yujiReduzida: await validar('TesteYuji', reduzir(origem['Yuji Syuku'], 'アルマンド テステヤマダ家亡初七日忌')),
                greatVibesReduzida: await validar('TesteGreatVibes', reduzir(origem['Great Vibes'], 'Missa de 7º dia'))
            };
        });
        assert.match(fontesPeca.mensagem, /^"?Great Vibes/, 'Mensagem da prévia não usa Great Vibes.');
        assert.deepEqual(
            [fontesPeca.greatVibes, fontesPeca.yuji, fontesPeca.yujiBase, fontesPeca.yujiReduzida, fontesPeca.greatVibesReduzida],
            [true, true, true, true, true],
            'Fontes não carregaram ou são inválidas: ' + JSON.stringify(fontesPeca)
        );

        // Arrastar perto do centro da página: gruda no centro e mostra a guia rosa.
        const falecidoJp = page.locator('#nomeFalecidoJapones-container');
        await page.locator('#noshigami-stage').scrollIntoViewIfNeeded();
        const arraste = await page.evaluate(() => {
            // Afasta os outros blocos estreitos para que só o centro da página
            // (e o da mensagem, também centralizada) estejam perto.
            ['relacao-container', 'missa-container', 'nomeFamiliaJapones-container']
                .forEach(id => { document.getElementById(id).style.left = '100px'; });
            const el = document.querySelector('#nomeFalecidoJapones-container');
            const canvas = document.querySelector('#noshigami-canvas').getBoundingClientRect();
            const escala = canvas.width / 1794;
            const caixa = el.getBoundingClientRect();
            const centroX = caixa.left + caixa.width / 2;
            const centroY = caixa.top + caixa.height / 2;
            const alvoX = canvas.left + (897 + 2) * escala; // 2 px de design fora do centro
            return { centroX, centroY, alvoX };
        });
        await page.mouse.move(arraste.centroX, arraste.centroY);
        await page.mouse.down();
        await page.mouse.move((arraste.centroX + arraste.alvoX) / 2, arraste.centroY + 3, { steps: 4 });
        await page.mouse.move(arraste.alvoX, arraste.centroY + 3, { steps: 4 });
        assert.ok(await page.locator('#guias .guia-v').count() >= 1, 'Guia vertical não apareceu no centro.');
        const centroArrastado = await falecidoJp.evaluate(el => parseFloat(el.style.left) + el.offsetWidth / 2);
        assert.ok(Math.abs(centroArrastado - 897) < 0.01, `Texto não grudou no centro: ${centroArrastado}`);
        await page.mouse.up();
        assert.equal(await page.locator('#guias .guia').count(), 0, 'Guias continuaram visíveis após soltar.');

        // Posição exata em mm (centro do bloco).
        assert.equal(await page.locator('#posicao-x').isEnabled(), true, 'Painel de mm não habilitou ao selecionar.');
        await page.locator('#posicao-x').fill('150');
        await page.locator('#posicao-y').fill('40.5');
        const centroMm = await falecidoJp.evaluate(el => ({
            x: (parseFloat(el.style.left) + el.offsetWidth / 2) * 365 / 1794,
            y: (parseFloat(el.style.top) + el.offsetHeight / 2) * 365 / 1794,
            dx: Math.round((parseFloat(el.style.left) - 920) * 365 / 1794 * 100) / 100,
            dy: Math.round((parseFloat(el.style.top) - 80) * 365 / 1794 * 100) / 100
        }));
        assert.ok(Math.abs(centroMm.x - 150) < 0.01 && Math.abs(centroMm.y - 40.5) < 0.01, `Posição em mm incorreta: ${JSON.stringify(centroMm)}`);

        // O Word acompanha o deslocamento.
        const downloadMovido = page.waitForEvent('download');
        await page.locator('#exportar-docx').click();
        const docxMovido = path.join(os.tmpdir(), 'noshigami-browser-movido.docx');
        await (await downloadMovido).saveAs(docxMovido);
        const xmlMovido = await (await JSZip.loadAsync(fs.readFileSync(docxMovido))).file('word/document.xml').async('string');
        const blocoMovido = xmlMovido.match(/<mc:AlternateContent\b[\s\S]*?<\/mc:AlternateContent>/g).find(bloco => bloco.includes('アルマンド テステ'));
        assert.ok(blocoMovido.includes(`<wp:posOffset>${4958715 + Math.round(centroMm.dx * 36000)}</wp:posOffset>`), 'DOCX não recebeu o deslocamento horizontal.');
        assert.ok(blocoMovido.includes(`<wp:posOffset>${475326 + Math.round(centroMm.dy * 36000)}</wp:posOffset>`), 'DOCX não recebeu o deslocamento vertical.');
        const screenshotGuias = path.join(os.tmpdir(), 'noshigami-posicao.png');
        await page.locator('#preview').screenshot({ path: screenshotGuias });
        await page.locator('#restaurar-posicoes').click();

        // Busca de noshigamis no cabeçalho.
        await page.locator('#busca-noshigami').fill('armando');
        assert.equal(await page.locator('#historyPanel').evaluate(el => el.classList.contains('open')), true, 'Busca não abriu o histórico.');
        const encontrados = await page.locator('#historyList .history-item').allTextContents();
        assert.ok(encontrados.length >= 1 && encontrados.every(texto => /Armando/.test(texto)), `Busca não filtrou: ${encontrados}`);
        await page.locator('#busca-noshigami').fill('zzzz');
        assert.match(await page.locator('#historyList').textContent(), /Nenhum noshigami encontrado/);
        await page.locator('#busca-limpar').click();
        assert.equal(await page.locator('#busca-noshigami').inputValue(), '');

        // Remover do histórico pede confirmação.
        const antes = await page.locator('#historyList .history-item').count();
        await page.evaluate(() => {
            window.confirm = mensagem => { window.__confirmacao = mensagem; return false; };
        });
        await page.locator('#historyList .remover-item').first().click();
        assert.match(await page.evaluate(() => window.__confirmacao || ''), /Remover este noshigami/, 'Remoção não pediu confirmação.');
        assert.equal(await page.locator('#historyList .history-item').count(), antes, 'Removeu sem confirmação.');
        await page.evaluate(() => { window.confirm = () => true; });
        await page.locator('#historyList .remover-item').first().click();
        assert.equal(await page.locator('#historyList .history-item').count(), antes - 1, 'Item do histórico não foi removido.');
        await page.evaluate(() => {
            window.confirm = () => true;
            document.querySelector('#historyPanel').classList.remove('open');
        });

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
            noshigami: parseFloat(getComputedStyle(document.querySelector('#print-noshigami-image')).width),
            eixoFolha: document.querySelector('#print-area').getBoundingClientRect().left + document.querySelector('#print-area').getBoundingClientRect().width / 2,
            eixoNoshigami: document.querySelector('#print-noshigami-image').getBoundingClientRect().left + document.querySelector('#print-noshigami-image').getBoundingClientRect().width / 2,
            eixoTermo: document.querySelector('.print-termo').getBoundingClientRect().left + document.querySelector('.print-termo').getBoundingClientRect().width / 2,
            eixoAssinatura: document.querySelector('.linha-assinatura').getBoundingClientRect().left + document.querySelector('.linha-assinatura').getBoundingClientRect().width / 2
        }));
        assert.ok(Math.abs(medidas.folha - 1587.4) < 2, 'Largura A3 incorreta.');
        assert.ok(Math.abs(medidas.noshigami - 1379.5) < 2, 'Noshigami não está com 36,5 cm na impressão.');
        assert.ok(Math.abs(medidas.eixoNoshigami - medidas.eixoFolha) < 1, `Noshigami não está centralizado na folha A3: ${JSON.stringify(medidas)}`);
        assert.ok(Math.abs(medidas.eixoTermo - medidas.eixoFolha) < 1, `Termo não está centralizado na folha A3: ${JSON.stringify(medidas)}`);
        assert.ok(Math.abs(medidas.eixoAssinatura - medidas.eixoFolha) < 1, `Assinatura não está centralizada na folha A3: ${JSON.stringify(medidas)}`);
        // Aceite: quadrado em branco para o cliente marcar; espaço livre para
        // assinar acima da linha e legenda embaixo dela; tudo dentro da folha.
        const termo = await page.evaluate(() => {
            const cm = 1587.4 / 42;
            const quadro = document.querySelector('.quadro-aceite').getBoundingClientRect();
            const assinatura = document.querySelector('.linha-assinatura');
            const caixa = assinatura.getBoundingClientRect();
            const anterior = document.querySelector('.print-identificacao').getBoundingClientRect();
            const folha = document.querySelector('#print-area').getBoundingClientRect();
            return {
                texto: document.querySelector('.print-termo').textContent,
                quadroCm: quadro.width / cm,
                espacoCm: (caixa.top - anterior.bottom) / cm,
                linhaEmCima: getComputedStyle(assinatura).borderTopStyle === 'solid',
                larguraCm: caixa.width / cm,
                dentro: caixa.bottom <= folha.bottom
            };
        });
        assert.ok(!termo.texto.includes('[X]'), 'Termo impresso já vem com o aceite marcado.');
        assert.ok(termo.quadroCm > 0.35, `Quadrado de aceite pequeno demais: ${JSON.stringify(termo)}`);
        assert.ok(termo.espacoCm >= 1.4 && termo.linhaEmCima && termo.larguraCm >= 14.9 && termo.dentro, `Linha de assinatura incorreta: ${JSON.stringify(termo)}`);
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
        await page.evaluate(() => {
            localStorage.setItem('noshigamiHistory', '{invalido');
            const memoria = JSON.parse(localStorage.getItem('noshigamiMemoria') || '[]');
            memoria.push({
                nomeFalecido: 'Pendente Teste', nomeFamilia: 'Sato',
                nomeFalecidoJapones: 'ペンデンテ', nomeFamiliaJapones: 'サトウ',
                periodos: ['7º dia'], aprovado: false, pendente: true,
                pendenteDesde: '2026-10-01T12:00:00.000Z', atualizadoEm: '2026-10-01T12:00:00.000Z'
            });
            localStorage.setItem('noshigamiMemoria', JSON.stringify(memoria));
        });
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('#nomeFalecido').isVisible(), true, 'Histórico corrompido impediu a inicialização.');
        await page.locator('.help-close').click();
        // Remover pendência de kanji (com confirmação).
        assert.equal(await page.locator('#badge-pendencias').isVisible(), true, 'Pendência não apareceu no ícone.');
        await page.locator('.history-toggle').click();
        assert.equal(await page.locator('#lista-pendencias .pendencia-item').count(), 1);
        page.once('dialog', dialogo => dialogo.accept());
        await page.locator('#lista-pendencias .remover-item').click();
        assert.equal(await page.locator('#lista-pendencias .pendencia-item').count(), 0, 'Pendência não foi removida.');
        assert.equal(await page.locator('#badge-pendencias').isVisible(), false, 'Contador de pendências não sumiu.');
        assert.ok(!(await page.evaluate(() => localStorage.getItem('noshigamiMemoria'))).includes('Pendente Teste'), 'Pendência não aprovada continuou na memória.');
        await page.keyboard.press('Escape');
        // A memória da loja não preenche mais o formulário: a família vem do
        // sobrenome e o japonês do katakana automático.
        await page.locator('#nomeFalecido').fill('Armando Teste');
        assert.equal(await page.locator('#nomeFamilia').inputValue(), 'Teste', 'Memória não deveria preencher a família.');
        assert.doesNotMatch(await page.locator('#status-nomeFalecidoJapones').textContent(), /usado em/, 'Memória não deveria preencher o nome japonês.');
        await page.setViewportSize({ width: 390, height: 844 });
        const larguraMobile = await page.evaluate(() => ({ viewport: window.innerWidth, pagina: document.documentElement.scrollWidth }));
        assert.ok(larguraMobile.pagina <= larguraMobile.viewport + 1, 'Layout mobile criou rolagem horizontal.');
        const mobileScreenshot = path.join(os.tmpdir(), 'noshigami-mobile.png');
        await page.screenshot({ path: mobileScreenshot, fullPage: true });

        assert.deepEqual(externos, [], 'A aplicação tentou acessar recursos externos.');
        assert.deepEqual(erros, [], 'Erros no navegador: ' + erros.join(' | '));
        console.log(`Teste de navegador concluído. Screenshot: ${screenshot}`);
        console.log(`Ajuda inicial: ${helpScreenshot}`);
        console.log(`Interface mobile: ${mobileScreenshot}`);
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
