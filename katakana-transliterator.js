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

    /* Sobrenomes e nomes de origem japonesa (Watanabe, Chiba, Shigeru) já
       chegam em romanização Hepburn. Se passassem pelas regras do português,
       "w" viraria "u", "ch" viraria "sh" e "ge" viraria "je" — ウアタナベ,
       シバ, シジェル. Por isso cada palavra que for romaji Hepburn válido é
       convertida direto. A lista abaixo são as sílabas Hepburn aceitas; o
       que estiver fora dela (l, v, c, x, "ti", "hu", "wi"...) indica um nome
       português. */
    const SILABAS_HEPBURN = new Set([
        'a', 'i', 'u', 'e', 'o',
        'ka', 'ki', 'ku', 'ke', 'ko', 'kya', 'kyu', 'kyo',
        'ga', 'gi', 'gu', 'ge', 'go', 'gya', 'gyu', 'gyo',
        'sa', 'shi', 'su', 'se', 'so', 'sha', 'shu', 'sho',
        'za', 'ji', 'zu', 'ze', 'zo', 'ja', 'ju', 'jo',
        'ta', 'chi', 'tsu', 'te', 'to', 'cha', 'chu', 'cho',
        'da', 'de', 'do',
        'na', 'ni', 'nu', 'ne', 'no', 'nya', 'nyu', 'nyo',
        'ha', 'hi', 'fu', 'he', 'ho', 'hya', 'hyu', 'hyo',
        'ba', 'bi', 'bu', 'be', 'bo', 'bya', 'byu', 'byo',
        'pa', 'pi', 'pu', 'pe', 'po', 'pya', 'pyu', 'pyo',
        'ma', 'mi', 'mu', 'me', 'mo', 'mya', 'myu', 'myo',
        'ya', 'yu', 'yo',
        'ra', 'ri', 'ru', 're', 'ro', 'rya', 'ryu', 'ryo',
        'wa', 'wo'
    ]);

    // Nomes brasileiros que, por acaso, também formam romaji válido. Sem esta
    // lista, Regina sairia レギナ em vez de レジナ.
    const NOMES_PORTUGUESES = new Set([
        'regina', 'regiane', 'gina', 'geni', 'genaro', 'gerusa', 'higino',
        'rogerio', 'eugenio', 'chico', 'rocha', 'machado', 'nogueira'
    ]);

    // No Brasil, sobrenomes japoneses costumam ser grafados sem a vogal longa:
    // "Sato" é サトウ (佐藤), não サト. Só entram aqui leituras sem ambiguidade;
    // Ono (小野 オノ / 大野 オオノ), por exemplo, fica de fora.
    const LEITURAS_JAPONESAS = Object.freeze({
        sato: 'satou', ito: 'itou', kato: 'katou', saito: 'saitou', goto: 'gotou',
        endo: 'endou', kondo: 'kondou', ando: 'andou', naito: 'naitou',
        kudo: 'kudou', sudo: 'sudou', muto: 'mutou', shoji: 'shouji',
        ota: 'oota', oshiro: 'ooshiro', otsuka: 'ootsuka', oyama: 'ooyama',
        okubo: 'ookubo', onishi: 'oonishi', ryu: 'ryuu'
    });

    // Acentos do português (macrons como ō são romanização japonesa).
    const ACENTOS_PORTUGUESES = /[áàâãéêíóôõúüç]/i;

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

    /* Devolve a palavra normalizada se ela for romaji Hepburn válido, ou null.
       Normalizações japonesas aplicadas antes da checagem:
       - macrons viram vogal longa (Satō → satou, Ōta → oota não é distinguível:
         ō vira "ou", a forma mais comum em sobrenomes);
       - "oh" antes de consoante é vogal longa (Ohno → oono);
       - "m" antes de b/p/m é o ん (Homma, Sempai). */
    function romajiJapones(bruta) {
        const palavra = chave(String(bruta)
            .toLowerCase()
            .replace(/ā/g, 'aa').replace(/ī/g, 'ii').replace(/ū/g, 'uu')
            .replace(/ē/g, 'ee').replace(/ō/g, 'ou'))
            .replace(/oh(?![aiueoy])/g, 'oo')
            .replace(/m(?=[bpm])/g, 'n');
        if (!palavra) return null;
        if (LEITURAS_JAPONESAS[palavra]) return LEITURAS_JAPONESAS[palavra];

        let i = 0;
        while (i < palavra.length) {
            const atual = palavra[i];
            const proxima = palavra[i + 1] || '';
            if (atual === "'") { i += 1; continue; }
            // ん: n no fim da palavra ou antes de consoante (Honda, Kenji).
            if (atual === 'n' && !/[aiueoy]/.test(proxima)) { i += 1; continue; }
            // っ: consoante dobrada (Hattori, Nakka) ou "tch" (Matcha).
            if (/[kstpgdbz]/.test(atual) && proxima === atual) { i += 1; continue; }
            if (atual === 't' && proxima === 'c' && palavra[i + 2] === 'h') { i += 1; continue; }
            const silaba = [3, 2, 1]
                .map(tamanho => palavra.slice(i, i + tamanho))
                .find(trecho => SILABAS_HEPBURN.has(trecho));
            if (!silaba) return null;
            i += silaba.length;
        }
        return palavra;
    }

    function ehNomePortugues(bruta) {
        return ACENTOS_PORTUGUESES.test(bruta) || NOMES_PORTUGUESES.has(chave(bruta)) || Boolean(EXCECOES[chave(bruta)]);
    }

    // Classifica cada palavra; usado pela interface e pelos testes.
    function origem(palavra) {
        if (ehNomePortugues(palavra)) return 'portugues';
        return romajiJapones(palavra) ? 'japones' : 'portugues';
    }

    function preparar(valor) {
        return String(valor || '')
            .trim()
            .split(/[\s-]+/)
            .filter(Boolean)
            .map(parte => (origem(parte) === 'japones' ? romajiJapones(parte) : prepararPalavra(parte)))
            .filter(Boolean)
            .join(' ');
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

    // Indica se o nome tem alguma palavra de origem japonesa: nesse caso a
    // família pode usar kanji e o vendedor deve perguntar ao cliente.
    function temOrigemJaponesa(valor) {
        return String(valor || '').trim().split(/[\s-]+/).filter(Boolean)
            .some(parte => origem(parte) === 'japones');
    }

    return Object.freeze({ preparar, sugerir, origem, temOrigemJaponesa });
}));
