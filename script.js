document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const elementos = {
        nomeFalecido: document.getElementById('nomeFalecido'),
        nomeFalecidoJapones: document.getElementById('nomeFalecidoJapones'),
        periodoNumeral: document.getElementById('periodonumeral'),
        periodo: document.getElementById('periodo'),
        relacao: document.getElementById('relacao'),
        nomeFamilia: document.getElementById('nomeFamilia'),
        nomeFamiliaJapones: document.getElementById('nomeFamiliaJapones'),
        mensagem: document.getElementById('mensagemPortugues'),
        mostrarMensagem: document.getElementById('mostrarMensagem'),
        mensagemPreview: document.getElementById('mensagemPreview'),
        periodoPreview: document.getElementById('periodoPreview'),
        nomeFalecidoJaponesPreview: document.getElementById('nomeFalecidoJaponesPreview'),
        nomeFamiliaJaponesPreview: document.getElementById('nomeFamiliaJaponesPreview'),
        relacaoPreview: document.getElementById('relacaoPreview'),
        textoFixo: document.getElementById('texto-fixo'),
        nomeCliente: document.getElementById('nomeCliente'),
        dataTermo: document.getElementById('dataTermo'),
        aceiteTermo: document.getElementById('aceiteTermo'),
        termo: document.getElementById('termo-compromisso'),
        printArea: document.getElementById('print-area'),
        printImagem: document.getElementById('print-noshigami-image'),
        printNomeCliente: document.getElementById('print-nome-cliente'),
        printDataTermo: document.getElementById('print-data-termo')
    };

    const botoes = {
        salvar: document.getElementById('tirar-print'),
        capturar: document.getElementById('capturar-imagem'),
        alternarMensagem: document.getElementById('ocultar-traducao'),
        restaurarMensagem: document.getElementById('restaurar-mensagem'),
        limpar: document.getElementById('limpar-campos'),
        restaurarPosicoes: document.getElementById('restaurar-posicoes'),
        exportarTxt: document.getElementById('exportar-txt'),
        exportarDocx: document.getElementById('exportar-docx'),
        alternarTermo: document.getElementById('alternar-termo'),
        imprimirNoshigami: document.getElementById('imprimir-noshigami'),
        imprimirAprovacao: document.getElementById('imprimir-aprovacao')
    };

    const helpModal = document.getElementById('helpModal');
    const historyPanel = document.getElementById('historyPanel');
    const historyList = document.getElementById('historyList');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const stage = document.getElementById('noshigami-stage');
    const canvas = document.getElementById('noshigami-canvas');

    const PERIODOS = Object.freeze([
        { portugues: '7º dia', japones: '初七日忌' },
        { portugues: '14º dia', japones: '二七日忌' },
        { portugues: '21º dia', japones: '三七日忌' },
        { portugues: '28º dia', japones: '四七日忌' },
        { portugues: '35º dia', japones: '五七日忌' },
        { portugues: '42º dia', japones: '六七日忌' },
        { portugues: '49º dia', japones: '四十九日忌' },
        { portugues: '100º dia', japones: '百箇日忌' },
        { portugues: '1 ano', japones: '一周忌' },
        { portugues: '3 anos', japones: '三回忌' },
        { portugues: '7 anos', japones: '七回忌' },
        { portugues: '13 anos', japones: '十三回忌' },
        { portugues: '17 anos', japones: '十七回忌' },
        { portugues: '23 anos', japones: '二十三回忌' },
        { portugues: '27 anos', japones: '二十七回忌' },
        { portugues: '33 anos', japones: '三十三回忌' },
        { portugues: '50 anos', japones: '五十回忌' }
    ]);

    const PERIODOS_ANTIGOS = Object.freeze({
        '初七日': '初七日忌',
        '二七日': '二七日忌',
        '三七日': '三七日忌',
        '四七日': '四七日忌',
        '五七日': '五七日忌',
        '六七日': '六七日忌',
        '四十九日': '四十九日忌',
        '百箇日': '百箇日忌'
    });

    const DESIGN_W = 1794;
    const DESIGN_H = 787;
    const LARGURA_EXPORTACAO = 3104;
    const MAX_HISTORY = 10;
    const REGEX_VERTICAL_EM_PE = /[⺀-鿿　-〿＀-￯]/;
    const POSICOES_PADRAO = Object.freeze({
        'relacao-container': { left: 846, top: 66 },
        'missa-container': { left: 845, top: 167 },
        'nomeFalecidoJapones-container': { left: 920, top: 80 },
        'nomeFamiliaJapones-container': { left: 852, top: 445 },
        'texto-fixo': { left: Math.round((DESIGN_W - 800) / 2), top: 611 }
    });

    let escalaAtual = 1;
    let mensagemAutomatica = true;
    let historyData = carregarHistorico();

    function carregarHistorico() {
        try {
            const salvo = JSON.parse(localStorage.getItem('noshigamiHistory') || '[]');
            return Array.isArray(salvo) ? salvo : [];
        } catch (erro) {
            console.warn('Histórico inválido ignorado:', erro);
            return [];
        }
    }

    function showLoading() {
        loadingSpinner.classList.add('show');
    }

    function hideLoading() {
        loadingSpinner.classList.remove('show');
    }

    function showFeedback(message, type = 'info', duration = 3500) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `feedback-message ${type} show`;
        window.setTimeout(() => feedbackMessage.classList.remove('show'), duration);
    }

    function aplicarPosicoesPadrao() {
        Object.entries(POSICOES_PADRAO).forEach(([id, posicao]) => {
            const elemento = document.getElementById(id);
            if (!elemento) return;
            elemento.style.left = posicao.left + 'px';
            elemento.style.top = posicao.top + 'px';
        });
    }

    function atualizarEscala() {
        if (!stage || !canvas || !stage.clientWidth) return;
        escalaAtual = stage.clientWidth / DESIGN_W;
        canvas.style.transform = `scale(${escalaAtual})`;
        stage.style.height = (DESIGN_H * escalaAtual) + 'px';
    }

    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('noshigamiTheme', theme);
    }

    window.toggleTheme = function () {
        const atual = document.body.getAttribute('data-theme') || 'light';
        applyTheme(atual === 'dark' ? 'light' : 'dark');
    };

    window.toggleHelp = function () {
        helpModal.classList.toggle('show');
    };

    window.toggleHistory = function () {
        historyPanel.classList.toggle('open');
        if (historyPanel.classList.contains('open')) updateHistoryDisplay();
    };

    function periodoMigrado(valor) {
        return PERIODOS_ANTIGOS[valor] || valor || '';
    }

    function sincronizarPorPortugues() {
        const item = PERIODOS.find(periodo => periodo.portugues === elementos.periodoNumeral.value);
        elementos.periodo.value = item ? item.japones : '';
    }

    function sincronizarPorJapones() {
        const item = PERIODOS.find(periodo => periodo.japones === elementos.periodo.value);
        elementos.periodoNumeral.value = item ? item.portugues : '';
    }

    function mensagemPadrao() {
        return `Missa de ${elementos.periodoNumeral.value} de ${elementos.nomeFalecido.value}.\n` +
            `A Família ${elementos.nomeFamilia.value} agradece as condolências recebidas`;
    }

    function atualizarMensagemAutomatica() {
        if (mensagemAutomatica) elementos.mensagem.value = mensagemPadrao();
    }

    function updatePreview() {
        atualizarMensagemAutomatica();
        elementos.periodoPreview.textContent = elementos.periodo.value;
        elementos.nomeFalecidoJaponesPreview.textContent = elementos.nomeFalecidoJapones.value;
        elementos.nomeFamiliaJaponesPreview.textContent = elementos.nomeFamiliaJapones.value
            ? elementos.nomeFamiliaJapones.value + '家'
            : '';
        elementos.relacaoPreview.textContent = elementos.relacao.value;
        elementos.mensagemPreview.textContent = elementos.mensagem.value;
        elementos.textoFixo.style.display = elementos.mostrarMensagem.checked ? 'block' : 'none';
        botoes.alternarMensagem.textContent = elementos.mostrarMensagem.checked
            ? 'Ocultar Mensagem'
            : 'Mostrar Mensagem';
    }

    function dadosAtuais() {
        return {
            nomeFalecido: elementos.nomeFalecido.value,
            nomeFalecidoJapones: elementos.nomeFalecidoJapones.value,
            periodonumeral: elementos.periodoNumeral.value,
            periodo: elementos.periodo.value,
            relacao: elementos.relacao.value,
            nomeFamilia: elementos.nomeFamilia.value,
            nomeFamiliaJapones: elementos.nomeFamiliaJapones.value,
            mensagem: elementos.mensagem.value,
            mostrarMensagem: elementos.mostrarMensagem.checked
        };
    }

    function updateHistoryDisplay() {
        historyList.replaceChildren();
        if (!historyData.length) {
            const vazio = document.createElement('p');
            vazio.textContent = 'Nenhum item no histórico.';
            vazio.style.textAlign = 'center';
            vazio.style.color = '#888';
            historyList.appendChild(vazio);
            return;
        }

        historyData.slice().reverse().forEach(item => {
            const entrada = document.createElement('button');
            entrada.type = 'button';
            entrada.className = 'history-item';
            const nome = document.createElement('strong');
            nome.textContent = item.nomeFalecido || 'N/A';
            const resumo = document.createElement('small');
            resumo.textContent = `${item.periodonumeral || 'N/A'} - ${item.nomeFamilia || 'N/A'}`;
            const data = document.createElement('small');
            data.className = 'timestamp';
            data.textContent = `Salvo em: ${new Date(item.timestamp).toLocaleString('pt-BR')}`;
            entrada.append(nome, document.createElement('br'), resumo, document.createElement('br'), data);
            entrada.addEventListener('click', () => loadFromHistory(item.id));
            historyList.appendChild(entrada);
        });
    }

    function loadFromHistory(id) {
        const data = historyData.find(item => item.id === id);
        if (!data) return;
        elementos.nomeFalecido.value = data.nomeFalecido || '';
        elementos.nomeFalecidoJapones.value = data.nomeFalecidoJapones || '';
        elementos.periodoNumeral.value = data.periodonumeral || '';
        elementos.periodo.value = periodoMigrado(data.periodo);
        elementos.relacao.value = data.relacao == null ? '亡' : data.relacao;
        elementos.nomeFamilia.value = data.nomeFamilia || '';
        elementos.nomeFamiliaJapones.value = data.nomeFamiliaJapones || '';
        if (Object.prototype.hasOwnProperty.call(data, 'mensagem')) {
            elementos.mensagem.value = data.mensagem || '';
            mensagemAutomatica = false;
        } else {
            mensagemAutomatica = true;
            elementos.mensagem.value = mensagemPadrao();
        }
        elementos.mostrarMensagem.checked = data.mostrarMensagem !== false;
        updatePreview();
        historyPanel.classList.remove('open');
        showFeedback('Dados carregados do histórico.', 'success');
    }

    function saveToHistory() {
        const atual = { id: Date.now(), ...dadosAtuais(), timestamp: new Date().toISOString() };
        const campos = [
            'nomeFalecido', 'nomeFalecidoJapones', 'periodonumeral', 'periodo', 'relacao',
            'nomeFamilia', 'nomeFamiliaJapones', 'mensagem', 'mostrarMensagem'
        ];
        const duplicado = historyData.some(item => campos.every(campo => item[campo] === atual[campo]));
        if (duplicado) return;
        historyData.push(atual);
        if (historyData.length > MAX_HISTORY) historyData.shift();
        try {
            localStorage.setItem('noshigamiHistory', JSON.stringify(historyData));
        } catch (erro) {
            console.warn('Não foi possível salvar o histórico:', erro);
            showFeedback('Imagem salva, mas o histórico não pôde ser atualizado.', 'info', 5000);
        }
        updateHistoryDisplay();
    }

    function validateForm() {
        let valido = true;
        document.querySelectorAll('.required').forEach(campo => {
            const vazio = !String(campo.value || '').trim();
            campo.classList.toggle('error-field', vazio);
            if (vazio) valido = false;
        });
        return valido;
    }

    function makeDraggable(element) {
        let inicioX = 0;
        let inicioY = 0;
        let origemLeft = 0;
        let origemTop = 0;
        let arrastando = false;
        element.addEventListener('pointerdown', function (evento) {
            if (evento.button !== 0 && evento.pointerType === 'mouse') return;
            evento.preventDefault();
            arrastando = true;
            inicioX = evento.clientX;
            inicioY = evento.clientY;
            origemLeft = parseFloat(element.style.left) || 0;
            origemTop = parseFloat(element.style.top) || 0;
            element.setPointerCapture(evento.pointerId);
            element.classList.add('dragging');
        });
        element.addEventListener('pointermove', function (evento) {
            if (!arrastando) return;
            evento.preventDefault();
            const escala = escalaAtual || 1;
            const deltaX = (evento.clientX - inicioX) / escala;
            const deltaY = (evento.clientY - inicioY) / escala;
            const margem = 20;
            const novoLeft = Math.min(Math.max(origemLeft + deltaX, -margem), DESIGN_W - element.offsetWidth + margem);
            const novoTop = Math.min(Math.max(origemTop + deltaY, -margem), DESIGN_H - element.offsetHeight + margem);
            element.style.left = novoLeft + 'px';
            element.style.top = novoTop + 'px';
        });
        function encerrar(evento) {
            if (!arrastando) return;
            arrastando = false;
            if (element.hasPointerCapture && element.hasPointerCapture(evento.pointerId)) {
                element.releasePointerCapture(evento.pointerId);
            }
            element.classList.remove('dragging');
        }
        element.addEventListener('pointerup', encerrar);
        element.addEventListener('pointercancel', encerrar);
    }

    function* caracteresDe(elemento) {
        const passeio = document.createTreeWalker(elemento, NodeFilter.SHOW_TEXT);
        let no;
        while ((no = passeio.nextNode())) {
            const texto = no.nodeValue;
            let indice = 0;
            while (indice < texto.length) {
                const caractere = String.fromCodePoint(texto.codePointAt(indice));
                const passo = caractere.length;
                if (caractere.trim()) {
                    const faixa = document.createRange();
                    faixa.setStart(no, indice);
                    faixa.setEnd(no, indice + passo);
                    const caixa = faixa.getBoundingClientRect();
                    if (caixa.width || caixa.height) yield { ch: caractere, caixa: caixa };
                }
                indice += passo;
            }
        }
    }

    function desenharBloco(ctx, elemento, caixaCanvas, escalaLayout) {
        if (getComputedStyle(elemento).display === 'none') return;
        const estilo = getComputedStyle(elemento);
        const vertical = estilo.writingMode.indexOf('vertical') === 0;
        const corpo = parseFloat(estilo.fontSize);
        ctx.fillStyle = estilo.color;
        ctx.font = `${estilo.fontStyle} ${estilo.fontWeight} ${corpo}px ${estilo.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const { ch, caixa } of caracteresDe(elemento)) {
            const cx = (caixa.left + caixa.width / 2 - caixaCanvas.left) / escalaLayout;
            const cy = (caixa.top + caixa.height / 2 - caixaCanvas.top) / escalaLayout;
            if (vertical && !REGEX_VERTICAL_EM_PE.test(ch)) {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(Math.PI / 2);
                ctx.fillText(ch, 0, 0);
                ctx.restore();
            } else {
                ctx.fillText(ch, cx, cy);
            }
        }
    }

    function montarImagem(escala) {
        const tela = document.createElement('canvas');
        tela.width = Math.round(DESIGN_W * escala);
        tela.height = Math.round(DESIGN_H * escala);
        const ctx = tela.getContext('2d');
        ctx.scale(escala, escala);
        ctx.drawImage(document.getElementById('imagemPreview'), 0, 0, DESIGN_W, DESIGN_H);
        const caixaCanvas = canvas.getBoundingClientRect();
        const escalaLayout = caixaCanvas.width / DESIGN_W;
        canvas.querySelectorAll('.draggable').forEach(elemento => desenharBloco(ctx, elemento, caixaCanvas, escalaLayout));
        return tela;
    }

    window.__montar = montarImagem;
    window.__periodos = PERIODOS;

    function nomeSeguro(valor) {
        return String(valor || 'geral').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_') || 'geral';
    }

    function nomeDoArquivo(extensao) {
        return `Noshigami_${nomeSeguro(elementos.nomeFalecido.value)}_${Date.now()}.${extensao}`;
    }

    function baixarBlob(blob, nomeArquivo) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function baixarImagem(tela, nomeArquivo) {
        return new Promise((resolver, rejeitar) => {
            tela.toBlob(blob => {
                if (!blob) return rejeitar(new Error('Canvas vazio.'));
                baixarBlob(blob, nomeArquivo);
                resolver();
            }, 'image/png');
        });
    }

    async function capturar(validar) {
        if (validar && !validateForm()) {
            showFeedback('Preencha os campos obrigatórios marcados em vermelho.', 'error');
            return;
        }
        showLoading();
        try {
            await document.fonts.ready;
            const tela = montarImagem(LARGURA_EXPORTACAO / DESIGN_W);
            await baixarImagem(tela, nomeDoArquivo('png'));
            if (validar) saveToHistory();
            showFeedback('Imagem gerada com sucesso.', 'success');
        } catch (erro) {
            console.error('Falha ao gerar a imagem:', erro);
            showFeedback('Não foi possível gerar a imagem.', 'error', 6000);
        } finally {
            hideLoading();
        }
    }

    function exportarTxt() {
        const dados = dadosAtuais();
        const conteudo = [
            'Dados do Noshigami (Tenman-ya):',
            '--------------------------------------',
            `Nome do Falecido: ${dados.nomeFalecido || 'Não preenchido'}`,
            `Nome do Falecido (Japonês): ${dados.nomeFalecidoJapones || 'Não preenchido'}`,
            `Período (Numeral): ${dados.periodonumeral || 'Não preenchido'}`,
            `Período (Japonês): ${dados.periodo || 'Não preenchido'}`,
            `Título/Parentesco: ${dados.relacao || 'Não exibir'}`,
            `Nome da Família: ${dados.nomeFamilia || 'Não preenchido'}`,
            `Nome da Família (Japonês): ${dados.nomeFamiliaJapones || 'Não preenchido'}`,
            `Mensagem visível: ${dados.mostrarMensagem ? 'Sim' : 'Não'}`,
            'Mensagem:', dados.mensagem || 'Não preenchida',
            '--------------------------------------',
            `Exportado em: ${new Date().toLocaleString('pt-BR')}`
        ].join('\n');
        baixarBlob(new Blob([conteudo], { type: 'text/plain;charset=utf-8' }), `dados_${nomeDoArquivo('txt')}`);
        showFeedback('Dados exportados para TXT.', 'success');
    }

    async function exportarDocx() {
        if (!validateForm()) {
            showFeedback('Preencha os campos obrigatórios antes de exportar para Word.', 'error');
            return;
        }
        showLoading();
        try {
            if (!window.NoshigamiDocx) throw new Error('Módulo de exportação DOCX indisponível.');
            const dados = dadosAtuais();
            const blob = await window.NoshigamiDocx.gerarDocx(window.JSZip, window.NOSHIGAMI_DOCX_TEMPLATE, {
                nomeFalecidoJapones: dados.nomeFalecidoJapones,
                nomeFamiliaJapones: dados.nomeFamiliaJapones,
                relacao: dados.relacao,
                periodoJapones: dados.periodo,
                mensagem: dados.mensagem,
                mostrarMensagem: dados.mostrarMensagem
            }, 'blob');
            baixarBlob(blob, nomeDoArquivo('docx'));
            saveToHistory();
            showFeedback('Documento Word editável exportado.', 'success');
        } catch (erro) {
            console.error('Falha ao exportar DOCX:', erro);
            showFeedback('Não foi possível exportar o documento Word.', 'error', 6000);
        } finally {
            hideLoading();
        }
    }

    function dataLocalIso() {
        const agora = new Date();
        return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    }

    function formatarDataTermo(valor) {
        if (!valor) return '';
        const [ano, mes, dia] = valor.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function limparModoImpressao() {
        document.body.classList.remove('print-noshigami', 'print-aprovacao');
        const estilo = document.getElementById('print-page-style');
        if (estilo) estilo.remove();
        elementos.printArea.setAttribute('aria-hidden', 'true');
    }

    async function imprimir(modo) {
        if (!validateForm()) {
            showFeedback('Preencha os campos obrigatórios antes de imprimir.', 'error');
            return;
        }
        if (modo === 'aprovacao' && (!elementos.nomeCliente.value.trim() || !elementos.dataTermo.value || !elementos.aceiteTermo.checked)) {
            elementos.termo.hidden = false;
            botoes.alternarTermo.textContent = 'Ocultar Termo';
            botoes.alternarTermo.setAttribute('aria-expanded', 'true');
            showFeedback('Informe cliente e data e confirme o aceite do termo.', 'error', 5000);
            elementos.termo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const aviso = modo === 'aprovacao'
            ? 'Será aberta a impressão A3 paisagem. Use escala 100% e desative cabeçalhos e rodapés. Continuar?'
            : 'Será aberta a impressão em papel personalizado 36,5 × 16 cm. Use escala 100% e desative cabeçalhos e rodapés. Continuar?';
        if (!window.confirm(aviso)) return;
        showLoading();
        try {
            await document.fonts.ready;
            const tela = montarImagem(LARGURA_EXPORTACAO / DESIGN_W);
            elementos.printImagem.src = tela.toDataURL('image/png');
            if (elementos.printImagem.decode) await elementos.printImagem.decode();
            elementos.printNomeCliente.textContent = elementos.nomeCliente.value;
            elementos.printDataTermo.textContent = formatarDataTermo(elementos.dataTermo.value);
            elementos.printArea.setAttribute('aria-hidden', 'false');
            document.body.classList.add(modo === 'aprovacao' ? 'print-aprovacao' : 'print-noshigami');
            const estilo = document.createElement('style');
            estilo.id = 'print-page-style';
            estilo.textContent = modo === 'aprovacao'
                ? '@page { size: A3 landscape; margin: 0; }'
                : '@page { size: 36.5cm 16cm; margin: 0; }';
            document.head.appendChild(estilo);
            window.addEventListener('afterprint', limparModoImpressao, { once: true });
            window.print();
        } catch (erro) {
            limparModoImpressao();
            console.error('Falha ao preparar impressão:', erro);
            showFeedback('Não foi possível preparar a impressão.', 'error', 6000);
        } finally {
            hideLoading();
        }
    }

    botoes.salvar.addEventListener('click', () => capturar(true));
    botoes.capturar.addEventListener('click', () => capturar(false));
    botoes.exportarTxt.addEventListener('click', exportarTxt);
    botoes.exportarDocx.addEventListener('click', exportarDocx);
    botoes.imprimirNoshigami.addEventListener('click', () => imprimir('noshigami'));
    botoes.imprimirAprovacao.addEventListener('click', () => imprimir('aprovacao'));

    botoes.restaurarPosicoes.addEventListener('click', function () {
        aplicarPosicoesPadrao();
        showFeedback('Posições restauradas para o padrão.', 'success');
    });
    botoes.alternarMensagem.addEventListener('click', function () {
        elementos.mostrarMensagem.checked = !elementos.mostrarMensagem.checked;
        updatePreview();
        showFeedback(elementos.mostrarMensagem.checked ? 'Mensagem exibida.' : 'Mensagem oculta.', 'info');
    });
    botoes.restaurarMensagem.addEventListener('click', function () {
        mensagemAutomatica = true;
        elementos.mostrarMensagem.checked = true;
        updatePreview();
        showFeedback('Mensagem padrão restaurada.', 'success');
    });
    botoes.alternarTermo.addEventListener('click', function () {
        elementos.termo.hidden = !elementos.termo.hidden;
        const aberto = !elementos.termo.hidden;
        botoes.alternarTermo.textContent = aberto ? 'Ocultar Termo' : 'Mostrar Termo';
        botoes.alternarTermo.setAttribute('aria-expanded', String(aberto));
    });
    botoes.limpar.addEventListener('click', function () {
        if (!window.confirm('Deseja realmente limpar todos os campos?')) return;
        elementos.nomeFalecido.value = '';
        elementos.nomeFalecidoJapones.value = '';
        elementos.periodoNumeral.value = '';
        elementos.periodo.value = '';
        elementos.relacao.value = '亡';
        elementos.nomeFamilia.value = '';
        elementos.nomeFamiliaJapones.value = '';
        elementos.nomeCliente.value = '';
        elementos.dataTermo.value = dataLocalIso();
        elementos.aceiteTermo.checked = false;
        elementos.mostrarMensagem.checked = true;
        mensagemAutomatica = true;
        document.querySelectorAll('.error-field').forEach(campo => campo.classList.remove('error-field'));
        aplicarPosicoesPadrao();
        updatePreview();
        showFeedback('Campos limpos e posições restauradas.', 'success');
    });

    [elementos.nomeFalecido, elementos.nomeFamilia, elementos.nomeFalecidoJapones, elementos.nomeFamiliaJapones]
        .forEach(campo => campo.addEventListener('input', updatePreview));
    elementos.periodoNumeral.addEventListener('change', function () {
        sincronizarPorPortugues();
        updatePreview();
    });
    elementos.periodo.addEventListener('change', function () {
        sincronizarPorJapones();
        updatePreview();
    });
    elementos.relacao.addEventListener('change', updatePreview);
    elementos.mostrarMensagem.addEventListener('change', updatePreview);
    elementos.mensagem.addEventListener('input', function () {
        mensagemAutomatica = false;
        updatePreview();
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.ctrlKey && evento.key.toLowerCase() === 's') {
            evento.preventDefault();
            botoes.salvar.click();
        }
        if (evento.ctrlKey && evento.key.toLowerCase() === 'l') {
            evento.preventDefault();
            botoes.limpar.click();
        }
        if (evento.ctrlKey && evento.key.toLowerCase() === 'h') {
            evento.preventDefault();
            window.toggleHistory();
        }
        if (evento.key === 'F1') {
            evento.preventDefault();
            window.toggleHelp();
        }
        if (evento.key === 'Escape') {
            if (helpModal.classList.contains('show')) window.toggleHelp();
            else if (historyPanel.classList.contains('open')) window.toggleHistory();
        }
    });
    window.addEventListener('click', function (evento) {
        if (evento.target === helpModal) window.toggleHelp();
    });

    function initializeApp() {
        try {
            applyTheme(localStorage.getItem('noshigamiTheme') || 'light');
        } catch (erro) {
            document.body.setAttribute('data-theme', 'light');
            console.warn('Não foi possível carregar o tema salvo:', erro);
        }
        if (window.NOSHIGAMI_FUNDO) document.getElementById('imagemPreview').src = window.NOSHIGAMI_FUNDO;
        elementos.dataTermo.value = dataLocalIso();
        aplicarPosicoesPadrao();
        atualizarEscala();
        document.querySelectorAll('.draggable').forEach(makeDraggable);
        updatePreview();
        updateHistoryDisplay();
        if (window.ResizeObserver && stage) new ResizeObserver(atualizarEscala).observe(stage);
        window.addEventListener('resize', atualizarEscala);
        document.fonts.ready.then(atualizarEscala).catch(erro => {
            console.warn('Não foi possível confirmar o carregamento das fontes:', erro);
        });
    }

    initializeApp();
});
