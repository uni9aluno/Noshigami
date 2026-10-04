(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.NoshigamiDocx = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const OFFSETS = Object.freeze({
        nomeFalecidoJapones: '4958715',
        nomeFamiliaJapones: '4240481',
        relacao: '4902835',
        periodoJapones: '4352925',
        mensagem: '2314575'
    });

    const PERIODOS_DIAS = Object.freeze({
        '初七日': '初七日忌',
        '二七日': '二七日忌',
        '三七日': '三七日忌',
        '四七日': '四七日忌',
        '五七日': '五七日忌',
        '六七日': '六七日忌',
        '四十九日': '四十九日忌',
        '百箇日': '百箇日忌'
    });

    function escaparXml(valor) {
        return String(valor == null ? '' : valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function textoWord(valor) {
        const texto = escaparXml(valor || '\u00a0');
        return texto.replace(/\r?\n/g, '</w:t><w:br/><w:t>');
    }

    function preencherConteudoCaixa(caixaXml, valor) {
        let escreveu = false;
        return caixaXml.replace(/(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g, function (_, inicio, _atual, fim) {
            if (escreveu) return inicio + fim;
            escreveu = true;
            return inicio + textoWord(valor) + fim;
        });
    }

    function preencherCaixaPorOffset(xml, offsetHorizontal, valor) {
        let encontrado = false;
        const atualizado = xml.replace(/<mc:AlternateContent\b[\s\S]*?<\/mc:AlternateContent>/g, function (bloco) {
            if (!bloco.includes('<wp:posOffset>' + offsetHorizontal + '</wp:posOffset>')) return bloco;
            encontrado = true;
            return bloco.replace(/<w:txbxContent\b[^>]*>[\s\S]*?<\/w:txbxContent>/g, function (caixa) {
                return preencherConteudoCaixa(caixa, valor);
            });
        });
        if (!encontrado) throw new Error('Campo do template DOCX nao encontrado: ' + offsetHorizontal);
        return atualizado;
    }

    function atualizarOpcoesDePeriodo(xml) {
        let atualizado = xml;
        Object.entries(PERIODOS_DIAS).forEach(function ([anterior, novo]) {
            atualizado = atualizado.split(anterior).join(novo);
        });

        // O template original nao continha a opcao de 42 dias. Insere-a nas duas
        // representacoes de compatibilidade mantidas pelo Word.
        const itemCinco = '<w:listItem w:displayText="五七日忌" w:value="五七日忌"/>';
        const itemSeis = '<w:listItem w:displayText="六七日忌" w:value="六七日忌"/>';
        atualizado = atualizado.split(itemCinco).join(itemCinco + itemSeis);
        return atualizado;
    }

    function atualizarOpcoesDeRelacao(xml) {
        const marcador = '<w:listItem w:value="Parentesco"/>';
        const novasOpcoes = [
            '<w:listItem w:displayText="Sem parentesco - 亡" w:value="亡"/>',
            '<w:listItem w:displayText="Não exibir título" w:value=""/>'
        ].join('');
        return xml.split(marcador).join(marcador + novasOpcoes);
    }

    function preencherTemplateXml(xml, dados) {
        let resultado = atualizarOpcoesDeRelacao(atualizarOpcoesDePeriodo(xml));
        resultado = preencherCaixaPorOffset(resultado, OFFSETS.nomeFalecidoJapones, dados.nomeFalecidoJapones);
        resultado = preencherCaixaPorOffset(
            resultado,
            OFFSETS.nomeFamiliaJapones,
            dados.nomeFamiliaJapones ? dados.nomeFamiliaJapones + '家' : ''
        );
        resultado = preencherCaixaPorOffset(resultado, OFFSETS.relacao, dados.relacao);
        resultado = preencherCaixaPorOffset(resultado, OFFSETS.periodoJapones, dados.periodoJapones);
        resultado = preencherCaixaPorOffset(resultado, OFFSETS.mensagem, dados.mostrarMensagem ? dados.mensagem : '');
        // O template possui marcadores de permissão que o Word inclui na saída
        // impressa como pequenos traços. Eles não são necessários para editar os
        // campos e são removidos somente da cópia exportada.
        resultado = resultado.replace(/<w:perm(?:Start|End)\b[^>]*\/>/g, '');
        return resultado;
    }

    async function gerarDocx(JSZipCtor, templateBase64, dados, tipoSaida) {
        if (!JSZipCtor) throw new Error('JSZip nao foi carregado.');
        if (!templateBase64) throw new Error('Template DOCX nao foi carregado.');

        const zip = await JSZipCtor.loadAsync(templateBase64, { base64: true });
        const documento = zip.file('word/document.xml');
        if (!documento) throw new Error('Template DOCX invalido: word/document.xml ausente.');

        const xmlOriginal = await documento.async('string');
        zip.file('word/document.xml', preencherTemplateXml(xmlOriginal, dados));
        return zip.generateAsync({
            type: tipoSaida || 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
    }

    return {
        OFFSETS: OFFSETS,
        PERIODOS_DIAS: PERIODOS_DIAS,
        escaparXml: escaparXml,
        preencherTemplateXml: preencherTemplateXml,
        gerarDocx: gerarDocx
    };
}));
