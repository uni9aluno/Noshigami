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
        confirmarJapones: document.getElementById('confirmarJapones'),
        termo: document.getElementById('termo-compromisso'),
        printArea: document.getElementById('print-area'),
        printImagem: document.getElementById('print-noshigami-image'),
        printNomeCliente: document.getElementById('print-nome-cliente'),
        printDataTermo: document.getElementById('print-data-termo'),
        printLeitura: document.getElementById('print-leitura'),
        leituraCliente: document.getElementById('leitura-cliente')
    };

    const botoes = {
        salvar: document.getElementById('tirar-print'),
        alternarMensagem: document.getElementById('ocultar-traducao'),
        restaurarMensagem: document.getElementById('restaurar-mensagem'),
        limpar: document.getElementById('limpar-campos'),
        restaurarPosicoes: document.getElementById('restaurar-posicoes'),
        telaCheia: document.getElementById('tela-cheia'),
        sairTelaCheia: document.getElementById('sair-tela-cheia'),
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
    const fluxo = {
        statusDados: document.getElementById('status-dados'),
        statusRevisao: document.getElementById('status-revisao'),
        statusFinalizacao: document.getElementById('status-finalizacao'),
        checkObrigatorios: document.getElementById('check-obrigatorios'),
        checkJapones: document.getElementById('check-japones'),
        resumoFinalizacao: document.getElementById('resumo-finalizacao')
    };

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

    // A mensagem padrão está sempre presente; o que ainda não foi preenchido
    // aparece como marcador ("[nome do falecido]") em vez de lacuna, que
    // antes gerava "Missa de de .". A impressão continua bloqueada até os
    // campos obrigatórios serem preenchidos, então o marcador não sai na peça.
    function mensagemPadrao() {
        const periodo = elementos.periodoNumeral.value.trim() || '[período]';
        const falecido = elementos.nomeFalecido.value.trim() || '[nome do falecido]';
        const familia = elementos.nomeFamilia.value.trim() || '[família]';
        return `Missa de ${periodo} de ${falecido}.\n` +
            `A Família ${familia} agradece as condolências recebidas`;
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
        atualizarStatusJapones();
        elementos.mensagemPreview.textContent = elementos.mensagem.value;
        elementos.textoFixo.style.display = elementos.mostrarMensagem.checked ? 'block' : 'none';
        botoes.alternarMensagem.textContent = elementos.mostrarMensagem.checked
            ? 'Ocultar Mensagem'
            : 'Mostrar Mensagem';
        atualizarFluxo();
    }

    function definirEstado(elemento, texto, estado) {
        elemento.textContent = texto;
        elemento.classList.remove('complete', 'warning', 'blocked', 'ready');
        if (estado) elemento.classList.add(estado);
    }

    function atualizarFluxo() {
        const obrigatorios = [elementos.nomeFalecido, elementos.nomeFamilia, elementos.periodoNumeral];
        const preenchidos = obrigatorios.filter(campo => campo.value.trim()).length;
        const dadosCompletos = preenchidos === obrigatorios.length;
        const japonesCompleto = Boolean(elementos.nomeFalecidoJapones.value.trim() && elementos.nomeFamiliaJapones.value.trim());
        const japonesRevisado = japonesCompleto && elementos.confirmarJapones.checked;
        const pronto = dadosCompletos && japonesRevisado;

        definirEstado(fluxo.statusDados, dadosCompletos ? 'Dados completos' : `${preenchidos} de 3 obrigatórios`, dadosCompletos ? 'complete' : 'blocked');
        definirEstado(fluxo.checkObrigatorios, dadosCompletos ? '✓ Dados obrigatórios completos' : `○ Dados obrigatórios: ${preenchidos}/3`, dadosCompletos ? 'complete' : 'blocked');
        if (!japonesCompleto) {
            definirEstado(fluxo.statusRevisao, 'Nomes japoneses pendentes', 'blocked');
            definirEstado(fluxo.checkJapones, '⚠ Informe os dois nomes japoneses', 'warning');
        } else if (!elementos.confirmarJapones.checked) {
            definirEstado(fluxo.statusRevisao, 'Aguardando confirmação', 'warning');
            definirEstado(fluxo.checkJapones, '⚠ Confirme a revisão japonesa', 'warning');
        } else {
            definirEstado(fluxo.statusRevisao, 'Modelo revisado', 'complete');
            definirEstado(fluxo.checkJapones, '✓ Nomes japoneses revisados', 'complete');
        }
        definirEstado(fluxo.statusFinalizacao, pronto ? 'Pronto para finalizar' : 'Ação necessária', pronto ? 'complete' : 'blocked');
        fluxo.resumoFinalizacao.textContent = pronto
            ? 'Tudo pronto. Escolha abaixo como salvar, imprimir ou exportar o Noshigami.'
            : !dadosCompletos
                ? `Faltam ${3 - preenchidos} campo(s) obrigatório(s) na etapa 1.`
                : !japonesCompleto
                    ? 'Informe os dois nomes em japonês antes de finalizar.'
                    : 'Marque a confirmação de revisão japonesa para liberar as saídas finais.';
        fluxo.resumoFinalizacao.classList.toggle('ready', pronto);

        [botoes.salvar, botoes.exportarDocx, botoes.imprimirNoshigami, botoes.imprimirAprovacao].forEach(botao => {
            botao.disabled = !pronto;
            botao.title = pronto ? '' : fluxo.resumoFinalizacao.textContent;
        });
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
        Object.keys(CAMPOS_JAPONESES).forEach(campo => {
            const temValor = Boolean(elementos[campo].value.trim());
            origemJapones[campo] = temValor ? 'memoria' : 'auto';
            registroUsado[campo] = temValor ? { aprovado: false, atualizadoEm: data.timestamp } : null;
        });
        familiaAutomatica = !elementos.nomeFamilia.value.trim() || elementos.nomeFamilia.value.trim() === sobrenomeDe(elementos.nomeFalecido.value);
        if (!elementos.nomeFalecidoJapones.value.trim() || !elementos.nomeFamiliaJapones.value.trim()) preencherJapones();
        // Mensagem guardada igual à padrão continua automática: assim ela
        // acompanha os nomes se o vendedor mudar algo, sem reescrever.
        if (Object.prototype.hasOwnProperty.call(data, 'mensagem') && data.mensagem !== mensagemPadrao()) {
            elementos.mensagem.value = data.mensagem || '';
            mensagemAutomatica = false;
        } else {
            mensagemAutomatica = true;
            elementos.mensagem.value = mensagemPadrao();
        }
        elementos.mostrarMensagem.checked = data.mostrarMensagem !== false;
        elementos.confirmarJapones.checked = false;
        updatePreview();
        historyPanel.classList.remove('open');
        showFeedback('Dados carregados do histórico.', 'success');
    }

    function saveToHistory() {
        registrarNaMemoria(false);
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
            showFeedback('Arquivo salvo, mas o histórico não pôde ser atualizado.', 'info', 5000);
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
            if (document.fullscreenElement) return; // na tela do cliente nada se move
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

    async function imprimir(modo, destino = 'impressao') {
        if (!validateForm()) {
            const acao = destino === 'pdf' ? 'salvar em PDF' : 'imprimir';
            showFeedback(`Preencha os campos obrigatórios antes de ${acao}.`, 'error');
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
        const aviso = destino === 'pdf'
            ? 'Será aberta a janela de impressão. Em Destino, escolha "Salvar como PDF", use escala 100% e desative cabeçalhos e rodapés. Continuar?'
            : modo === 'aprovacao'
            ? 'Será aberta a impressão A3 paisagem. Use escala 100% e desative cabeçalhos e rodapés. Continuar?'
            : 'Será aberta a impressão em papel personalizado 36,5 × 16 cm. Use escala 100% e desative cabeçalhos e rodapés. Continuar?';
        if (!window.confirm(aviso)) return;
        // A folha de aprovação é assinada pelo cliente: o registro na memória
        // passa a valer como grafia aprovada pela família.
        registrarNaMemoria(modo === 'aprovacao');
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
            if (destino === 'pdf') saveToHistory();
            window.print();
        } catch (erro) {
            limparModoImpressao();
            console.error('Falha ao preparar impressão:', erro);
            showFeedback('Não foi possível preparar a impressão.', 'error', 6000);
        } finally {
            hideLoading();
        }
    }

    botoes.salvar.addEventListener('click', () => imprimir('noshigami', 'pdf'));
    botoes.exportarTxt.addEventListener('click', exportarTxt);
    botoes.exportarDocx.addEventListener('click', exportarDocx);
    botoes.imprimirNoshigami.addEventListener('click', () => imprimir('noshigami'));
    botoes.imprimirAprovacao.addEventListener('click', () => imprimir('aprovacao'));

    /* =======================================================================
       NOMES EM JAPONÊS AUTOMÁTICOS + MEMÓRIA DA LOJA
       -----------------------------------------------------------------------
       Quem atende no balcão não sabe japonês. Por isso o vendedor só digita em
       português e o app preenche os campos japoneses sozinho, nesta ordem:
         1. memória da loja: o que a família já aprovou em atendimento anterior
            (as missas se repetem: 7º dia, 49º dia, 1 ano, 3 anos...);
         2. katakana gerado pelo conversor local.
       Se alguém digitar no campo japonês, o texto é respeitado ("manual") até
       que se clique em "Voltar ao automático". A memória é gravada sozinha ao
       imprimir, salvar em PDF ou exportar; a impressão de aprovação marca o
       registro como aprovado pelo cliente.
       ======================================================================= */
    const CHAVE_MEMORIA = 'noshigamiMemoria';
    const MAX_MEMORIA = 2000;
    const CAMPOS_JAPONESES = {
        nomeFalecidoJapones: { portugues: 'nomeFalecido', memoria: 'nomeFalecidoJapones' },
        nomeFamiliaJapones: { portugues: 'nomeFamilia', memoria: 'nomeFamiliaJapones' }
    };
    // De onde veio o texto de cada campo japonês: 'auto' | 'memoria' | 'manual'.
    const origemJapones = { nomeFalecidoJapones: 'auto', nomeFamiliaJapones: 'auto' };
    const registroUsado = { nomeFalecidoJapones: null, nomeFamiliaJapones: null };
    let memoria = carregarMemoria();
    let ultimoRegistroAvisado = '';

    function normalizarNome(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function carregarMemoria() {
        try {
            const salva = JSON.parse(localStorage.getItem(CHAVE_MEMORIA) || '[]');
            return Array.isArray(salva) ? salva.filter(item => item && item.nomeFalecido) : [];
        } catch (erro) {
            console.warn('Memória da loja inválida ignorada:', erro);
            return [];
        }
    }

    function gravarMemoria() {
        try {
            localStorage.setItem(CHAVE_MEMORIA, JSON.stringify(memoria));
        } catch (erro) {
            console.warn('Não foi possível gravar a memória da loja:', erro);
        }
        atualizarTotalMemoria();
    }

    function atualizarTotalMemoria() {
        const total = document.getElementById('memoria-total');
        if (total) total.textContent = `${memoria.length} ${memoria.length === 1 ? 'nome guardado' : 'nomes guardados'}`;
    }

    // Junta um registro à memória; o mais recente vai para o fim da lista.
    function mesclarNaMemoria(novo) {
        const chave = normalizarNome(novo.nomeFalecido) + '|' + normalizarNome(novo.nomeFamilia);
        const indice = memoria.findIndex(item =>
            normalizarNome(item.nomeFalecido) + '|' + normalizarNome(item.nomeFamilia) === chave);
        const anterior = indice >= 0 ? memoria.splice(indice, 1)[0] : null;
        const maisNovo = !anterior || String(novo.atualizadoEm || '') >= String(anterior.atualizadoEm || '');
        const base = maisNovo ? { ...anterior, ...novo } : { ...novo, ...anterior };
        base.aprovado = Boolean((anterior && anterior.aprovado) || novo.aprovado);
        base.aprovadoEm = (anterior && anterior.aprovadoEm) || novo.aprovadoEm || '';
        base.periodos = Array.from(new Set([...(anterior && anterior.periodos) || [], ...(novo.periodos || [])]));
        memoria.push(base);
        if (memoria.length > MAX_MEMORIA) memoria.splice(0, memoria.length - MAX_MEMORIA);
    }

    function registrarNaMemoria(aprovado) {
        const d = dadosAtuais();
        if (!d.nomeFalecido.trim() || !(d.nomeFalecidoJapones.trim() || d.nomeFamiliaJapones.trim())) return;
        const agora = new Date().toISOString();
        mesclarNaMemoria({
            nomeFalecido: d.nomeFalecido.trim(),
            nomeFamilia: d.nomeFamilia.trim(),
            nomeFalecidoJapones: d.nomeFalecidoJapones.trim(),
            nomeFamiliaJapones: d.nomeFamiliaJapones.trim(),
            relacao: d.relacao,
            periodos: d.periodonumeral ? [d.periodonumeral] : [],
            aprovado: Boolean(aprovado),
            aprovadoEm: aprovado ? agora : '',
            atualizadoEm: agora
        });
        gravarMemoria();
    }

    // Atendimento anterior do mesmo falecido. Com a família digitada, ela
    // precisa bater; sem ela, vale o atendimento mais recente.
    function buscarFalecido() {
        const falecido = normalizarNome(elementos.nomeFalecido.value);
        if (falecido.length < 3) return null;
        // Família derivada do sobrenome não serve de filtro: a família do
        // registro pode ser outra (ex.: nora com o sobrenome do marido).
        const familia = familiaAutomatica ? '' : normalizarNome(elementos.nomeFamilia.value);
        for (let i = memoria.length - 1; i >= 0; i -= 1) {
            const item = memoria[i];
            if (normalizarNome(item.nomeFalecido) !== falecido) continue;
            if (familia && normalizarNome(item.nomeFamilia) !== familia) continue;
            return item;
        }
        return null;
    }

    // A família pode ter sido atendida por outro falecido: o nome dela em
    // japonês (às vezes em kanji, como 山田) continua valendo.
    function buscarFamilia() {
        const familia = normalizarNome(elementos.nomeFamilia.value);
        if (familia.length < 2) return null;
        for (let i = memoria.length - 1; i >= 0; i -= 1) {
            const item = memoria[i];
            if (normalizarNome(item.nomeFamilia) === familia && item.nomeFamiliaJapones) return item;
        }
        return null;
    }

    function katakanaAutomatico(valor) {
        if (!valor.trim() || !window.NoshigamiKatakana) return '';
        try {
            return window.NoshigamiKatakana.sugerir(valor);
        } catch (erro) {
            console.warn('Sem katakana automático para:', valor, erro);
            return '';
        }
    }

    /* Nome da família preenchido sozinho com o sobrenome do falecido
       ("Shigeru Watanabe" → "Watanabe", "Maria das Dores da Silva" → "Silva")
       enquanto o vendedor não digitar outra coisa nele. */
    let familiaAutomatica = true;
    function sobrenomeDe(nomeCompleto) {
        const palavras = nomeCompleto.replace(/\s+/g, ' ').trim().split(' ')
            .filter(palavra => !PARTICULAS.has(palavra.toLowerCase()));
        return palavras.length > 1 ? palavras[palavras.length - 1] : '';
    }
    function preencherFamiliaAutomatica() {
        if (familiaAutomatica) elementos.nomeFamilia.value = sobrenomeDe(elementos.nomeFalecido.value);
    }

    /* alterados: campos em português que acabaram de mudar. Um nome
       escolhido pelo cliente só é refeito se o nome em português dele mudou. */
    function preencherJapones(alterados) {
        const falecido = buscarFalecido();
        if (falecido) {
            // Mesma pessoa digitada sem capricho ("shigeru watanabe"): usa a grafia guardada.
            if (elementos.nomeFalecido.value.trim() !== falecido.nomeFalecido) elementos.nomeFalecido.value = falecido.nomeFalecido;
            if (falecido.nomeFamilia && (familiaAutomatica || !elementos.nomeFamilia.value.trim())) {
                elementos.nomeFamilia.value = falecido.nomeFamilia;
            }
            // O parentesco é do falecido: só troca se ainda estiver no padrão.
            if (elementos.relacao.value === '亡' && falecido.relacao != null) elementos.relacao.value = falecido.relacao;
        }
        const familia = falecido && falecido.nomeFamiliaJapones ? falecido : buscarFamilia();
        const registros = { nomeFalecidoJapones: falecido, nomeFamiliaJapones: familia };

        Object.entries(CAMPOS_JAPONESES).forEach(([campo, config]) => {
            if (origemJapones[campo] === 'manual') return;
            if (origemJapones[campo] === 'cliente' && alterados && !alterados.includes(config.portugues)) return;
            const registro = registros[campo];
            if (registro && registro[config.memoria]) {
                elementos[campo].value = registro[config.memoria];
                origemJapones[campo] = 'memoria';
                registroUsado[campo] = registro;
            } else {
                elementos[campo].value = katakanaAutomatico(elementos[config.portugues].value);
                origemJapones[campo] = 'auto';
                registroUsado[campo] = null;
            }
        });

        const encontrado = falecido || familia;
        const chaveAviso = encontrado ? normalizarNome(encontrado.nomeFalecido) + '|' + normalizarNome(encontrado.nomeFamilia) : '';
        if (encontrado && chaveAviso !== ultimoRegistroAvisado) {
            showFeedback(falecido
                ? 'Atendimento anterior encontrado: nomes em japonês preenchidos da memória da loja.'
                : 'Família já atendida: nome da família em japonês preenchido da memória da loja.', 'success', 4500);
        }
        ultimoRegistroAvisado = chaveAviso;
    }

    /* Leitura em sílabas para quem não lê japonês conferir pelo som:
       ワタナベ → "Wa-ta-na-be". Kanji não tem leitura automática. */
    const KANA_PEQUENO = /[ァィゥェォャュョヮー]/;
    function leituraPortuguesa(texto) {
        const valor = String(texto || '').trim();
        if (!valor || !window.wanakana || /[^゠-ヿ぀-ゟ\s]/.test(valor)) return '';
        return valor.split(/\s+/).map(palavra => {
            const grupos = [];
            let pendente = '';
            for (const caractere of palavra) {
                if (caractere === 'ッ' || caractere === 'っ') { pendente += caractere; continue; }
                if ((KANA_PEQUENO.test(caractere) || caractere === 'ン' || caractere === 'ん') && grupos.length) {
                    grupos[grupos.length - 1] += caractere;
                    continue;
                }
                grupos.push(pendente + caractere);
                pendente = '';
            }
            const silabas = grupos.map(grupo => window.wanakana.toRomaji(grupo)
                // Ajustes para a leitura em português: シゲ é "gue", チ é "tchi".
                .replace(/ge/g, 'gue').replace(/gi/g, 'gui').replace(/chi/g, 'tchi'));
            const junto = silabas.join('-');
            return junto.charAt(0).toUpperCase() + junto.slice(1);
        }).join(' ');
    }

    function dataCurta(iso) {
        const data = new Date(iso);
        return Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR');
    }

    /* -----------------------------------------------------------------------
       ESCOLHA DO KANJI PELO CLIENTE
       Para cada palavra do nome que tem grafias conhecidas em kanji
       (kanji-nomes.js), a tela cheia mostra cartões grandes: o katakana
       ("Não sei", já marcado) e os kanji. O cliente aponta; o vendedor só
       toca e confirma. Com kanji, o nome segue a ordem japonesa — sobrenome
       primeiro e sem espaço (渡辺茂); só em katakana, fica como digitado.
       ----------------------------------------------------------------------- */
    const escolhaKanji = {
        painel: document.getElementById('escolha-kanji'),
        linhas: document.getElementById('escolha-kanji-linhas'),
        resultado: document.getElementById('escolha-resultado'),
        confirmar: document.getElementById('escolha-confirmar')
    };
    const escolhas = new Map(); // palavra normalizada → kanji escolhido ('' = katakana)
    let camposEscolha = [];

    function palavrasDe(texto) {
        return String(texto || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    }

    function ehSobrenome(palavra) {
        const chave = normalizarNome(palavra);
        if (palavrasDe(elementos.nomeFamilia.value).some(p => normalizarNome(p) === chave)) return true;
        const doFalecido = palavrasDe(elementos.nomeFalecido.value).filter(p => !PARTICULAS.has(p.toLowerCase()));
        return doFalecido.length > 1 && normalizarNome(doFalecido[doFalecido.length - 1]) === chave;
    }

    function linhasEscolhaKanji(campos) {
        if (!window.NoshigamiKanji) return [];
        const permitidos = campos || Object.keys(CAMPOS_JAPONESES).filter(c => origemJapones[c] === 'auto');
        const linhas = [];
        permitidos.forEach(campo => {
            const familia = campo === 'nomeFamiliaJapones';
            palavrasDe(elementos[CAMPOS_JAPONESES[campo].portugues].value).forEach(palavra => {
                const chave = normalizarNome(palavra);
                if (linhas.some(linha => linha.chave === chave)) return;
                const preferencia = familia || ehSobrenome(palavra) ? 'sobrenome' : 'nome';
                const { kanji } = window.NoshigamiKanji.candidatos(palavra, preferencia);
                if (kanji.length) linhas.push({ chave, palavra, kanji });
            });
        });
        return linhas;
    }

    function comporNome(campo) {
        const fonte = elementos[CAMPOS_JAPONESES[campo].portugues].value;
        const partes = palavrasDe(fonte).map(palavra => ({
            palavra,
            kanji: escolhas.get(normalizarNome(palavra)) || '',
            sobrenome: campo === 'nomeFamiliaJapones' || ehSobrenome(palavra)
        }));
        if (!partes.some(parte => parte.kanji)) return katakanaAutomatico(fonte);
        return [...partes.filter(p => p.sobrenome), ...partes.filter(p => !p.sobrenome)]
            .map(parte => parte.kanji || katakanaAutomatico(parte.palavra))
            .join('');
    }

    function atualizarResultadoEscolha() {
        const partes = camposEscolha.map(campo => {
            const nome = comporNome(campo);
            return campo === 'nomeFamiliaJapones' && nome ? nome + '家' : nome;
        }).filter(Boolean);
        escolhaKanji.resultado.textContent = partes.join('   ·   ');
    }

    function criarOpcao(linha, valor, escrita, legenda) {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'escolha-opcao';
        botao.dataset.valor = valor;
        botao.setAttribute('aria-pressed', String((escolhas.get(linha.chave) || '') === valor));
        const texto = document.createElement('span');
        texto.className = 'escrita';
        texto.textContent = escrita;
        const rotulo = document.createElement('span');
        rotulo.className = 'legenda';
        rotulo.textContent = legenda;
        botao.append(texto, rotulo);
        botao.addEventListener('click', () => {
            escolhas.set(linha.chave, valor);
            botao.parentElement.querySelectorAll('.escolha-opcao')
                .forEach(opcao => opcao.setAttribute('aria-pressed', String(opcao === botao)));
            atualizarResultadoEscolha();
        });
        return botao;
    }

    function abrirEscolhaKanji(campos) {
        camposEscolha = campos || Object.keys(CAMPOS_JAPONESES)
            .filter(c => origemJapones[c] === 'auto' || origemJapones[c] === 'cliente');
        const linhas = linhasEscolhaKanji(camposEscolha);
        if (!linhas.length) {
            abrirTelaCheia();
            return;
        }
        escolhaKanji.linhas.textContent = '';
        escolhas.clear();
        // Pré-seleciona o que já estiver nos campos (o cliente reabrindo para
        // trocar); nos demais casos começa em "Não sei".
        const atual = camposEscolha.map(c => elementos[c].value).join(' ');
        linhas.forEach(linha => {
            escolhas.set(linha.chave, linha.kanji.find(k => atual.includes(k)) || '');
            const bloco = document.createElement('div');
            bloco.className = 'escolha-linha';
            const titulo = document.createElement('p');
            titulo.className = 'escolha-palavra';
            titulo.textContent = linha.palavra;
            const opcoes = document.createElement('div');
            opcoes.className = 'escolha-opcoes';
            opcoes.append(criarOpcao(linha, '', katakanaAutomatico(linha.palavra) || linha.palavra, 'Não sei / sem kanji'));
            linha.kanji.forEach(kanji => opcoes.append(criarOpcao(linha, kanji, kanji, 'kanji')));
            bloco.append(titulo, opcoes);
            escolhaKanji.linhas.append(bloco);
        });
        atualizarResultadoEscolha();
        escolhaKanji.painel.hidden = false;
        if (!document.fullscreenElement) abrirTelaCheia();
        escolhaKanji.confirmar.focus();
    }

    escolhaKanji.confirmar.addEventListener('click', () => {
        camposEscolha.forEach(campo => {
            elementos[campo].value = comporNome(campo);
            origemJapones[campo] = 'cliente';
            registroUsado[campo] = null;
        });
        // O cliente acabou de escolher olhando a peça: a revisão está feita.
        elementos.confirmarJapones.checked = true;
        escolhaKanji.painel.hidden = true;
        updatePreview();
        showFeedback('Escolha do cliente aplicada ao Noshigami.', 'success');
    });

    // Sair da tela cheia com a escolha aberta cancela sem mudar nada.
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) escolhaKanji.painel.hidden = true;
    });

    // Kanji não tem leitura automática: nesse caso vale a pronúncia do nome
    // em português (o katakana dele), para o cliente seguir conferindo pelo som.
    function leituraDoCampo(campo) {
        const valor = elementos[campo].value;
        const direta = leituraPortuguesa(valor);
        if (direta || !valor.trim()) return direta;
        return leituraPortuguesa(katakanaAutomatico(elementos[CAMPOS_JAPONESES[campo].portugues].value));
    }

    function atualizarStatusJapones() {
        Object.keys(CAMPOS_JAPONESES).forEach(campo => {
            const status = document.getElementById(`status-${campo}`);
            if (!status) return;
            status.textContent = '';
            const valor = elementos[campo].value.trim();
            if (!valor) return;
            const leitura = leituraDoCampo(campo);
            if (leitura) {
                status.append('Lê-se: ');
                const forte = document.createElement('span');
                forte.className = 'leitura';
                forte.textContent = leitura;
                status.append(forte, ' · ');
            }
            const origem = document.createElement('span');
            const registro = registroUsado[campo];
            if (origemJapones[campo] === 'memoria' && registro) {
                origem.className = 'origem-memoria';
                origem.textContent = registro.aprovado
                    ? `✓ aprovado pelo cliente em ${dataCurta(registro.aprovadoEm || registro.atualizadoEm)}`
                    : `✓ usado em ${dataCurta(registro.atualizadoEm)}`;
            } else if (origemJapones[campo] === 'cliente') {
                origem.className = 'origem-cliente';
                origem.textContent = '✓ escolhido pelo cliente';
            } else if (origemJapones[campo] === 'manual') {
                origem.className = 'origem-manual';
                origem.textContent = 'digitado manualmente';
            } else {
                origem.textContent = 'automático';
            }
            status.append(origem);
            const portugues = elementos[CAMPOS_JAPONESES[campo].portugues].value;
            if (origemJapones[campo] === 'auto' && linhasEscolhaKanji([campo]).length) {
                // Há grafias em kanji conhecidas: um toque leva a escolha ao cliente.
                const perguntar = document.createElement('button');
                perguntar.type = 'button';
                perguntar.className = 'small-action perguntar-kanji';
                perguntar.textContent = 'Mostrar opções de kanji ao cliente';
                perguntar.addEventListener('click', () => abrirEscolhaKanji());
                status.append(perguntar);
            } else if (origemJapones[campo] === 'auto' && window.NoshigamiKatakana && window.NoshigamiKatakana.temOrigemJaponesa(portugues)) {
                const dica = document.createElement('span');
                dica.className = 'dica-kanji';
                dica.textContent = ' · nome japonês: pergunte se a família usa kanji';
                status.append(dica);
            }
            if (origemJapones[campo] === 'manual') {
                const voltar = document.createElement('button');
                voltar.type = 'button';
                voltar.className = 'small-action voltar-automatico';
                voltar.textContent = 'Voltar ao automático';
                voltar.addEventListener('click', () => {
                    origemJapones[campo] = 'auto';
                    preencherJapones();
                    elementos.confirmarJapones.checked = false;
                    updatePreview();
                });
                status.append(voltar);
            }
        });

        // Legenda da tela cheia e linha da folha de aprovação.
        const partes = [];
        const leituraFalecido = leituraDoCampo('nomeFalecidoJapones');
        const leituraFamilia = leituraDoCampo('nomeFamiliaJapones');
        if (leituraFalecido) partes.push(`falecido(a): ${leituraFalecido}`);
        if (leituraFamilia) partes.push(`família: ${leituraFamilia}`);
        // Cada nome num bloco que não quebra: a linha só quebra entre nomes.
        elementos.leituraCliente.textContent = '';
        if (partes.length) {
            elementos.leituraCliente.append('Lê-se — ');
            partes.forEach((parte, i) => {
                const bloco = document.createElement('span');
                bloco.style.whiteSpace = 'nowrap';
                bloco.textContent = parte;
                elementos.leituraCliente.append(...(i ? [' · ', bloco] : [bloco]));
            });
        }
        elementos.printLeitura.textContent = partes.length
            ? `Leitura dos nomes em japonês — ${partes.join('; ')}.`
            : '';
    }

    function exportarMemoria() {
        if (!memoria.length) {
            showFeedback('A memória da loja ainda está vazia.', 'info');
            return;
        }
        const blob = new Blob([JSON.stringify({ tipo: 'noshigami-memoria', versao: 1, exportadoEm: new Date().toISOString(), registros: memoria }, null, 2)],
            { type: 'application/json;charset=utf-8' });
        baixarBlob(blob, `noshigami-memoria-${dataLocalIso()}.json`);
        showFeedback(`Memória exportada (${memoria.length} nomes).`, 'success');
    }

    function importarMemoria(arquivo) {
        const leitor = new FileReader();
        leitor.onload = () => {
            try {
                const dados = JSON.parse(leitor.result);
                const registros = Array.isArray(dados) ? dados : dados && dados.registros;
                if (!Array.isArray(registros)) throw new Error('formato inesperado');
                const antes = memoria.length;
                registros
                    .filter(item => item && typeof item.nomeFalecido === 'string')
                    .forEach(item => mesclarNaMemoria({
                        nomeFalecido: item.nomeFalecido,
                        nomeFamilia: String(item.nomeFamilia || ''),
                        nomeFalecidoJapones: String(item.nomeFalecidoJapones || ''),
                        nomeFamiliaJapones: String(item.nomeFamiliaJapones || ''),
                        relacao: item.relacao == null ? '亡' : String(item.relacao),
                        periodos: Array.isArray(item.periodos) ? item.periodos.map(String) : [],
                        aprovado: Boolean(item.aprovado),
                        aprovadoEm: String(item.aprovadoEm || ''),
                        atualizadoEm: String(item.atualizadoEm || '')
                    }));
                gravarMemoria();
                showFeedback(`Memória importada: ${memoria.length - antes} nomes novos, ${memoria.length} no total.`, 'success', 5000);
            } catch (erro) {
                console.error('Falha ao importar memória:', erro);
                showFeedback('Arquivo de memória inválido.', 'error', 5000);
            }
        };
        leitor.readAsText(arquivo);
    }

    document.getElementById('exportar-memoria').addEventListener('click', exportarMemoria);
    document.getElementById('importar-memoria').addEventListener('click', () => document.getElementById('arquivo-memoria').click());
    document.getElementById('arquivo-memoria').addEventListener('change', function () {
        if (this.files && this.files[0]) importarMemoria(this.files[0]);
        this.value = '';
    });

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
    // Tela cheia para mostrar ao cliente. A Fullscreen API é aplicada ao
    // próprio #preview: um position: fixed não serviria, porque o .container
    // usa backdrop-filter/transform e prenderia o elemento dentro dele.
    function alternarTelaCheia() {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
            return;
        }
        // Se ainda há nomes com kanji possível, a tela cheia já abre com a
        // escolha para o cliente: o vendedor não precisa lembrar de perguntar.
        if (linhasEscolhaKanji().length) {
            abrirEscolhaKanji();
            return;
        }
        abrirTelaCheia();
    }
    function abrirTelaCheia() {
        const preview = document.getElementById('preview');
        if (!preview.requestFullscreen) {
            showFeedback('Este navegador não permite tela cheia.', 'error');
            return;
        }
        preview.requestFullscreen().catch(erro => {
            console.warn('Não foi possível abrir a tela cheia:', erro);
            showFeedback('Não foi possível abrir a tela cheia.', 'error');
        });
    }
    botoes.telaCheia.addEventListener('click', alternarTelaCheia);
    botoes.sairTelaCheia.addEventListener('click', alternarTelaCheia);
    document.addEventListener('fullscreenchange', atualizarEscala);

    function temDadosDoAtendimento() {
        return [elementos.nomeFalecido, elementos.nomeFamilia, elementos.nomeFalecidoJapones,
            elementos.nomeFamiliaJapones, elementos.periodoNumeral]
            .some(campo => String(campo.value || '').trim());
    }

    botoes.limpar.addEventListener('click', function () {
        const guardar = temDadosDoAtendimento();
        const pergunta = guardar
            ? 'Iniciar um novo atendimento? Os dados atuais serão guardados no histórico.'
            : 'Iniciar um novo atendimento?';
        if (!window.confirm(pergunta)) return;
        if (guardar) saveToHistory();
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
        elementos.confirmarJapones.checked = false;
        elementos.mostrarMensagem.checked = true;
        mensagemAutomatica = true;
        Object.keys(CAMPOS_JAPONESES).forEach(campo => {
            origemJapones[campo] = 'auto';
            registroUsado[campo] = null;
        });
        ultimoRegistroAvisado = '';
        familiaAutomatica = true;
        document.querySelectorAll('.error-field').forEach(campo => campo.classList.remove('error-field'));
        aplicarPosicoesPadrao();
        updatePreview();
        showFeedback(guardar
            ? 'Novo atendimento iniciado. O anterior está no histórico.'
            : 'Novo atendimento iniciado.', 'success');
    });

    elementos.nomeFalecido.addEventListener('input', function () {
        elementos.confirmarJapones.checked = false;
        const familiaMudou = familiaAutomatica;
        preencherFamiliaAutomatica();
        preencherJapones(familiaMudou ? ['nomeFalecido', 'nomeFamilia'] : ['nomeFalecido']);
        updatePreview();
    });
    // Digitar na família desliga o preenchimento pelo sobrenome; apagar o
    // campo religa (volta a valer na próxima mudança do nome do falecido).
    elementos.nomeFamilia.addEventListener('input', function () {
        familiaAutomatica = !elementos.nomeFamilia.value.trim();
        elementos.confirmarJapones.checked = false;
        preencherJapones(['nomeFamilia']);
        updatePreview();
    });
    // Nome digitado todo em minúsculas ou maiúsculas recebe iniciais
    // maiúsculas ao sair do campo; grafias mistas (McDonald) são respeitadas.
    const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'del']);
    function formatarNomeProprio(valor) {
        const texto = valor.replace(/\s+/g, ' ').trim();
        if (!texto || (texto !== texto.toLowerCase() && texto !== texto.toUpperCase())) return texto;
        return texto.toLowerCase().split(' ').map((palavra, i) =>
            i > 0 && PARTICULAS.has(palavra) ? palavra : palavra.charAt(0).toUpperCase() + palavra.slice(1)
        ).join(' ');
    }
    [elementos.nomeFalecido, elementos.nomeFamilia, elementos.nomeCliente]
        .forEach(campo => campo.addEventListener('change', function () {
            const formatado = formatarNomeProprio(campo.value);
            if (formatado === campo.value) return;
            campo.value = formatado;
            if (campo === elementos.nomeFalecido) preencherFamiliaAutomatica();
            updatePreview();
        }));

    // Digitar no campo japonês desliga o automático só daquele campo; apagar
    // tudo devolve o campo ao automático.
    [elementos.nomeFalecidoJapones, elementos.nomeFamiliaJapones]
        .forEach(campo => campo.addEventListener('input', function () {
            const vazio = !campo.value.trim();
            origemJapones[campo.id] = vazio ? 'auto' : 'manual';
            registroUsado[campo.id] = null;
            if (vazio) preencherJapones();
            elementos.confirmarJapones.checked = false;
            updatePreview();
        }));
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
    elementos.confirmarJapones.addEventListener('change', updatePreview);
    elementos.mensagem.addEventListener('input', function () {
        mensagemAutomatica = false;
        updatePreview();
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.ctrlKey && evento.key.toLowerCase() === 's') {
            evento.preventDefault();
            botoes.salvar.click();
        }
        // Alt em vez de Ctrl: Ctrl+L e Ctrl+H já são atalhos do navegador.
        // evento.code mantém o atalho independente do layout do teclado.
        if (evento.altKey && !evento.ctrlKey && evento.code === 'KeyN') {
            evento.preventDefault();
            botoes.limpar.click();
        }
        if (evento.altKey && !evento.ctrlKey && evento.code === 'KeyH') {
            evento.preventDefault();
            window.toggleHistory();
        }
        if (evento.altKey && !evento.ctrlKey && evento.code === 'KeyT') {
            evento.preventDefault();
            alternarTelaCheia();
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
        helpModal.classList.add('show');
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
        // Primeira execução com memória: aproveita o histórico antigo que já
        // tinha nomes em japonês.
        if (!memoria.length) {
            historyData
                .filter(item => item && item.nomeFalecido && (item.nomeFalecidoJapones || item.nomeFamiliaJapones))
                .forEach(item => mesclarNaMemoria({
                    nomeFalecido: item.nomeFalecido,
                    nomeFamilia: item.nomeFamilia || '',
                    nomeFalecidoJapones: item.nomeFalecidoJapones || '',
                    nomeFamiliaJapones: item.nomeFamiliaJapones || '',
                    relacao: item.relacao == null ? '亡' : item.relacao,
                    periodos: item.periodonumeral ? [item.periodonumeral] : [],
                    aprovado: false,
                    atualizadoEm: item.timestamp || ''
                }));
            if (memoria.length) gravarMemoria();
        }
        atualizarTotalMemoria();
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
