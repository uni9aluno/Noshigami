(function (root, factory) {
    'use strict';
    const api = factory(root.wanakana);
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.NoshigamiKatakana = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (wanakana) {
    'use strict';

    const EXCECOES = Object.freeze({
        armando: 'arumando',
        geronimo: 'jeronimo',
        joao: 'joan',
        jose: 'joze'
    });
    const CONSOANTES = /[bcdfghjklmnpqrstvwxyz]/;
    const PARES_JAPONESES = new Set([
        'ch', 'sh', 'ts', 'ny', 'ry', 'ky', 'gy', 'by', 'py', 'my', 'hy', 'jy'
    ]);

    function chave(valor) {
        return String(valor || '')
            .trim()
            .toLowerCase()
            .replace(/ç/g, 's')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z\s'-]/g, '')
            .replace(/\s+/g, ' ');
    }

    function prepararPalavra(valor) {
        const original = chave(valor);
        if (!original) return '';
        if (EXCECOES[original]) return EXCECOES[original];

        let palavra = original
            .replace(/tch/g, 'ch')
            .replace(/nh/g, 'ny')
            .replace(/lh/g, 'ry')
            .replace(/ch/g, 'sh')
            .replace(/rr/g, 'h')
            .replace(/ss/g, 's')
            .replace(/qu(?=[ei])/g, 'k')
            .replace(/gu(?=[ei])/g, 'g')
            .replace(/c(?=[ei])/g, 's')
            .replace(/g(?=[ei])/g, 'j')
            .replace(/c/g, 'k')
            .replace(/q/g, 'k')
            .replace(/x/g, 'sh')
            .replace(/l/g, 'r')
            .replace(/w/g, 'u');

        let resultado = '';
        for (let i = 0; i < palavra.length; i += 1) {
            const atual = palavra[i];
            const proxima = palavra[i + 1] || '';
            if (!CONSOANTES.test(atual)) {
                resultado += atual;
                continue;
            }
            if (!proxima) {
                if (atual === 'm') resultado += 'n';
                else if (atual === 'n') resultado += 'n';
                else resultado += atual + (atual === 'd' || atual === 't' ? 'o' : 'u');
                continue;
            }
            const par = atual + proxima;
            if (CONSOANTES.test(proxima) && atual !== 'n' && !PARES_JAPONESES.has(par)) {
                resultado += atual + (atual === 'd' || atual === 't' ? 'o' : 'u');
            } else {
                resultado += atual;
            }
        }
        return resultado;
    }

    function preparar(valor) {
        return chave(valor)
            .split(/([\s-]+)/)
            .map(parte => /^[\s-]+$/.test(parte) ? ' ' : prepararPalavra(parte))
            .join('')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function sugerir(valor) {
        if (!wanakana || typeof wanakana.toKatakana !== 'function') {
            throw new Error('WanaKana não está disponível.');
        }
        const preparado = preparar(valor);
        if (!preparado) return '';
        const katakana = wanakana.toKatakana(preparado);
        if (/[a-z]/i.test(katakana)) throw new Error('A leitura contém uma combinação não reconhecida.');
        return katakana;
    }

    return Object.freeze({ preparar, sugerir });
}));
