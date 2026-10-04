document.addEventListener('DOMContentLoaded', function() {
    // Seletores de Elementos do DOM
    const nomeFalecidoInput = document.getElementById('nomeFalecido');
    const nomeFalecidoJaponesInput = document.getElementById('nomeFalecidoJapones');
    const periodoNumeralSelect = document.getElementById('periodonumeral');
    const periodoSelect = document.getElementById('periodo');
    const relacaoSelect = document.getElementById('relacao');
    const nomeFamiliaInput = document.getElementById('nomeFamilia');
    const nomeFamiliaJaponesInput = document.getElementById('nomeFamiliaJapones');

    const periodoPreviewSpan = document.getElementById('periodoPreview');
    const periodoPreviewNumeralSpan = document.getElementById('periodoPreviewNumeral'); // No texto fixo
    const nomeFalecidoPreviewFixSpan = document.getElementById('nomeFalecidoPreviewFix'); // No texto fixo
    const nomeFalecidoJaponesPreviewSpan = document.getElementById('nomeFalecidoJaponesPreview');
    const nomeFamiliaPreviewFixSpan = document.getElementById('nomeFamiliaPreviewFix'); // No texto fixo
    const nomeFamiliaJaponesPreviewSpan = document.getElementById('nomeFamiliaJaponesPreview');
    const relacaoPreviewSpan = document.getElementById('relacaoPreview');

    const ocultarTraducaoBtn = document.getElementById('ocultar-traducao');
    const textoFixoDiv = document.getElementById('texto-fixo');
    const limparCamposBtn = document.getElementById('limpar-campos');
    const tirarPrintBtn = document.getElementById('tirar-print');
    const exportarTxtBtn = document.getElementById('exportar-txt');

    const themeToggleBtn = document.querySelector('.theme-toggle');
    const helpToggleBtn = document.querySelector('.help-toggle');
    const historyToggleBtn = document.querySelector('.history-toggle');
    const helpModal = document.getElementById('helpModal');
    const helpCloseBtn = document.querySelector('.help-close');
    const historyPanel = document.getElementById('historyPanel');
    const historyListDiv = document.getElementById('historyList');
    const historyCloseBtn = document.querySelector('.history-close-btn');


    const loadingSpinner = document.querySelector('.loading-spinner');
    const feedbackMessageDiv = document.getElementById('feedbackMessage');

    const stage = document.getElementById('noshigami-stage');
    const canvas = document.getElementById('noshigami-canvas');
    const restaurarPosicoesBtn = document.getElementById('restaurar-posicoes');
    const capturarImagemBtn = document.getElementById('capturar-imagem');

    // Variáveis globais
    let historyData = JSON.parse(localStorage.getItem('noshigamiHistory')) || [];
    const MAX_HISTORY = 10;

    /* =======================================================================
       GEOMETRIA
       -----------------------------------------------------------------------
       Todo o noshigami é montado num espaço de design fixo de 1794x787
       unidades — a mesma proporção da arte (3104x1361 = 2,2807). O canvas
       inteiro é então reduzido por transform: scale() para caber na largura
       disponível. Consequência: a posição relativa de cada texto sobre a peça
       é idêntica em 1280px, 1366px, 1920px, 2560px ou em qualquer outra
       largura, e a exportação sai sempre igual ao que se vê na tela.
       ======================================================================= */
    const DESIGN_W = 1794;
    const DESIGN_H = 787;

    // Posição inicial de cada bloco, em unidades de design. É daqui que todas
    // as escritas partem sempre que a página é carregada ou que o botão
    // "Restaurar Posições" é usado.
    /* Deslocamento de 26 unidades (5,2 mm na peça impressa de 365 mm) aplicado aos
       quatro blocos verticais. Medição que motivou o ajuste: a coluna do título
       estava centrada no eixo do laço, mas a coluna do nome do falecido projetava
       12,4 mm à direita, deixando o conjunto superior 5,2 mm fora de eixo. O texto
       em português não entra no deslocamento: ele é centralizado na largura da
       peça, não no laço. */
    const POSICOES_PADRAO = {
        'relacao-container':             { left: 846, top: 66 },
        'missa-container':               { left: 845, top: 167 },
        'nomeFalecidoJapones-container': { left: 920, top: 80 },
        'nomeFamiliaJapones-container':  { left: 852, top: 445 },
        'texto-fixo':                    { left: Math.round((DESIGN_W - 800) / 2), top: 611 }
    };

    let escalaAtual = 1;

    function aplicarPosicoesPadrao() {
        Object.entries(POSICOES_PADRAO).forEach(([id, pos]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.left = pos.left + 'px';
            el.style.top = pos.top + 'px';
        });
    }

    // Recalcula a escala sempre que a largura disponível muda.
    function atualizarEscala() {
        if (!stage || !canvas) return;
        const largura = stage.clientWidth;
        if (!largura) return;
        escalaAtual = largura / DESIGN_W;
        canvas.style.transform = `scale(${escalaAtual})`;
        stage.style.height = (DESIGN_H * escalaAtual) + 'px';
    }

    // Funções Auxiliares
    function showLoading() {
        loadingSpinner.classList.add('show');
    }

    function hideLoading() {
        loadingSpinner.classList.remove('show');
    }

    function showFeedback(message, type = 'info', duration = 3000) {
        feedbackMessageDiv.textContent = message;
        feedbackMessageDiv.className = `feedback-message ${type} show`;
        setTimeout(() => {
            feedbackMessageDiv.classList.remove('show');
        }, duration);
    }

    // Tema.
    // A troca do ícone (lua/sol) é feita por CSS a partir de [data-theme], então
    // esta função não depende mais de nenhum elemento existir no DOM. Era
    // justamente esse acoplamento — um getElementById('themeIcon') que passou a
    // devolver null — que derrubava a inicialização inteira do app.
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('noshigamiTheme', theme);
    }

    window.toggleTheme = function() { // Expor globalmente para o onclick
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    // Modal de Ajuda
    window.toggleHelp = function() { // Expor globalmente para o onclick
        helpModal.classList.toggle('show');
    }

    // Painel de Histórico
    window.toggleHistory = function() { // Expor globalmente para o onclick
        historyPanel.classList.toggle('open');
        if (historyPanel.classList.contains('open')) {
            updateHistoryDisplay();
        }
    }
    
    function updateHistoryDisplay() {
        historyListDiv.innerHTML = '';
        if (historyData.length === 0) {
            historyListDiv.innerHTML = '<p style="text-align:center; color:#888;">Nenhum item no histórico.</p>';
            return;
        }
        
        historyData.slice().reverse().forEach((item, index) => { // Mostra mais recente primeiro
            const div = document.createElement('div');
            div.className = 'history-item';
            const date = new Date(item.timestamp).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Construção via DOM (textContent), não innerHTML com template string:
            // nomeFalecido/nomeFamilia vêm de input do usuário e são persistidos no
            // localStorage, então nunca devem ser interpolados como HTML bruto
            // (evita um vetor de XSS armazenado caso esses dados um dia sejam
            // importados/exibidos em outro contexto).
            const strong = document.createElement('strong');
            strong.textContent = item.nomeFalecido || 'N/A';

            const linha2 = document.createElement('small');
            linha2.textContent = `${item.periodonumeral || 'N/A'} - ${item.nomeFamilia || 'N/A'}`;

            const linhaData = document.createElement('small');
            linhaData.className = 'timestamp';
            linhaData.textContent = `Salvo em: ${date}`;

            div.append(strong, document.createElement('br'), linha2, document.createElement('br'), linhaData);
            div.onclick = () => loadFromHistory(item.id); // Usa ID para carregar
            historyListDiv.appendChild(div);
        });
    }

    function loadFromHistory(id) {
        const data = historyData.find(item => item.id === id);
        if (data) {
            nomeFalecidoInput.value = data.nomeFalecido || '';
            nomeFalecidoJaponesInput.value = data.nomeFalecidoJapones || '';
            periodoNumeralSelect.value = data.periodonumeral || '';
            periodoSelect.value = data.periodo || '';
            relacaoSelect.value = data.relacao || '';
            nomeFamiliaInput.value = data.nomeFamilia || '';
            nomeFamiliaJaponesInput.value = data.nomeFamiliaJapones || '';
            updatePreview();
            showFeedback('Dados carregados do histórico!', 'success');
            historyPanel.classList.remove('open'); // Fecha o painel após carregar
        }
    }

    function saveToHistory() {
        const currentData = {
            id: Date.now(), // ID único para cada entrada
            nomeFalecido: nomeFalecidoInput.value,
            nomeFalecidoJapones: nomeFalecidoJaponesInput.value,
            periodonumeral: periodoNumeralSelect.value,
            periodo: periodoSelect.value,
            relacao: relacaoSelect.value,
            nomeFamilia: nomeFamiliaInput.value,
            nomeFamiliaJapones: nomeFamiliaJaponesInput.value,
            timestamp: new Date().toISOString()
        };

        // Evita duplicatas exatas (baseado em uma combinação de campos chave)
        const isDuplicate = historyData.some(item => 
            item.nomeFalecido === currentData.nomeFalecido &&
            item.periodonumeral === currentData.periodonumeral &&
            item.nomeFamilia === currentData.nomeFamilia
        );

        if (!isDuplicate) {
            historyData.push(currentData);
            if (historyData.length > MAX_HISTORY) {
                historyData.shift(); // Remove o mais antigo
            }
            localStorage.setItem('noshigamiHistory', JSON.stringify(historyData));
            updateHistoryDisplay(); // Atualiza a exibição se o painel estiver aberto
        }
    }


    // Validação do Formulário
    function validateForm() {
        let isValid = true;
        const requiredFields = document.querySelectorAll('.required');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error-field');
                // Adicionar tooltip de erro dinamicamente ou usar um espaço reservado
                isValid = false;
            } else {
                field.classList.remove('error-field');
            }
        });
        return isValid;
    }

    // Atualização do Preview
    function updatePreview() {
        periodoPreviewNumeralSpan.textContent = periodoNumeralSelect.value;
        periodoPreviewSpan.textContent = periodoSelect.value;
        
        // Para o texto fixo (português)
        nomeFalecidoPreviewFixSpan.textContent = nomeFalecidoInput.value;
        nomeFamiliaPreviewFixSpan.textContent = nomeFamiliaInput.value;
        
        // Para os textos arrastáveis em japonês (ou outros específicos)
        nomeFalecidoJaponesPreviewSpan.textContent = nomeFalecidoJaponesInput.value;
        nomeFamiliaJaponesPreviewSpan.textContent = nomeFamiliaJaponesInput.value ? nomeFamiliaJaponesInput.value + '家' : '';
        relacaoPreviewSpan.textContent = relacaoSelect.value;

        // Atualiza os textos arrastáveis de nome/família em português se você os descomentar no HTML
        // const nomeFalecidoPortPreview = document.getElementById('nomeFalecidoPreviewPort');
        // if (nomeFalecidoPortPreview) nomeFalecidoPortPreview.textContent = nomeFalecidoInput.value;
        // const nomeFamiliaPortPreview = document.getElementById('nomeFamiliaPreviewPort');
        // if (nomeFamiliaPortPreview) nomeFamiliaPortPreview.textContent = nomeFamiliaInput.value;
    }

    /* Arraste.
       Duas correções em relação à versão anterior: o deslocamento do mouse é
       convertido para unidades de design (dividido pela escala do canvas), sem
       o que o texto "fugia" do cursor em telas menores que 1794px; e o bloco é
       mantido dentro dos limites da peça, para não ser arrastado para fora e
       sumir da imagem exportada. Usa Pointer Events, o que faz o arraste
       funcionar também com caneta e toque. */
    function makeDraggable(element) {
        let inicioX = 0, inicioY = 0, origemLeft = 0, origemTop = 0, arrastando = false;

        element.addEventListener('pointerdown', function (e) {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            e.preventDefault();
            arrastando = true;
            inicioX = e.clientX;
            inicioY = e.clientY;
            origemLeft = parseFloat(element.style.left) || 0;
            origemTop = parseFloat(element.style.top) || 0;
            element.setPointerCapture(e.pointerId);
            element.classList.add('dragging');
        });

        element.addEventListener('pointermove', function (e) {
            if (!arrastando) return;
            e.preventDefault();

            const escala = escalaAtual || 1;
            const deltaX = (e.clientX - inicioX) / escala;
            const deltaY = (e.clientY - inicioY) / escala;

            const largura = element.offsetWidth;
            const altura = element.offsetHeight;
            const margem = 20; // permite encostar na borda sem sumir por completo

            const novoLeft = Math.min(Math.max(origemLeft + deltaX, -margem), DESIGN_W - largura + margem);
            const novoTop = Math.min(Math.max(origemTop + deltaY, -margem), DESIGN_H - altura + margem);

            element.style.left = novoLeft + 'px';
            element.style.top = novoTop + 'px';
        });

        function encerrar(e) {
            if (!arrastando) return;
            arrastando = false;
            if (element.hasPointerCapture && element.hasPointerCapture(e.pointerId)) {
                element.releasePointerCapture(e.pointerId);
            }
            element.classList.remove('dragging');
        }

        element.addEventListener('pointerup', encerrar);
        element.addEventListener('pointercancel', encerrar);
    }

    // Event Listeners dos Botões e Ações
    limparCamposBtn.addEventListener('click', function() {
        if (confirm('Deseja realmente limpar todos os campos?')) {
            document.querySelectorAll('#form-container input[type="text"], #form-container select').forEach(field => {
                field.value = '';
                field.classList.remove('error-field');
            });
            updatePreview();
            aplicarPosicoesPadrao();
            showFeedback('Campos limpos e posições restauradas.', 'success');
        }
    });

    ocultarTraducaoBtn.addEventListener('click', function () {
        const isHidden = textoFixoDiv.style.display === 'none';
        textoFixoDiv.style.display = isHidden ? 'block' : 'none';
        ocultarTraducaoBtn.textContent = isHidden ? 'Ocultar Tradução' : 'Mostrar Tradução';
        showFeedback(isHidden ? 'Tradução exibida.' : 'Tradução oculta.', 'info');
    });

    /* =======================================================================
       CAPTURA DA IMAGEM
       -----------------------------------------------------------------------
       A peça é redesenhada num <canvas> em vez de passar por dom-to-image.
       A biblioteca anterior converte a tela num SVG e, para isso, precisa BAIXAR
       a imagem de fundo e o arquivo da fonte por requisição HTTP. Aberto por
       duplo clique (file://) o navegador bloqueia essas leituras: o fundo sumia
       e os kanji saíam sobrepostos no PNG. Desenhando no canvas nada é baixado —
       o fundo já está embutido como data URI e a fonte já está carregada no
       navegador —, então a captura funciona com ou sem servidor, offline, e o
       app deixa de depender de qualquer biblioteca de terceiros.

       A posição de cada caractere é lida do próprio layout (Range por caractere)
       em vez de recalculada, o que garante que o arquivo salvo seja idêntico ao
       que está na tela, inclusive depois de arrastar os blocos.
       ======================================================================= */
    const LARGURA_EXPORTACAO = 3104; // resolução nativa da arte

    // Em escrita vertical, ideogramas e kana ficam em pé; latino e números giram
    // 90°. É o comportamento de text-orientation: mixed, reproduzido aqui.
    const REGEX_VERTICAL_EM_PE = /[⺀-鿿　-〿＀-￯]/;

    function* caracteresDe(elemento) {
        const passeio = document.createTreeWalker(elemento, NodeFilter.SHOW_TEXT);
        let no;
        while ((no = passeio.nextNode())) {
            const texto = no.nodeValue;
            let i = 0;
            while (i < texto.length) {
                const ponto = String.fromCodePoint(texto.codePointAt(i));
                const passo = ponto.length;
                if (ponto.trim()) {
                    const faixa = document.createRange();
                    faixa.setStart(no, i);
                    faixa.setEnd(no, i + passo);
                    const caixa = faixa.getBoundingClientRect();
                    if (caixa.width || caixa.height) yield { ch: ponto, caixa: caixa };
                }
                i += passo;
            }
        }
    }

    function desenharBloco(ctx, elemento, caixaCanvas, k) {
        if (getComputedStyle(elemento).display === 'none') return;
        const estilo = getComputedStyle(elemento);
        const vertical = estilo.writingMode.indexOf('vertical') === 0;
        const corpo = parseFloat(estilo.fontSize);

        ctx.fillStyle = estilo.color;
        ctx.font = `${estilo.fontStyle} ${estilo.fontWeight} ${corpo}px ${estilo.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const { ch, caixa } of caracteresDe(elemento)) {
            const cx = (caixa.left + caixa.width / 2 - caixaCanvas.left) / k;
            const cy = (caixa.top + caixa.height / 2 - caixaCanvas.top) / k;

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

        const fundo = document.getElementById('imagemPreview');
        ctx.drawImage(fundo, 0, 0, DESIGN_W, DESIGN_H);

        const caixaCanvas = canvas.getBoundingClientRect();
        const k = caixaCanvas.width / DESIGN_W;
        canvas.querySelectorAll('.draggable').forEach(el => desenharBloco(ctx, el, caixaCanvas, k));
        return tela;
    }

    window.__montar = montarImagem; // usado pelos testes automatizados

    function baixarImagem(tela, nomeArquivo) {
        return new Promise((resolver, rejeitar) => {
            tela.toBlob((blob) => {
                if (!blob) return rejeitar(new Error('canvas vazio'));
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = nomeArquivo;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                resolver();
            }, 'image/png');
        });
    }

    function nomeDoArquivo() {
        const bruto = (nomeFalecidoInput.value || 'geral').trim();
        const limpo = bruto.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_') || 'geral';
        return `Noshigami_${limpo}_${new Date().getTime()}.png`;
    }

    async function capturar(validar) {
        if (validar && !validateForm()) {
            showFeedback('Por favor, preencha todos os campos obrigatórios (marcados em vermelho).', 'error');
            return;
        }
        showLoading();
        try {
            await document.fonts.ready; // sem isso o PNG pode sair com a fonte de fallback
            const tela = montarImagem(LARGURA_EXPORTACAO / DESIGN_W);
            await baixarImagem(tela, nomeDoArquivo());
            showFeedback('Imagem gerada com sucesso!', 'success');
            if (validar) saveToHistory();
        } catch (erro) {
            showFeedback('Não foi possível gerar a imagem. Verifique o console para detalhes.', 'error', 6000);
            console.error('Falha ao gerar a imagem:', erro);
        } finally {
            hideLoading();
        }
    }

    // "Salvar Noshigami": exige os campos obrigatórios e registra no histórico.
    tirarPrintBtn.addEventListener('click', () => capturar(true));

    // "Capturar Imagem": gera o PNG imediatamente, sem validar nem gravar
    // histórico — para conferir o resultado no meio do preenchimento.
    capturarImagemBtn.addEventListener('click', () => capturar(false));

    restaurarPosicoesBtn.addEventListener('click', function () {
        aplicarPosicoesPadrao();
        showFeedback('Posições restauradas para o padrão.', 'success');
    });
    exportarTxtBtn.addEventListener('click', function () {
        const dados = {
            nomeFalecido: nomeFalecidoInput.value || "Não preenchido",
            nomeFalecidoJapones: nomeFalecidoJaponesInput.value || "Não preenchido",
            periodoNumeral: periodoNumeralSelect.value || "Não preenchido",
            periodo: periodoSelect.value || "Não preenchido",
            relacao: relacaoSelect.value || "Não preenchido",
            nomeFamilia: nomeFamiliaInput.value || "Não preenchido",
            nomeFamiliaJapones: nomeFamiliaJaponesInput.value || "Não preenchido",
        };

        let conteudoTxt = "Dados do Noshigami (Tenman-ya):\n";
        conteudoTxt += `--------------------------------------\n`;
        conteudoTxt += `Nome do Falecido: ${dados.nomeFalecido}\n`;
        conteudoTxt += `Nome do Falecido (Japonês): ${dados.nomeFalecidoJapones}\n`;
        conteudoTxt += `Período (Numeral): ${dados.periodoNumeral}\n`;
        conteudoTxt += `Período (Japonês): ${dados.periodo}\n`;
        conteudoTxt += `Relação/Parentesco: ${dados.relacao}\n`;
        conteudoTxt += `Nome da Família: ${dados.nomeFamilia}\n`;
        conteudoTxt += `Nome da Família (Japonês): ${dados.nomeFamiliaJapones}\n`;
        conteudoTxt += `--------------------------------------\n`;
        conteudoTxt += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;

        // Download nativo, sem FileSaver.js: uma dependência a menos e funciona
        // igual em file:// e http://.
        const blob = new Blob([conteudoTxt], { type: "text/plain;charset=utf-8" });
        const nome = (nomeFalecidoInput.value || 'geral').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_') || 'geral';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dados_noshigami_${nome}_${new Date().getTime()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showFeedback('Dados exportados para TXT com sucesso!', 'success');
    });


    // Event Listeners para atualização do preview
    [nomeFalecidoInput, nomeFalecidoJaponesInput, nomeFamiliaInput, nomeFamiliaJaponesInput].forEach(input => {
        input.addEventListener('input', updatePreview);
    });
    [periodoNumeralSelect, periodoSelect, relacaoSelect].forEach(select => {
        select.addEventListener('change', updatePreview);
    });

    // Atalhos de Teclado
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') { // Ctrl+S - Salvar
            e.preventDefault();
            tirarPrintBtn.click();
        }
        if (e.key === 'Escape') { // Esc - Ocultar/Mostrar tradução OU fechar modais
            if (helpModal.classList.contains('show')) {
                toggleHelp();
            } else if (historyPanel.classList.contains('open')) {
                toggleHistory();
            } else {
                ocultarTraducaoBtn.click();
            }
        }
        if (e.ctrlKey && e.key === 'l') { // Ctrl+L - Limpar campos
            e.preventDefault();
            limparCamposBtn.click();
        }
        if (e.ctrlKey && e.key === 'h') { // Ctrl+H - Abrir/Fechar Histórico (exemplo)
             e.preventDefault();
             toggleHistory();
        }
        if (e.key === 'F1') { // F1 - Abrir Ajuda (exemplo)
             e.preventDefault();
             toggleHelp();
        }
    });

    // Fechar Modais/Paineis com clique externo
    window.addEventListener('click', function(event) {
        if (event.target === helpModal) { // Clique fora do conteúdo do modal de ajuda
            toggleHelp();
        }
        // Para o painel de histórico, pode ser mais complexo se ele tiver botões que não devem fechar
        // if (historyPanel.classList.contains('open') && !historyPanel.contains(event.target) && event.target !== historyToggleBtn && !historyToggleBtn.contains(event.target)) {
        //    toggleHistory();
        // }
    });


    // Inicialização
    //
    // Cada etapa roda isolada em seu próprio try/catch: antes, uma exceção em
    // applyTheme() (por causa de um elemento removido do HTML) interrompia toda a
    // função e o drag-and-drop, o preview inicial e o histórico nunca eram
    // inicializados, sem nenhum erro visível para quem usava o site. Isso não deve
    // se repetir se qualquer etapa individual falhar no futuro.
    function initializeApp() {
        try {
            const savedTheme = localStorage.getItem('noshigamiTheme') || 'light';
            applyTheme(savedTheme);
        } catch (error) {
            console.error('Falha ao aplicar tema salvo:', error);
        }

        try {
            // Usa a arte embutida como data URI. Sem isso, o canvas fica
            // "contaminado" ao abrir a página por duplo clique e o navegador
            // recusa gerar o PNG.
            if (window.NOSHIGAMI_FUNDO) {
                document.getElementById('imagemPreview').src = window.NOSHIGAMI_FUNDO;
            }
        } catch (error) {
            console.error('Falha ao carregar a arte de fundo embutida:', error);
        }

        try {
            // A posição padrão é aplicada antes de tudo: toda escrita começa
            // sempre no mesmo lugar sobre a peça, em qualquer tela.
            aplicarPosicoesPadrao();
            atualizarEscala();
        } catch (error) {
            console.error('Falha ao posicionar/escalar o canvas:', error);
        }

        try {
            document.querySelectorAll('.draggable').forEach(el => makeDraggable(el));
        } catch (error) {
            console.error('Falha ao inicializar elementos arrastáveis:', error);
        }

        try {
            updatePreview();
        } catch (error) {
            console.error('Falha ao atualizar preview inicial:', error);
        }

        try {
            updateHistoryDisplay();
        } catch (error) {
            console.error('Falha ao carregar histórico:', error);
        }

        // Mantém a escala correta quando a janela é redimensionada, o zoom muda
        // ou o painel lateral abre/fecha.
        if (window.ResizeObserver && stage) {
            new ResizeObserver(atualizarEscala).observe(stage);
        }
        window.addEventListener('resize', atualizarEscala);

        // Depois que as fontes carregam as métricas mudam: reescalar evita que a
        // peça fique com a altura calculada a partir da fonte de fallback.
        document.fonts.ready.then(() => {
            atualizarEscala();
            console.log("Fontes carregadas. Noshigami pronto!");
        }).catch((error) => {
            console.error("Erro ao carregar fontes:", error);
        });
    }

    initializeApp();
});