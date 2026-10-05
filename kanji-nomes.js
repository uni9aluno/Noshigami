(function (root, factory) {
    'use strict';
    const api = factory(root.NoshigamiKatakana);
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.NoshigamiKanji = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (katakana) {
    'use strict';

    /* Opções de kanji para mostrar ao CLIENTE escolher na tela cheia.
       Quem atende não sabe japonês: o cliente reconhece a escrita da família
       (ou compara com um papel/foto) e aponta. Por isso a lista não precisa
       acertar uma única grafia, só conter as mais comuns — em ordem da mais
       frequente para a menos frequente. Quando a da família não estiver aqui,
       o cliente escolhe o katakana ou "não sei", e a grafia é confirmada
       depois.

       Lista curada à mão (sobrenomes mais comuns no Japão, sobrenomes
       okinawanos frequentes no Brasil e nomes comuns de isseis/nisseis).
       Para incluir uma grafia, acrescente-a ao fim da lista da leitura. */
    const SOBRENOMES = {
        sato: ['佐藤'], suzuki: ['鈴木'], takahashi: ['高橋', '髙橋'], tanaka: ['田中'],
        watanabe: ['渡辺', '渡部', '渡邊', '渡邉'], ito: ['伊藤', '伊東', '井藤'],
        yamamoto: ['山本'], nakamura: ['中村'], kobayashi: ['小林'], kato: ['加藤'],
        yoshida: ['吉田'], yamada: ['山田'], sasaki: ['佐々木'], yamaguchi: ['山口'],
        matsumoto: ['松本'], inoue: ['井上'], kimura: ['木村'], hayashi: ['林'],
        saito: ['斎藤', '斉藤', '齋藤', '齊藤'], shimizu: ['清水'], yamazaki: ['山崎', '山﨑'],
        mori: ['森'], abe: ['阿部', '安部', '安倍'], ikeda: ['池田'], hashimoto: ['橋本'],
        yamashita: ['山下'], ishikawa: ['石川'], nakajima: ['中島', '中嶋'], maeda: ['前田'],
        fujita: ['藤田'], ogawa: ['小川'], goto: ['後藤'], okada: ['岡田'],
        hasegawa: ['長谷川'], murakami: ['村上'], kondo: ['近藤'], ishii: ['石井'],
        sakamoto: ['坂本'], endo: ['遠藤'], aoki: ['青木'], fujii: ['藤井'],
        nishimura: ['西村'], fukuda: ['福田'], ota: ['太田'], miura: ['三浦'],
        fujiwara: ['藤原'], okamoto: ['岡本'], matsuda: ['松田'], nakagawa: ['中川'],
        nakano: ['中野'], harada: ['原田'], ono: ['小野', '大野'], tamura: ['田村'],
        takeuchi: ['竹内'], kaneko: ['金子'], wada: ['和田'], nakayama: ['中山'],
        ishida: ['石田'], ueda: ['上田'], morita: ['森田'], hara: ['原'], shibata: ['柴田'],
        sakai: ['酒井', '坂井'], kudo: ['工藤'], yokoyama: ['横山'], miyazaki: ['宮崎'],
        miyamoto: ['宮本'], uchida: ['内田'], takagi: ['高木'], ando: ['安藤'],
        taniguchi: ['谷口'], maruyama: ['丸山'], imai: ['今井'], takada: ['高田'],
        fujimoto: ['藤本'], takeda: ['武田'], murata: ['村田'], ueno: ['上野'],
        sugiyama: ['杉山'], masuda: ['増田'], sugawara: ['菅原'], hirano: ['平野'],
        otsuka: ['大塚'], chiba: ['千葉'], kubo: ['久保'], matsui: ['松井'],
        iwasaki: ['岩崎'], sakurai: ['桜井', '櫻井'], kinoshita: ['木下'], noguchi: ['野口'],
        matsuo: ['松尾'], nomura: ['野村'], kikuchi: ['菊地', '菊池'], sano: ['佐野'],
        onishi: ['大西'], sugimoto: ['杉本'], arai: ['新井', '荒井'], hamada: ['浜田', '濱田'],
        ichikawa: ['市川'], furukawa: ['古川'], mizuno: ['水野'], komatsu: ['小松'],
        shimada: ['島田', '嶋田'], koyama: ['小山'], takano: ['高野'], yamauchi: ['山内'],
        nishida: ['西田'], nishikawa: ['西川'], igarashi: ['五十嵐'], kitamura: ['北村'],
        yasuda: ['安田'], nakata: ['中田'], kawaguchi: ['川口'], hirata: ['平田'],
        kawasaki: ['川崎'], iida: ['飯田'], yoshikawa: ['吉川'], honda: ['本田'],
        kubota: ['久保田'], sawada: ['沢田', '澤田'], tsuji: ['辻'], seki: ['関'],
        yoshimura: ['吉村'], iwata: ['岩田'], nakanishi: ['中西'], hattori: ['服部'],
        higuchi: ['樋口'], fukushima: ['福島'], kawakami: ['川上'], nagai: ['永井'],
        matsuoka: ['松岡'], taguchi: ['田口'], yamanaka: ['山中'], morimoto: ['森本'],
        tsuchiya: ['土屋'], yano: ['矢野'], hirose: ['広瀬'], akiyama: ['秋山'],
        ishihara: ['石原'], matsushita: ['松下'], oshima: ['大島'], okubo: ['大久保'],
        kojima: ['小島', '児島'], nagata: ['永田'], iwamoto: ['岩本'], hirai: ['平井'],
        miyake: ['三宅'], kawamura: ['川村', '河村'], kono: ['河野'], nishiyama: ['西山'],
        okazaki: ['岡崎'], oyama: ['大山'], sugita: ['杉田'], matsumura: ['松村'],
        noda: ['野田'], miyata: ['宮田'], uehara: ['上原'],
        // Okinawanos, muito presentes entre os nikkeis do Brasil.
        kinjo: ['金城'], kaneshiro: ['金城'], kanashiro: ['金城'], oshiro: ['大城'],
        higa: ['比嘉'], miyagi: ['宮城'], miyashiro: ['宮城', '宮代'], chinen: ['知念'],
        tamashiro: ['玉城'], tamaki: ['玉城', '玉木'], shimabukuro: ['島袋'],
        yonamine: ['与那嶺'], arakaki: ['新垣'], aragaki: ['新垣'], shiroma: ['城間'],
        teruya: ['照屋'], nakamine: ['仲嶺', '仲峰'], yogi: ['与儀'], ganaha: ['我那覇'],
        kohatsu: ['小波津'], nakama: ['仲間'], toma: ['当間', '当真'], uezu: ['上江洲'],
        gushiken: ['具志堅'], yamashiro: ['山城'], nakasone: ['仲宗根', '中曽根'],
        iha: ['伊波'], takara: ['高良'], nagamine: ['長嶺'], kina: ['喜納'],
        asato: ['安里'], kakazu: ['嘉数'], kuniyoshi: ['国吉'], shinzato: ['新里'],
        maeshiro: ['前城'], inamine: ['稲嶺'], nakazato: ['仲里', '中里'],
        nakandakare: ['仲村渠'], ganeku: ['我如古'], ishimine: ['伊志嶺'], miyahira: ['宮平'],
        agena: ['安慶名'], tokeshi: ['渡慶次'], nakachi: ['仲地'], yonaha: ['与那覇'],
        tengan: ['天願'], oyakawa: ['親川'], kuba: ['久場'], kise: ['喜瀬'], tsuha: ['津波'],
        zukeran: ['瑞慶覧'], chibana: ['知花'], onaga: ['翁長'], ikemiyagi: ['池宮城'],
        hokama: ['外間'], sakima: ['佐喜眞', '佐喜真'], shinjo: ['新城'], arashiro: ['新城'],
        gushi: ['具志'], kakinohana: ['垣花'], tamanaha: ['玉那覇'], nishime: ['西銘'],
        kyan: ['喜屋武'], aniya: ['安仁屋'], adaniya: ['安谷屋'], uema: ['上間']
    };

    const NOMES = {
        shigeru: ['茂', '繁', '滋'], hiroshi: ['博', '弘', '宏', '浩', '寛', '洋'],
        takeshi: ['武', '剛', '猛', '健', '毅'], kiyoshi: ['清', '潔', '聖'],
        akira: ['明', '昭', '晃', '彰', '章'], isamu: ['勇'], minoru: ['実', '稔', '穣'],
        masao: ['正雄', '正夫', '政雄', '昌夫'], tadashi: ['正', '忠', '匡'],
        yoshio: ['義雄', '良雄', '芳雄', '義男'], kazuo: ['一雄', '和夫', '一夫', '和雄'],
        haruo: ['春雄', '晴夫', '治夫'], toshio: ['敏雄', '利夫', '俊夫', '敏夫'],
        susumu: ['進', '晋'], osamu: ['修', '治', '収'], mitsuo: ['光雄', '満男', '光男'],
        tetsuo: ['哲夫', '哲雄'], noboru: ['昇', '登'], yutaka: ['豊', '裕', '寛'],
        makoto: ['誠', '真', '信'], hideo: ['英雄', '秀夫', '英夫', '秀雄'],
        katsumi: ['勝美', '克己', '勝己'], ichiro: ['一郎'], jiro: ['二郎', '次郎'],
        saburo: ['三郎'], taro: ['太郎'], kenji: ['健二', '賢治', '憲二', '健司'],
        tsuyoshi: ['剛', '毅', '強'], akio: ['昭夫', '明夫', '昭雄', '秋雄'],
        shoji: ['昭二', '正治', '昭司'], tomio: ['富夫', '富雄'],
        yasuo: ['康夫', '安雄', '泰雄', '保夫'], nobuo: ['信夫', '信雄', '伸夫'],
        takashi: ['隆', '孝', '崇', '高志', '貴志'], satoshi: ['聡', '智', '悟'],
        kenichi: ['健一', '憲一', '賢一'], masaru: ['勝', '優'], hajime: ['一', '肇', '元'],
        tatsuo: ['達雄', '辰雄', '龍夫'], fumio: ['文雄', '文夫'], ken: ['健', '謙', '賢'],
        jun: ['淳', '純', '潤'], koji: ['浩二', '浩司', '幸治', '孝二'],
        seiji: ['誠二', '清治', '政治'], shinichi: ['真一', '伸一', '信一', '慎一'],
        michiko: ['美智子', '道子', '三千子'], yoko: ['洋子', '陽子', '葉子', '容子'],
        keiko: ['恵子', '敬子', '啓子', '圭子', '慶子'], kazuko: ['和子', '一子'],
        sachiko: ['幸子', '祥子'], hiroko: ['弘子', '裕子', '博子', '宏子', '浩子'],
        fumiko: ['文子', '富美子', '史子'], setsuko: ['節子'],
        toshiko: ['敏子', '俊子', '利子', '寿子'], haruko: ['春子', '晴子', '治子'],
        yoshiko: ['良子', '芳子', '佳子', '好子', '淑子'], masako: ['正子', '雅子', '昌子', '政子'],
        hanako: ['花子', '華子'], kimiko: ['君子', '喜美子', '公子'],
        chieko: ['千恵子', '智恵子', '知恵子'], emiko: ['恵美子', '笑子', '絵美子'],
        akemi: ['明美', '朱美'], tomoko: ['智子', '友子', '知子', '朋子'],
        mitsuko: ['光子', '満子'], kiyoko: ['清子', '喜代子'], fusako: ['房子', '総子'],
        shizuko: ['静子', '志津子'], teruko: ['照子', '輝子'], chiyoko: ['千代子'],
        yukiko: ['幸子', '由紀子', '雪子', '由希子'], yuko: ['裕子', '優子', '祐子', '夕子'],
        kyoko: ['京子', '恭子', '響子'], ryoko: ['良子', '涼子', '亮子'],
        shoko: ['祥子', '昌子', '翔子'], tamiko: ['民子'], sumiko: ['澄子', '純子', '寿美子'],
        noriko: ['典子', '紀子', '則子'], etsuko: ['悦子'], reiko: ['玲子', '礼子', '麗子'],
        junko: ['順子', '純子', '淳子'], kumiko: ['久美子', '公子'],
        mariko: ['真理子', '万里子', '麻里子'], naoko: ['直子', '尚子'],
        harue: ['春江', '晴枝'], yaeko: ['八重子'], hatsue: ['初江', '初枝'],
        chiyo: ['千代'], kiku: ['菊'],
        // Mais nomes típicos de isseis e nisseis (era Showa).
        tsutomu: ['勉', '努', '務', '力'], sadao: ['貞夫', '貞雄', '定雄', '定夫'],
        mamoru: ['守', '衛', '護'], takeo: ['武雄', '武夫', '竹雄', '健夫'],
        masayoshi: ['正義', '正善', '雅義'], yoshikazu: ['義一', '良和', '芳和'],
        hisashi: ['久', '尚', '寿'], tadao: ['忠雄', '忠夫', '忠男'],
        toshiyuki: ['敏之', '俊之', '利行'], katsuo: ['勝雄', '勝夫', '克夫'],
        kunio: ['邦夫', '国雄', '邦雄', '国夫'], teruo: ['照雄', '輝夫', '照夫'],
        yukio: ['幸雄', '幸夫', '行雄', '由紀夫'], mikio: ['幹夫', '幹雄'],
        shizuo: ['静雄', '静夫'], tamotsu: ['保'], isao: ['功', '勲', '勇夫'],
        satoru: ['悟', '覚', '聡'], kaoru: ['薫', '馨'], mitsuru: ['満', '充'],
        shoichi: ['正一', '昭一', '庄一'], eiji: ['英二', '栄治', '英治'],
        yuji: ['裕二', '雄二', '祐二', '勇二'], kenzo: ['健三', '謙三'],
        goro: ['五郎', '吾郎'], shiro: ['四郎', '史郎', '志郎'], rokuro: ['六郎'],
        hachiro: ['八郎'], yoshimi: ['義美', '良美', '芳美'],
        kimie: ['君江', '喜美江', '公恵', '君枝'], kiyomi: ['清美', '喜代美'],
        sumie: ['澄江', '寿美江', '澄枝'], yoshie: ['良江', '芳江', '佳恵', '喜枝'],
        hisako: ['久子', '寿子', '尚子'], masae: ['正江', '雅江', '昌枝', '政江'],
        mieko: ['美恵子', '三枝子'], tsuruko: ['鶴子'], tokiko: ['登紀子', '時子'],
        misako: ['美佐子', '美砂子'], takako: ['孝子', '隆子', '貴子', '高子'],
        nobuko: ['信子', '伸子', '延子'], ayako: ['綾子', '彩子', '文子'],
        katsuko: ['勝子', '克子'], tsuneko: ['恒子', '常子'], mineko: ['峰子', '美根子'],
        kayoko: ['佳代子', '加代子', '嘉代子'], sueko: ['末子', '季子'],
        shigeko: ['茂子', '繁子', '重子'], kazue: ['和江', '一枝', '和枝'],
        tomie: ['富江', '登美江', '富枝'], hideko: ['秀子', '英子'], eiko: ['栄子', '英子'],
        tomiko: ['富子', '登美子', '冨美子'], yasuko: ['康子', '安子', '泰子', '保子'],
        yuriko: ['百合子', '由利子', '由里子'], harumi: ['春美', '晴美', '治美'],
        hiromi: ['弘美', '裕美', '博美'], kazumi: ['和美', '一美'],
        akiko: ['明子', '昭子', '秋子', '章子', '晶子']
    };

    // Base ampla gerada por tools/gerar-kanji-dados.js (assets/kanji-dados.js):
    // ~1.700 leituras de sobrenomes ordenadas por população e ~8.000 de nomes.
    let DADOS = (typeof globalThis !== 'undefined' && globalThis.NOSHIGAMI_KANJI_DADOS) || null;
    if (!DADOS && typeof module === 'object' && module.exports) {
        try {
            require('./assets/kanji-dados.js');
            DADOS = globalThis.NOSHIGAMI_KANJI_DADOS || null;
        } catch (erro) {
            DADOS = null; // ainda não gerado: vale só a lista curada
        }
    }

    // Chave de busca: romanização Kunrei (si, ti, tu, hu) vira Hepburn e as
    // vogais longas são encurtadas, porque no Brasil "Sato", "Satou" e
    // "Satoh" são o mesmo nome. A mesma regra vale para o dicionário, então
    // os dois lados sempre se encontram.
    function chave(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .replace(/[^a-z]/g, '')
            .replace(/sy/g, 'sh').replace(/ty/g, 'ch').replace(/zy/g, 'j')
            .replace(/si/g, 'shi').replace(/shhi/g, 'shi')
            .replace(/ti/g, 'chi').replace(/tu/g, 'tsu').replace(/tssu/g, 'tsu')
            .replace(/(^|[^sc])hu/g, '$1fu').replace(/zi/g, 'ji') // "shu"/"chu" ficam
            .replace(/oh(?![aiueoy])/g, 'o')
            .replace(/ou/g, 'o').replace(/oo/g, 'o').replace(/uu/g, 'u');
    }

    function indexar(dicionario, tipo, indice) {
        Object.keys(dicionario).forEach(leitura => {
            const k = chave(leitura);
            const atual = indice.get(k) || { tipo, kanji: [] };
            dicionario[leitura].forEach(kanji => {
                if (!atual.kanji.includes(kanji)) atual.kanji.push(kanji);
            });
            indice.set(k, atual);
        });
    }

    const INDICE_SOBRENOMES = new Map();
    const INDICE_NOMES = new Map();
    // Sobrenomes: a ordem por população da base vem primeiro; a lista curada
    // só acrescenta o que faltar (Kanashiro, grafias okinawanas).
    // Nomes: as grafias curadas (tradicionais) vêm primeiro; a base, que é
    // mais moderna e tem grafias raras, completa depois.
    if (DADOS && DADOS.sobrenomes) indexar(DADOS.sobrenomes, 'sobrenome', INDICE_SOBRENOMES);
    indexar(SOBRENOMES, 'sobrenome', INDICE_SOBRENOMES);
    indexar(NOMES, 'nome', INDICE_NOMES);
    if (DADOS && DADOS.nomes) indexar(DADOS.nomes, 'nome', INDICE_NOMES);

    // Só a lista curada: usada para grafias de cartório (Tacachi, Sigueru),
    // em que a base ampla traria falsos japoneses (Erica → えりか).
    const CURADO_SOBRENOMES = new Map();
    const CURADO_NOMES = new Map();
    indexar(SOBRENOMES, 'sobrenome', CURADO_SOBRENOMES);
    indexar(NOMES, 'nome', CURADO_NOMES);

    // Chaves possíveis de uma palavra digitada: como está e, para grafias de
    // cartório brasileiro (Tacachi, Sigueru), pela leitura do conversor.
    function chavesDe(palavra) {
        const chaves = [chave(palavra)];
        if (katakana && typeof katakana.preparar === 'function') {
            try {
                chaves.push(chave(katakana.preparar(palavra)));
            } catch (erro) {
                // sem leitura alternativa
            }
        }
        return Array.from(new Set(chaves.filter(Boolean)));
    }

    /* Grafias em kanji para uma palavra do nome. "preferencia" decide qual
       lista vem primeiro quando a leitura existe nas duas (Shoji é nome e
       sobrenome): 'sobrenome' para a família, 'nome' para o prenome. */
    function candidatos(palavra, preferencia) {
        // Usa só a lista do tipo pedido; a outra entra apenas se a primeira não
        // tiver nada (sem isso, Saito trazia 彩人 — um prenome — como sobrenome).
        // Maria, Ana, Souza...: nome português conhecido nunca recebe kanji.
        if (katakana && typeof katakana.nomePortugues === 'function' && katakana.nomePortugues(palavra)) {
            return { tipo: '', kanji: [] };
        }
        // Romaji válido (Hiroshi) busca em tudo; grafia aportuguesada
        // (Tacachi) só na lista curada de nomes tradicionais.
        const romaji = !katakana || typeof katakana.origem !== 'function' || katakana.origem(palavra) === 'japones';
        const ordem = preferencia === 'nome'
            ? (romaji ? [INDICE_NOMES, INDICE_SOBRENOMES] : [CURADO_NOMES, CURADO_SOBRENOMES])
            : (romaji ? [INDICE_SOBRENOMES, INDICE_NOMES] : [CURADO_SOBRENOMES, CURADO_NOMES]);
        const chaves = chavesDe(palavra);
        for (const indice of ordem) {
            const resultado = [];
            let tipo = '';
            chaves.forEach(k => {
                const item = indice.get(k);
                if (!item) return;
                tipo = tipo || item.tipo;
                item.kanji.forEach(kanji => {
                    if (!resultado.includes(kanji)) resultado.push(kanji);
                });
            });
            if (resultado.length) return { tipo, kanji: resultado };
        }
        return { tipo: '', kanji: [] };
    }

    return Object.freeze({ candidatos, chave });
}));
