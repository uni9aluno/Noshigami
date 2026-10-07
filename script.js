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
    // Folha final: 365 × 160 mm. A mesma escala vale nos dois eixos; o design
    // (787 px) tem 0,12 mm a mais de altura, que fica fora da folha exportada.
    const FOLHA_W_MM = 365;
    const FOLHA_H_MM = 160;
    const MM_POR_PX = FOLHA_W_MM / DESIGN_W;
    const FOLHA_H_PX = FOLHA_H_MM / MM_POR_PX;
    // 300 dpi na largura da folha (365 mm → 4311 px).
    const LARGURA_EXPORTACAO = Math.round(FOLHA_W_MM / 25.4 * 300);
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
        atualizarPainelPosicao();
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
        atualizarPainelPosicao();
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
        // Escrita aguardando a família: a aprovação pode sair, a peça final não.
        const pendente = estaPendente();

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
        fluxo.resumoFinalizacao.textContent = pronto && pendente
            ? 'A família vai confirmar a escrita em japonês: já dá para imprimir a aprovação; a peça final fica liberada depois da confirmação.'
            : pronto
            ? 'Tudo pronto. Escolha abaixo como salvar, imprimir ou exportar o Noshigami.'
            : !dadosCompletos
                ? `Faltam ${3 - preenchidos} campo(s) obrigatório(s) na etapa 1.`
                : !japonesCompleto
                    ? 'Informe os dois nomes em japonês antes de finalizar.'
                    : 'Marque a confirmação de revisão japonesa para liberar as saídas finais.';
        fluxo.resumoFinalizacao.classList.toggle('ready', pronto);

        [botoes.salvar, botoes.exportarDocx, botoes.imprimirNoshigami, botoes.imprimirAprovacao].forEach(botao => {
            const bloqueado = !pronto || (pendente && botao !== botoes.imprimirAprovacao);
            botao.disabled = bloqueado;
            botao.title = bloqueado ? fluxo.resumoFinalizacao.textContent : '';
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

    /* Busca de noshigamis (campo no cabeçalho): filtra o histórico e as
       pendências por nomes em português ou japonês e pelo período. */
    const campoBusca = document.getElementById('busca-noshigami');
    let termoBusca = '';

    function textoBusca(valor) {
        return String(valor || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function correspondeBusca(item) {
        if (!termoBusca) return true;
        const campos = [
            item.nomeFalecido, item.nomeFamilia, item.nomeFalecidoJapones, item.nomeFamiliaJapones,
            item.periodonumeral, item.periodo, ...(item.periodos || [])
        ];
        return textoBusca(campos.join(' ')).includes(termoBusca);
    }

    function atualizarResumoBusca() {
        const resumo = document.getElementById('busca-resumo');
        if (!resumo) return;
        resumo.hidden = !termoBusca;
        document.getElementById('busca-resumo-texto').textContent = termoBusca ? `Busca: “${campoBusca.value.trim()}”` : '';
    }

    function aplicarBusca(valor) {
        termoBusca = textoBusca(valor);
        if (termoBusca && !historyPanel.classList.contains('open')) historyPanel.classList.add('open');
        atualizarResumoBusca();
        updateHistoryDisplay();
        atualizarPendencias();
    }

    function limparBusca() {
        campoBusca.value = '';
        aplicarBusca('');
    }

    if (campoBusca) {
        campoBusca.addEventListener('input', () => aplicarBusca(campoBusca.value));
        campoBusca.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape') {
                evento.stopPropagation();
                if (campoBusca.value) limparBusca();
                else campoBusca.blur();
            }
            if (evento.key === 'Enter') {
                // Enter abre o primeiro resultado (pendência ou histórico).
                const primeiro = historyPanel.querySelector('.pendencia-item, .history-item');
                if (primeiro) primeiro.click();
            }
        });
        document.getElementById('busca-limpar').addEventListener('click', limparBusca);
    }

    function removerDoHistorico(id) {
        if (!window.confirm('Remover este noshigami do histórico?')) return;
        historyData = historyData.filter(item => item.id !== id);
        try {
            localStorage.setItem('noshigamiHistory', JSON.stringify(historyData));
        } catch (erro) {
            console.warn('Não foi possível salvar o histórico:', erro);
        }
        updateHistoryDisplay();
        showFeedback('Noshigami removido do histórico.', 'success');
    }

    function itemRemovivel(conteudo, rotulo, aoRemover) {
        const caixa = document.createElement('div');
        caixa.className = 'item-removivel';
        const remover = document.createElement('button');
        remover.type = 'button';
        remover.className = 'remover-item';
        remover.textContent = '×';
        remover.title = rotulo;
        remover.setAttribute('aria-label', rotulo);
        remover.addEventListener('click', function (evento) {
            evento.stopPropagation();
            aoRemover();
        });
        caixa.append(conteudo, remover);
        return caixa;
    }

    function updateHistoryDisplay() {
        historyList.replaceChildren();
        const itens = historyData.filter(correspondeBusca);
        if (!itens.length) {
            const vazio = document.createElement('p');
            vazio.textContent = termoBusca ? 'Nenhum noshigami encontrado.' : 'Nenhum item no histórico.';
            vazio.style.textAlign = 'center';
            vazio.style.color = '#888';
            historyList.appendChild(vazio);
            return;
        }

        itens.slice().reverse().forEach(item => {
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
            historyList.appendChild(itemRemovivel(entrada, 'Remover do histórico', () => removerDoHistorico(item.id)));
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

    /* =======================================================================
       POSIÇÃO DOS TEXTOS: arrastar com linhas guia + ajuste exato em mm
       ======================================================================= */
    const NOMES_BLOCOS = Object.freeze({
        'relacao-container': 'Título (亡 / parentesco)',
        'missa-container': 'Período da missa',
        'nomeFalecidoJapones-container': 'Nome do falecido',
        'nomeFamiliaJapones-container': 'Nome da família',
        'texto-fixo': 'Mensagem'
    });
    // Bloco da prévia → caixa de texto correspondente no modelo Word.
    const CAMPOS_DOCX = Object.freeze({
        'relacao-container': 'relacao',
        'missa-container': 'periodoJapones',
        'nomeFalecidoJapones-container': 'nomeFalecidoJapones',
        'nomeFamiliaJapones-container': 'nomeFamiliaJapones',
        'texto-fixo': 'mensagem'
    });
    const GUIA_DISTANCIA_TELA = 6; // px na tela para "grudar" na guia
    const MARGEM_ARRASTE = 20;
    const painelPosicao = {
        campo: document.getElementById('posicao-campo'),
        x: document.getElementById('posicao-x'),
        y: document.getElementById('posicao-y'),
        padrao: document.getElementById('posicao-padrao')
    };
    const camadaGuias = document.getElementById('guias');
    let blocoSelecionado = null;

    function blocoVisivel(elemento) {
        return elemento.offsetWidth > 0 && getComputedStyle(elemento).display !== 'none';
    }

    function limitarPosicao(elemento, left, top) {
        return {
            left: Math.min(Math.max(left, -MARGEM_ARRASTE), DESIGN_W - elemento.offsetWidth + MARGEM_ARRASTE),
            top: Math.min(Math.max(top, -MARGEM_ARRASTE), DESIGN_H - elemento.offsetHeight + MARGEM_ARRASTE)
        };
    }

    // Deslocamento de cada bloco em relação à posição padrão, em mm (com
    // centésimos), para o Word mover as caixas do modelo na mesma medida.
    function deslocamentosMm() {
        const resultado = {};
        Object.entries(CAMPOS_DOCX).forEach(([id, campo]) => {
            const elemento = document.getElementById(id);
            const padrao = POSICOES_PADRAO[id];
            if (!elemento || !padrao) return;
            resultado[campo] = {
                dx: Math.round(((parseFloat(elemento.style.left) || 0) - padrao.left) * MM_POR_PX * 100) / 100,
                dy: Math.round(((parseFloat(elemento.style.top) || 0) - padrao.top) * MM_POR_PX * 100) / 100
            };
        });
        return resultado;
    }

    // "exceto": campo que o usuário está digitando e não deve ser reescrito.
    function atualizarPainelPosicao(exceto) {
        if (!painelPosicao.campo) return;
        const ativo = Boolean(blocoSelecionado);
        painelPosicao.x.disabled = !ativo;
        painelPosicao.y.disabled = !ativo;
        painelPosicao.padrao.disabled = !ativo;
        if (!ativo) {
            painelPosicao.campo.textContent = 'Clique em um texto da prévia para ajustar a posição em mm.';
            painelPosicao.x.value = '';
            painelPosicao.y.value = '';
            return;
        }
        const left = parseFloat(blocoSelecionado.style.left) || 0;
        const top = parseFloat(blocoSelecionado.style.top) || 0;
        painelPosicao.campo.textContent = NOMES_BLOCOS[blocoSelecionado.id] || 'Texto';
        if (exceto !== painelPosicao.x) {
            painelPosicao.x.value = ((left + blocoSelecionado.offsetWidth / 2) * MM_POR_PX).toFixed(1);
        }
        if (exceto !== painelPosicao.y) {
            painelPosicao.y.value = ((top + blocoSelecionado.offsetHeight / 2) * MM_POR_PX).toFixed(1);
        }
    }

    function selecionarBloco(elemento) {
        if (blocoSelecionado && blocoSelecionado !== elemento) blocoSelecionado.classList.remove('selecionado');
        blocoSelecionado = elemento;
        if (elemento) elemento.classList.add('selecionado');
        atualizarPainelPosicao();
    }

    function posicionarPorMm(campoAlterado) {
        if (!blocoSelecionado) return;
        const x = parseFloat(String(painelPosicao.x.value).replace(',', '.'));
        const y = parseFloat(String(painelPosicao.y.value).replace(',', '.'));
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const posicao = limitarPosicao(
            blocoSelecionado,
            x / MM_POR_PX - blocoSelecionado.offsetWidth / 2,
            y / MM_POR_PX - blocoSelecionado.offsetHeight / 2
        );
        blocoSelecionado.style.left = posicao.left + 'px';
        blocoSelecionado.style.top = posicao.top + 'px';
        atualizarPainelPosicao(campoAlterado);
    }

    if (painelPosicao.x) {
        painelPosicao.x.addEventListener('input', () => posicionarPorMm(painelPosicao.x));
        painelPosicao.y.addEventListener('input', () => posicionarPorMm(painelPosicao.y));
        [painelPosicao.x, painelPosicao.y].forEach(campo => campo.addEventListener('change', () => atualizarPainelPosicao()));
        painelPosicao.padrao.addEventListener('click', function () {
            if (!blocoSelecionado) return;
            const padrao = POSICOES_PADRAO[blocoSelecionado.id];
            if (!padrao) return;
            blocoSelecionado.style.left = padrao.left + 'px';
            blocoSelecionado.style.top = padrao.top + 'px';
            atualizarPainelPosicao();
        });
    }

    function limparGuias() {
        if (camadaGuias) camadaGuias.replaceChildren();
    }

    function desenharGuias(verticais, horizontais) {
        if (!camadaGuias) return;
        limparGuias();
        const espessura = Math.max(1, 1.5 / (escalaAtual || 1)) + 'px';
        verticais.forEach(x => {
            const linha = document.createElement('div');
            linha.className = 'guia guia-v';
            linha.style.left = x + 'px';
            linha.style.borderLeftWidth = espessura;
            camadaGuias.append(linha);
        });
        horizontais.forEach(y => {
            const linha = document.createElement('div');
            linha.className = 'guia guia-h';
            linha.style.top = y + 'px';
            linha.style.borderTopWidth = espessura;
            camadaGuias.append(linha);
        });
    }

    // Procura o alinhamento mais próximo em um eixo. "proprios" são as
    // posições do bloco (início, centro, fim); "alvos", as da página e dos
    // outros blocos. Devolve o ajuste a aplicar e as guias a desenhar.
    function melhorAlinhamento(proprios, alvos, limite) {
        let ajuste = null;
        alvos.forEach(alvo => proprios.forEach(proprio => {
            const diferenca = alvo - proprio;
            if (Math.abs(diferenca) <= limite && (ajuste === null || Math.abs(diferenca) < Math.abs(ajuste))) ajuste = diferenca;
        }));
        if (ajuste === null) return { ajuste: 0, guias: [] };
        const guias = alvos.filter(alvo => proprios.some(proprio => Math.abs(alvo - (proprio + ajuste)) < 0.5));
        return { ajuste: ajuste, guias: Array.from(new Set(guias)) };
    }

    function aplicarGuias(elemento, left, top) {
        const largura = elemento.offsetWidth;
        const altura = elemento.offsetHeight;
        const alvosX = [DESIGN_W / 2];
        const alvosY = [FOLHA_H_PX / 2];
        canvas.querySelectorAll('.draggable').forEach(outro => {
            if (outro === elemento || !blocoVisivel(outro)) return;
            const outroLeft = parseFloat(outro.style.left) || 0;
            const outroTop = parseFloat(outro.style.top) || 0;
            alvosX.push(outroLeft, outroLeft + outro.offsetWidth / 2, outroLeft + outro.offsetWidth);
            alvosY.push(outroTop, outroTop + outro.offsetHeight / 2, outroTop + outro.offsetHeight);
        });
        const limite = GUIA_DISTANCIA_TELA / (escalaAtual || 1);
        const eixoX = melhorAlinhamento([left, left + largura / 2, left + largura], alvosX, limite);
        const eixoY = melhorAlinhamento([top, top + altura / 2, top + altura], alvosY, limite);
        desenharGuias(eixoX.guias, eixoY.guias);
        return { left: left + eixoX.ajuste, top: top + eixoY.ajuste };
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
            selecionarBloco(element);
        });
        element.addEventListener('pointermove', function (evento) {
            if (!arrastando) return;
            evento.preventDefault();
            const escala = escalaAtual || 1;
            let posicao = limitarPosicao(
                element,
                origemLeft + (evento.clientX - inicioX) / escala,
                origemTop + (evento.clientY - inicioY) / escala
            );
            // Alt solta o texto livre, sem grudar nas guias.
            if (evento.altKey) {
                limparGuias();
            } else {
                const alinhada = aplicarGuias(element, posicao.left, posicao.top);
                posicao = limitarPosicao(element, alinhada.left, alinhada.top);
            }
            element.style.left = posicao.left + 'px';
            element.style.top = posicao.top + 'px';
            atualizarPainelPosicao();
        });
        function encerrar(evento) {
            if (!arrastando) return;
            arrastando = false;
            if (element.hasPointerCapture && element.hasPointerCapture(evento.pointerId)) {
                element.releasePointerCapture(evento.pointerId);
            }
            element.classList.remove('dragging');
            limparGuias();
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
        // A peça exportada sai sem negrito: a Yuji Syuku só tem o peso
        // regular, e o negrito da prévia é sintético.
        ctx.font = `${estilo.fontStyle} normal ${corpo}px ${estilo.fontFamily}`;
        ctx.textAlign = 'center';
        for (const { ch, caixa } of caracteresDe(elemento)) {
            const cx = (caixa.left + caixa.width / 2 - caixaCanvas.left) / escalaLayout;
            const cy = (caixa.top + caixa.height / 2 - caixaCanvas.top) / escalaLayout;
            if (!vertical) {
                // Texto horizontal: a caixa do caractere é a área de conteúdo
                // da fonte (ascendente + descendente); a linha de base fica a
                // "ascendente" do topo dessa área, como no navegador.
                const medida = ctx.measureText(ch);
                const subida = medida.fontBoundingBoxAscent;
                const descida = medida.fontBoundingBoxDescent;
                ctx.textBaseline = 'alphabetic';
                if (Number.isFinite(subida) && Number.isFinite(descida)) {
                    ctx.fillText(ch, cx, cy - (subida + descida) / 2 + subida);
                } else {
                    ctx.textBaseline = 'middle';
                    ctx.fillText(ch, cx, cy);
                }
                continue;
            }
            ctx.textBaseline = 'middle';
            if (!REGEX_VERTICAL_EM_PE.test(ch)) {
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
        // Proporção exata da folha (365 × 160 mm), sem esticar a imagem.
        tela.width = Math.round(DESIGN_W * escala);
        tela.height = Math.round(FOLHA_H_PX * escala);
        const ctx = tela.getContext('2d');
        ctx.scale(escala, escala);
        ctx.drawImage(document.getElementById('imagemPreview'), 0, 0, DESIGN_W, DESIGN_H);
        // Mede os caracteres na escala 1 do design: medir na prévia reduzida
        // multiplicaria o erro de arredondamento do navegador.
        const transformAnterior = canvas.style.transform;
        canvas.style.transform = 'none';
        try {
            const caixaCanvas = canvas.getBoundingClientRect();
            const escalaLayout = caixaCanvas.width / DESIGN_W;
            canvas.querySelectorAll('.draggable').forEach(elemento => desenharBloco(ctx, elemento, caixaCanvas, escalaLayout));
        } finally {
            canvas.style.transform = transformAnterior;
        }
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

    // Fontes que vão dentro do .docx (assets/fontes-docx.js, ~3,5 MB): só
    // são carregadas na primeira exportação para Word. Usa <script> e não
    // fetch para funcionar também com o index.html aberto direto do disco.
    let carregandoFontesDocx = null;
    function carregarFontesDocx() {
        if (window.NOSHIGAMI_FONTES_DOCX) return Promise.resolve(window.NOSHIGAMI_FONTES_DOCX);
        if (!carregandoFontesDocx) {
            carregandoFontesDocx = new Promise((resolve, reject) => {
                const proprio = document.querySelector('script[src*="script.js"]');
                const versao = proprio && (proprio.getAttribute('src').match(/\?v=[\w-]+/) || [''])[0];
                const script = document.createElement('script');
                script.src = 'assets/fontes-docx.js' + (versao || '');
                script.onload = () => window.NOSHIGAMI_FONTES_DOCX
                    ? resolve(window.NOSHIGAMI_FONTES_DOCX)
                    : reject(new Error('Fontes do Word vazias.'));
                script.onerror = () => reject(new Error('Fontes do Word não carregaram.'));
                document.head.appendChild(script);
            }).catch(erro => {
                carregandoFontesDocx = null;
                throw erro;
            });
        }
        return carregandoFontesDocx;
    }

    // Garante Yuji Syuku e Great Vibes prontas antes de desenhar a peça.
    function carregarFontesDaPeca() {
        if (!document.fonts || !document.fonts.load) return Promise.resolve();
        return Promise.all([
            document.fonts.load('40px "Yuji Syuku"', '亡家'),
            document.fonts.load('34px "Great Vibes"', 'Missa')
        ]).then(() => document.fonts.ready);
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
            let fontes = null;
            try {
                fontes = await carregarFontesDocx();
            } catch (erro) {
                console.warn('Word exportado sem fontes incorporadas:', erro);
                showFeedback('Aviso: as fontes não puderam ser incorporadas; o Word usará as instaladas no computador.', 'info', 6000);
            }
            const blob = await window.NoshigamiDocx.gerarDocx(window.JSZip, window.NOSHIGAMI_DOCX_TEMPLATE, {
                nomeFalecidoJapones: dados.nomeFalecidoJapones,
                nomeFamiliaJapones: dados.nomeFamiliaJapones,
                relacao: dados.relacao,
                periodoJapones: dados.periodo,
                mensagem: dados.mensagem,
                mostrarMensagem: dados.mostrarMensagem,
                deslocamentosMm: deslocamentosMm()
            }, 'blob', fontes);
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
            await carregarFontesDaPeca();
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
       português e o app preenche os campos japoneses com o katakana gerado
       pelo conversor local. A memória da loja não preenche o formulário: ela
       guarda escolhas de kanji e pendências da família.
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

    function estaPendente() {
        return Object.values(origemJapones).includes('pendente');
    }

    /* Pendências: atendimentos em que a família ainda vai confirmar a escrita
       em japonês. Aparecem no topo do Histórico e com contador no ícone, para
       ninguém precisar lembrar delas. */
    function atualizarPendencias() {
        const pendentes = memoria.filter(item => item.pendente).reverse();
        const visiveis = pendentes.filter(correspondeBusca);
        const badge = document.getElementById('badge-pendencias');
        const bloco = document.getElementById('pendencias');
        const lista = document.getElementById('lista-pendencias');
        if (!badge || !bloco || !lista) return;
        badge.hidden = !pendentes.length;
        badge.textContent = String(pendentes.length);
        bloco.hidden = !visiveis.length;
        lista.textContent = '';
        visiveis.forEach(item => {
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'pendencia-item';
            botao.textContent = `${item.nomeFalecido} — Família ${item.nomeFamilia || '?'}`;
            const quando = document.createElement('small');
            quando.textContent = `Aguardando desde ${dataCurta(item.pendenteDesde || item.atualizadoEm)}`;
            botao.append(quando);
            botao.addEventListener('click', () => retomarPendencia(item));
            lista.append(itemRemovivel(botao, 'Remover pendência', () => removerPendencia(item)));
        });
    }

    // Tira o atendimento da lista de espera. Registro que nunca foi aprovado
    // sai da memória; aprovado antes, só perde a marca de pendente.
    function removerPendencia(item) {
        if (!window.confirm(`Remover a pendência de kanji de ${item.nomeFalecido}?`)) return;
        const indice = memoria.indexOf(item);
        if (indice >= 0) {
            if (item.aprovado) {
                item.pendente = false;
                item.pendenteDesde = '';
            } else {
                memoria.splice(indice, 1);
            }
        }
        // Se esse atendimento está aberto, a escrita atual fica como digitada
        // e a peça final deixa de ficar bloqueada.
        if (normalizarNome(elementos.nomeFalecido.value) === normalizarNome(item.nomeFalecido)) {
            Object.keys(CAMPOS_JAPONESES).forEach(campo => {
                if (origemJapones[campo] !== 'pendente') return;
                origemJapones[campo] = 'manual';
                registroUsado[campo] = null;
            });
        }
        gravarMemoria();
        updatePreview();
        showFeedback('Pendência de kanji removida.', 'success');
    }

    function retomarPendencia(item) {
        elementos.nomeFalecido.value = item.nomeFalecido;
        elementos.nomeFamilia.value = item.nomeFamilia || '';
        familiaAutomatica = false;
        Object.entries(CAMPOS_JAPONESES).forEach(([campo, config]) => {
            const valor = item[config.memoria] || '';
            elementos[campo].value = valor || katakanaAutomatico(elementos[config.portugues].value);
            origemJapones[campo] = valor ? 'pendente' : 'auto';
            registroUsado[campo] = valor ? item : null;
        });
        // É o mesmo pedido: o período da missa volta junto.
        const periodo = (item.periodos || [])[(item.periodos || []).length - 1];
        if (periodo) {
            elementos.periodoNumeral.value = periodo;
            sincronizarPorPortugues();
        }
        elementos.confirmarJapones.checked = true;
        historyPanel.classList.remove('open');
        updatePreview();
        showFeedback('Atendimento retomado: com a família, toque em “Escolher agora”.', 'info', 5000);
        elementos.nomeFalecidoJapones.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function gravarMemoria() {
        try {
            localStorage.setItem(CHAVE_MEMORIA, JSON.stringify(memoria));
        } catch (erro) {
            console.warn('Não foi possível gravar a memória da loja:', erro);
        }
        atualizarTotalMemoria();
        atualizarPendencias();
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
        // Pendência continuada mantém a data em que começou.
        if (novo.pendente && anterior && anterior.pendente && anterior.pendenteDesde) base.pendenteDesde = anterior.pendenteDesde;
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
            pendente: estaPendente(),
            aprovadoEm: aprovado ? agora : '',
            pendenteDesde: estaPendente() ? agora : '',
            atualizadoEm: agora
        });
        gravarMemoria();
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
        // A memória da loja não preenche mais o formulário: ela só guarda
        // escolhas e pendências. Os campos automáticos usam o katakana.
        Object.entries(CAMPOS_JAPONESES).forEach(([campo, config]) => {
            if (origemJapones[campo] === 'manual') return;
            const decidido = ['cliente', 'pendente', 'memoria'].includes(origemJapones[campo]);
            if (decidido && (!alterados || !alterados.includes(config.portugues))) return;
            elementos[campo].value = katakanaAutomatico(elementos[config.portugues].value);
            origemJapones[campo] = 'auto';
            registroUsado[campo] = null;
        });
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
        confirmar: document.getElementById('escolha-confirmar'),
        depois: document.getElementById('escolha-depois')
    };
    const escolhas = new Map(); // palavra normalizada → kanji escolhido ('' = katakana)
    const OPCOES_VISIVEIS = 7;
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
        // Só o que foi digitado à mão fica de fora: memória, pendência e
        // escolha anterior podem ser trocadas pelo cliente.
        camposEscolha = campos || Object.keys(CAMPOS_JAPONESES)
            .filter(c => origemJapones[c] !== 'manual');
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
            opcoes.append(criarOpcao(linha, '', katakanaAutomatico(linha.palavra) || linha.palavra, 'katakana / sem kanji'));
            // As 7 grafias mais prováveis ficam à vista; as raras, em "Ver mais",
            // para não sobrecarregar o cliente (Hiroshi tem mais de 30).
            const selecionada = linha.kanji.indexOf(escolhas.get(linha.chave));
            const visiveis = Math.max(OPCOES_VISIVEIS, selecionada + 1);
            linha.kanji.forEach((kanji, i) => {
                const opcao = criarOpcao(linha, kanji, kanji, 'kanji');
                opcao.hidden = i >= visiveis;
                opcoes.append(opcao);
            });
            const escondidas = linha.kanji.length - visiveis;
            if (escondidas > 0) {
                const verMais = document.createElement('button');
                verMais.type = 'button';
                verMais.className = 'ver-mais';
                verMais.textContent = `Ver mais (${escondidas})`;
                verMais.addEventListener('click', () => {
                    opcoes.querySelectorAll('.escolha-opcao[hidden]').forEach(opcao => { opcao.hidden = false; });
                    verMais.remove();
                });
                opcoes.append(verMais);
            }
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
        // Grava já: resolve uma pendência antiga sem depender da impressão.
        registrarNaMemoria(false);
        updatePreview();
        showFeedback('Escolha do cliente aplicada ao Noshigami.', 'success');
    });

    // Cliente não sabe a escrita agora: fica o katakana provisório, a
    // aprovação pode ser impressa e a peça final espera a família.
    escolhaKanji.depois.addEventListener('click', () => {
        camposEscolha.forEach(campo => {
            elementos[campo].value = katakanaAutomatico(elementos[CAMPOS_JAPONESES[campo].portugues].value);
            origemJapones[campo] = 'pendente';
            registroUsado[campo] = null;
        });
        elementos.confirmarJapones.checked = true;
        escolhaKanji.painel.hidden = true;
        registrarNaMemoria(false);
        updatePreview();
        showFeedback('Pendente: a peça final fica bloqueada até a família confirmar a escrita. O atendimento está em Histórico › Aguardando a família.', 'info', 7000);
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
            } else if (origemJapones[campo] === 'pendente') {
                origem.className = 'origem-pendente';
                origem.textContent = '⏳ katakana provisório — a família vai confirmar a escrita';
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
            } else if (origemJapones[campo] === 'pendente') {
                const resolver = document.createElement('button');
                resolver.type = 'button';
                resolver.className = 'small-action perguntar-kanji';
                resolver.textContent = 'Família confirmou? Escolher agora';
                resolver.addEventListener('click', () => abrirEscolhaKanji());
                status.append(resolver);
            } else if ((origemJapones[campo] === 'memoria' || origemJapones[campo] === 'cliente') && linhasEscolhaKanji([campo]).length) {
                const trocar = document.createElement('button');
                trocar.type = 'button';
                trocar.className = 'small-action voltar-automatico';
                trocar.textContent = 'Trocar escrita';
                trocar.addEventListener('click', () => abrirEscolhaKanji());
                status.append(trocar);
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
        elementos.printLeitura.textContent = (partes.length
            ? `Leitura dos nomes em japonês — ${partes.join('; ')}.`
            : '') + (estaPendente()
            ? ' Escrita em japonês PROVISÓRIA, a confirmar pela família antes da impressão final.'
            : '');
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
        // "/" (fora de campos de texto) ou Ctrl+K: vai para a busca.
        const digitando = evento.target.closest && evento.target.closest('input, textarea, select, [contenteditable="true"]');
        if (campoBusca && ((evento.key === '/' && !digitando && !evento.ctrlKey && !evento.altKey) ||
            (evento.ctrlKey && !evento.altKey && evento.key.toLowerCase() === 'k'))) {
            evento.preventDefault();
            campoBusca.focus();
            campoBusca.select();
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
        atualizarPendencias();
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
