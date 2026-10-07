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

    const EMU_POR_MM = 36000;
    const PT_POR_MM = 72 / 25.4;

    function arredondar(valor, casas) {
        const fator = Math.pow(10, casas);
        return Math.round(valor * fator) / fator;
    }

    // Move a caixa de texto pelo deslocamento (em mm) que o usuário fez na
    // tela. Ajusta as duas representações: DrawingML (mc:Choice, em EMU) e
    // VML de compatibilidade (mc:Fallback, em pt).
    function deslocarCaixa(bloco, deslocamento) {
        const dx = Number(deslocamento && deslocamento.dx) || 0;
        const dy = Number(deslocamento && deslocamento.dy) || 0;
        if (!dx && !dy) return bloco;
        let resultado = bloco.replace(/(<wp:position([HV])\b[^>]*>\s*<wp:posOffset>)(-?\d+)(<\/wp:posOffset>)/g,
            function (_, inicio, eixo, valor, fim) {
                const delta = Math.round((eixo === 'H' ? dx : dy) * EMU_POR_MM);
                return inicio + (parseInt(valor, 10) + delta) + fim;
            });
        resultado = resultado.replace(/(margin-(left|top):)(-?[\d.]+)pt/g, function (_, inicio, eixo, valor) {
            const delta = (eixo === 'left' ? dx : dy) * PT_POR_MM;
            return inicio + arredondar(parseFloat(valor) + delta, 2) + 'pt';
        });
        return resultado;
    }

    // O template usa negrito sintético (a Yuji Syuku só tem o peso regular);
    // a peça exportada sai no peso normal da fonte.
    function removerNegrito(bloco) {
        return bloco.replace(/<w:b(?:Cs)?(?:\s+w:val="[^"]*")?\s*\/>/g, '');
    }

    const EMU_POR_PT = 12700;

    // Caixas verticais do modelo têm altura fixa e cortavam nomes longos
    // ("アルマンド テステ" saía "アルマン"). Sem preenchimento, a caixa pode
    // crescer para baixo, como a prévia; nunca diminui.
    function ajustarAlturaVertical(bloco, valor) {
        if (!/<wps:bodyPr\b[^>]*vert="eaVert"/.test(bloco)) return bloco;
        const tamanhos = (bloco.match(/<w:sz w:val="(\d+)"\/>/g) || []).map(item => parseInt(item.replace(/\D/g, ''), 10));
        const corpoPt = (tamanhos.length ? Math.max.apply(null, tamanhos) : 40) / 2;
        const caracteres = Array.from(String(valor || '')).length;
        const insets = (bloco.match(/\b[tb]Ins="(\d+)"/g) || []).reduce((soma, item) => soma + parseInt(item.replace(/\D/g, ''), 10), 0);
        const necessario = Math.ceil(caracteres * corpoPt * EMU_POR_PT * 1.1) + insets;
        const atual = bloco.match(/<wp:extent cx="\d+" cy="(\d+)"\/>/);
        if (!atual || necessario <= parseInt(atual[1], 10)) return bloco;
        return bloco
            .replace(/(<wp:extent cx="\d+" cy=")\d+("\/>)/, '$1' + necessario + '$2')
            .replace(/(<a:xfrm\b[^>]*>[\s\S]*?<a:ext cx="\d+" cy=")\d+("\/>)/, '$1' + necessario + '$2')
            .replace(/(<v:shape\b[^>]*style="[^"]*?\bheight:)[\d.]+(?:pt|in)/, '$1' + arredondar(necessario / EMU_POR_PT, 2) + 'pt');
    }

    // Mensagem em português: Great Vibes no mesmo corpo da prévia
    // (34 px de design = 19,5 pt na folha de 36,5 cm).
    const FONTE_MENSAGEM = 'Great Vibes';
    const CORPO_MENSAGEM_MEIOS_PONTOS = 39;

    function aplicarFonteMensagem(caixa) {
        return caixa
            .replace(/<w:rFonts\b[^>]*\/>/g, '<w:rFonts w:ascii="' + FONTE_MENSAGEM + '" w:hAnsi="' + FONTE_MENSAGEM + '" w:cs="' + FONTE_MENSAGEM + '"/>')
            .replace(/<w:sz w:val="\d+"\/>/g, '<w:sz w:val="' + CORPO_MENSAGEM_MEIOS_PONTOS + '"/>')
            .replace(/<w:szCs w:val="\d+"\/>/g, '<w:szCs w:val="' + CORPO_MENSAGEM_MEIOS_PONTOS + '"/>');
    }

    // Textos japoneses: Yuji Syuku em todas as faixas de caracteres. O modelo
    // tinha w:eastAsia="Calibri" na caixa do falecido, e o Word desenhava o
    // nome em Yu Gothic/MS Mincho.
    const FONTE_JAPONES = 'Yuji Syuku';
    function aplicarFonteJapones(caixa) {
        return caixa.replace(/<w:rFonts\b[^>]*\/>/g, function (fontes) {
            const dica = (fontes.match(/\sw:hint="[^"]*"/) || [''])[0];
            return '<w:rFonts w:ascii="' + FONTE_JAPONES + '" w:eastAsia="' + FONTE_JAPONES + '" w:hAnsi="' +
                FONTE_JAPONES + '" w:cs="' + FONTE_JAPONES + '"' + dica + '/>';
        });
    }

    function preencherCaixaPorOffset(xml, offsetHorizontal, valor, deslocamento, ajustarCaixa) {
        let encontrado = false;
        const atualizado = xml.replace(/<mc:AlternateContent\b[\s\S]*?<\/mc:AlternateContent>/g, function (bloco) {
            if (!bloco.includes('<wp:posOffset>' + offsetHorizontal + '</wp:posOffset>')) return bloco;
            encontrado = true;
            const preenchido = bloco.replace(/<w:txbxContent\b[^>]*>[\s\S]*?<\/w:txbxContent>/g, function (caixa) {
                const conteudo = removerNegrito(preencherConteudoCaixa(caixa, valor));
                return ajustarCaixa ? ajustarCaixa(conteudo) : conteudo;
            });
            return deslocarCaixa(ajustarAlturaVertical(preenchido, valor), deslocamento);
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
        const deslocamentos = dados.deslocamentosMm || {};
        let resultado = atualizarOpcoesDeRelacao(atualizarOpcoesDePeriodo(xml));
        resultado = preencherCaixaPorOffset(resultado, OFFSETS.nomeFalecidoJapones, dados.nomeFalecidoJapones,
            deslocamentos.nomeFalecidoJapones, aplicarFonteJapones);
        resultado = preencherCaixaPorOffset(
            resultado,
            OFFSETS.nomeFamiliaJapones,
            dados.nomeFamiliaJapones ? dados.nomeFamiliaJapones + '家' : '',
            deslocamentos.nomeFamiliaJapones,
            aplicarFonteJapones
        );
        resultado = preencherCaixaPorOffset(resultado, OFFSETS.relacao, dados.relacao, deslocamentos.relacao,
            aplicarFonteJapones);
        resultado = preencherCaixaPorOffset(resultado, OFFSETS.periodoJapones, dados.periodoJapones,
            deslocamentos.periodoJapones, aplicarFonteJapones);
        resultado = preencherCaixaPorOffset(resultado, OFFSETS.mensagem, dados.mostrarMensagem ? dados.mensagem : '',
            deslocamentos.mensagem, aplicarFonteMensagem);
        // O template possui marcadores de permissão que o Word inclui na saída
        // impressa como pequenos traços. Eles não são necessários para editar os
        // campos e são removidos somente da cópia exportada.
        resultado = resultado.replace(/<w:perm(?:Start|End)\b[^>]*\/>/g, '');
        return resultado;
    }

    /* =======================================================================
       FONTES INCORPORADAS NO WORD
       -----------------------------------------------------------------------
       O .docx leva a Yuji Syuku e a Great Vibes dentro do arquivo, para abrir
       igual em qualquer computador. Para não carregar 8 MB, os desenhos dos
       caracteres que não aparecem no Noshigami são esvaziados: a fonte mantém
       todas as tabelas (inclusive as formas verticais do japonês), só sem os
       contornos que não serão usados.
       ======================================================================= */
    function bytesDe(valor) {
        // Buffer do Node também é Uint8Array, mas o slice dele não copia:
        // converte para Uint8Array comum para as cópias serem independentes.
        if (valor instanceof Uint8Array) return valor.constructor === Uint8Array ? valor : new Uint8Array(valor);
        if (typeof valor === 'string') {
            if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(valor, 'base64'));
            const binario = atob(valor);
            const bytes = new Uint8Array(binario.length);
            for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
            return bytes;
        }
        if (valor instanceof ArrayBuffer) return new Uint8Array(valor);
        throw new Error('Fonte em formato desconhecido.');
    }

    function lerTabelas(bytes) {
        const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const tabelas = {};
        const total = dv.getUint16(4);
        for (let i = 0; i < total; i += 1) {
            const p = 12 + i * 16;
            const tag = String.fromCharCode(bytes[p], bytes[p + 1], bytes[p + 2], bytes[p + 3]);
            tabelas[tag] = { offset: dv.getUint32(p + 8), length: dv.getUint32(p + 12) };
        }
        return { dv: dv, tabelas: tabelas };
    }

    // Percorre todos os mapeamentos caractere → glifo da tabela cmap.
    function percorrerCmap(dv, cmap, visitar) {
        const subtabelas = dv.getUint16(cmap + 2);
        for (let i = 0; i < subtabelas; i += 1) {
            const sub = cmap + dv.getUint32(cmap + 4 + i * 8 + 4);
            const formato = dv.getUint16(sub);
            if (formato === 4) {
                const segmentos = dv.getUint16(sub + 6) / 2;
                const fins = sub + 14;
                const inicios = fins + segmentos * 2 + 2;
                const deltas = inicios + segmentos * 2;
                const deslocs = deltas + segmentos * 2;
                for (let s = 0; s < segmentos; s += 1) {
                    const inicio = dv.getUint16(inicios + s * 2);
                    const fim = dv.getUint16(fins + s * 2);
                    const delta = dv.getUint16(deltas + s * 2);
                    const desloc = dv.getUint16(deslocs + s * 2);
                    for (let c = inicio; c <= fim && c !== 0xFFFF; c += 1) {
                        let glifo;
                        if (!desloc) glifo = (c + delta) & 0xFFFF;
                        else {
                            glifo = dv.getUint16(deslocs + s * 2 + desloc + (c - inicio) * 2);
                            if (glifo) glifo = (glifo + delta) & 0xFFFF;
                        }
                        if (glifo) visitar(c, glifo);
                    }
                }
            } else if (formato === 12) {
                const grupos = dv.getUint32(sub + 12);
                for (let g = 0; g < grupos; g += 1) {
                    const p = sub + 16 + g * 12;
                    const inicio = dv.getUint32(p);
                    const fim = dv.getUint32(p + 4);
                    const primeiro = dv.getUint32(p + 8);
                    for (let c = inicio; c <= fim; c += 1) visitar(c, primeiro + (c - inicio));
                }
            }
        }
    }

    function somaVerificacao(bytes, inicio, tamanho) {
        const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        let soma = 0;
        for (let i = 0; i < tamanho; i += 4) soma = (soma + dv.getUint32(inicio + i)) >>> 0;
        return soma;
    }

    // Devolve uma cópia da fonte TrueType só com os contornos dos caracteres
    // em que manter(codigo) é verdadeiro. Glifos sem caractere próprio
    // (formas verticais, ligaduras) e componentes de glifos compostos ficam.
    function esvaziarGlifos(entrada, manter) {
        const bytes = bytesDe(entrada);
        const { dv, tabelas } = lerTabelas(bytes);
        ['head', 'maxp', 'loca', 'glyf', 'cmap'].forEach(tag => {
            if (!tabelas[tag]) throw new Error('Fonte sem a tabela ' + tag + '.');
        });
        const totalGlifos = dv.getUint16(tabelas.maxp.offset + 4);
        const locaLonga = dv.getInt16(tabelas.head.offset + 50) === 1;
        const loca = tabelas.loca.offset;
        const glyf = tabelas.glyf.offset;
        const posicao = i => (locaLonga ? dv.getUint32(loca + i * 4) : dv.getUint16(loca + i * 2) * 2);

        const comCaractere = new Uint8Array(totalGlifos);
        const usado = new Uint8Array(totalGlifos);
        percorrerCmap(dv, tabelas.cmap.offset, function (codigo, glifo) {
            if (glifo >= totalGlifos) return;
            comCaractere[glifo] = 1;
            if (manter(codigo)) usado[glifo] = 1;
        });
        const fila = [];
        for (let g = 0; g < totalGlifos; g += 1) {
            if (g === 0 || !comCaractere[g]) usado[g] = 1;
            if (usado[g]) fila.push(g);
        }
        // Componentes de glifos compostos.
        while (fila.length) {
            const g = fila.pop();
            const inicio = posicao(g);
            if (posicao(g + 1) - inicio < 10 || dv.getInt16(glyf + inicio) >= 0) continue;
            let p = glyf + inicio + 10;
            let maisComponentes = true;
            while (maisComponentes) {
                const flags = dv.getUint16(p);
                const componente = dv.getUint16(p + 2);
                if (componente < totalGlifos && !usado[componente]) {
                    usado[componente] = 1;
                    fila.push(componente);
                }
                p += 4 + (flags & 0x0001 ? 4 : 2);
                if (flags & 0x0008) p += 2;
                else if (flags & 0x0040) p += 4;
                else if (flags & 0x0080) p += 8;
                maisComponentes = Boolean(flags & 0x0020);
            }
        }

        // Nova glyf e loca (sempre no formato longo).
        let tamanhoGlyf = 0;
        for (let g = 0; g < totalGlifos; g += 1) {
            if (usado[g]) tamanhoGlyf += (posicao(g + 1) - posicao(g) + 3) & ~3;
        }
        const novaGlyf = new Uint8Array(tamanhoGlyf);
        const novaLoca = new Uint8Array((totalGlifos + 1) * 4);
        const dvLoca = new DataView(novaLoca.buffer);
        let cursor = 0;
        for (let g = 0; g < totalGlifos; g += 1) {
            dvLoca.setUint32(g * 4, cursor);
            if (!usado[g]) continue;
            const inicio = posicao(g);
            const fim = posicao(g + 1);
            novaGlyf.set(bytes.subarray(glyf + inicio, glyf + fim), cursor);
            cursor += (fim - inicio + 3) & ~3;
        }
        dvLoca.setUint32(totalGlifos * 4, cursor);

        const novas = {};
        Object.keys(tabelas).forEach(tag => {
            if (tag === 'DSIG') return; // a assinatura deixa de valer com a fonte alterada
            const t = tabelas[tag];
            novas[tag] = bytes.slice(t.offset, t.offset + t.length);
        });
        novas.glyf = novaGlyf;
        novas.loca = novaLoca;
        if (novas.post && novas.post.length >= 32) {
            // post versão 3: sem a lista de nomes de glifos.
            novas.post = novas.post.slice(0, 32);
            new DataView(novas.post.buffer).setUint32(0, 0x00030000);
        }
        const dvHead = new DataView(novas.head.buffer);
        dvHead.setInt16(50, 1);
        dvHead.setUint32(8, 0);

        const tags = Object.keys(novas).sort();
        const cabecalho = 12 + tags.length * 16;
        let total = cabecalho;
        tags.forEach(tag => { total += (novas[tag].length + 3) & ~3; });
        const saida = new Uint8Array(total);
        const dvSaida = new DataView(saida.buffer);
        dvSaida.setUint32(0, dv.getUint32(0));
        dvSaida.setUint16(4, tags.length);
        let potencia = 1;
        let expoente = 0;
        while (potencia * 2 <= tags.length) { potencia *= 2; expoente += 1; }
        dvSaida.setUint16(6, potencia * 16);
        dvSaida.setUint16(8, expoente);
        dvSaida.setUint16(10, tags.length * 16 - potencia * 16);
        let deslocamento = cabecalho;
        let posicaoHead = 0;
        tags.forEach((tag, i) => {
            const dados = novas[tag];
            const p = 12 + i * 16;
            for (let k = 0; k < 4; k += 1) saida[p + k] = tag.charCodeAt(k);
            saida.set(dados, deslocamento);
            dvSaida.setUint32(p + 4, somaVerificacao(saida, deslocamento, (dados.length + 3) & ~3));
            dvSaida.setUint32(p + 8, deslocamento);
            dvSaida.setUint32(p + 12, dados.length);
            if (tag === 'head') posicaoHead = deslocamento;
            deslocamento += (dados.length + 3) & ~3;
        });
        dvSaida.setUint32(posicaoHead + 8, (0xB1B0AFBA - somaVerificacao(saida, 0, total)) >>> 0);
        return saida;
    }

    // Caracteres com contorno numa fonte (para avisar o que ficaria de fora).
    function caracteresComContorno(entrada) {
        const bytes = bytesDe(entrada);
        const { dv, tabelas } = lerTabelas(bytes);
        const locaLonga = dv.getInt16(tabelas.head.offset + 50) === 1;
        const loca = tabelas.loca.offset;
        const posicao = i => (locaLonga ? dv.getUint32(loca + i * 4) : dv.getUint16(loca + i * 2) * 2);
        const resultado = new Set();
        percorrerCmap(dv, tabelas.cmap.offset, function (codigo, glifo) {
            if (posicao(glifo + 1) > posicao(glifo)) resultado.add(codigo);
        });
        return resultado;
    }

    function novoGuid(aleatorio) {
        const bytes = new Uint8Array(16);
        if (aleatorio) bytes.set(aleatorio.slice(0, 16));
        else if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
        else for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        return '{' + hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20) + '}';
    }

    // Ofuscação exigida pelo Word para fontes incorporadas (ECMA-376):
    // os 32 primeiros bytes passam por XOR com a chave da fonte (GUID lido
    // de trás para a frente).
    function ofuscarFonte(fonte, guid) {
        const hex = guid.replace(/[{}-]/g, '');
        const chave = [];
        for (let i = 0; i < 16; i += 1) chave.push(parseInt(hex.substr(30 - i * 2, 2), 16));
        const saida = fonte.slice();
        for (let i = 0; i < 32; i += 1) saida[i] ^= chave[i % 16];
        return saida;
    }

    async function incorporarFontes(zip, usos) {
        const nomes = Object.keys(usos);
        if (!nomes.length) return;
        let tabelaFontes = await zip.file('word/fontTable.xml').async('string');
        const relacoes = [];
        nomes.forEach((nome, i) => {
            const id = 'rIdFonteNoshigami' + (i + 1);
            const arquivo = 'fonts/noshigami-fonte' + (i + 1) + '.odttf';
            const guid = novoGuid();
            const caracteres = new Set(Array.from(usos[nome].texto, c => c.codePointAt(0)));
            for (let c = 0x20; c < 0x7F; c += 1) caracteres.add(c);
            const fonte = esvaziarGlifos(usos[nome].fonte, codigo => caracteres.has(codigo));
            zip.file('word/' + arquivo, ofuscarFonte(fonte, guid));
            relacoes.push('<Relationship Id="' + id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="' + arquivo + '"/>');
            const incorporada = '<w:embedRegular r:id="' + id + '" w:fontKey="' + guid + '" w:subsetted="1"/>';
            const existente = new RegExp('(<w:font w:name="' + nome + '">[\\s\\S]*?)(<\\/w:font>)');
            if (existente.test(tabelaFontes)) {
                tabelaFontes = tabelaFontes.replace(existente, '$1' + incorporada + '$2');
            } else {
                tabelaFontes = tabelaFontes.replace('</w:fonts>', '<w:font w:name="' + nome + '"><w:charset w:val="00"/>' +
                    '<w:family w:val="script"/><w:pitch w:val="variable"/>' + incorporada + '</w:font></w:fonts>');
            }
        });
        zip.file('word/fontTable.xml', tabelaFontes);
        zip.file('word/_rels/fontTable.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + relacoes.join('') + '</Relationships>');
        let tipos = await zip.file('[Content_Types].xml').async('string');
        if (!tipos.includes('Extension="odttf"')) {
            tipos = tipos.replace('<Default Extension="rels"',
                '<Default Extension="odttf" ContentType="application/vnd.openxmlformats-officedocument.obfuscatedFont"/><Default Extension="rels"');
            zip.file('[Content_Types].xml', tipos);
        }
    }

    // fontes: { 'Yuji Syuku': bytes|base64, 'Great Vibes': bytes|base64 } (opcional).
    async function gerarDocx(JSZipCtor, templateBase64, dados, tipoSaida, fontes) {
        if (!JSZipCtor) throw new Error('JSZip nao foi carregado.');
        if (!templateBase64) throw new Error('Template DOCX nao foi carregado.');

        const zip = await JSZipCtor.loadAsync(templateBase64, { base64: true });
        const documento = zip.file('word/document.xml');
        if (!documento) throw new Error('Template DOCX invalido: word/document.xml ausente.');

        const xmlOriginal = await documento.async('string');
        zip.file('word/document.xml', preencherTemplateXml(xmlOriginal, dados));
        if (fontes) {
            const usos = {};
            if (fontes['Yuji Syuku']) {
                usos['Yuji Syuku'] = {
                    fonte: fontes['Yuji Syuku'],
                    texto: [dados.nomeFalecidoJapones, dados.nomeFamiliaJapones, '家', dados.relacao, dados.periodoJapones].join('')
                };
            }
            if (fontes[FONTE_MENSAGEM]) {
                usos[FONTE_MENSAGEM] = { fonte: fontes[FONTE_MENSAGEM], texto: dados.mostrarMensagem ? String(dados.mensagem || '') : '' };
            }
            await incorporarFontes(zip, usos);
        }
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
        esvaziarGlifos: esvaziarGlifos,
        caracteresComContorno: caracteresComContorno,
        ofuscarFonte: ofuscarFonte,
        gerarDocx: gerarDocx
    };
}));
