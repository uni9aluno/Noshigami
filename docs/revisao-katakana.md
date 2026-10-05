# Revisão das sugestões de katakana

Documento gerado por `tools/gerar-revisao-katakana.js` a partir das regras atuais
de `katakana-transliterator.js`. Usa apenas nomes comuns, sem dados de clientes.
Não edite as tabelas à mão para mudar sugestões: anote as respostas e elas serão
incorporadas ao conversor e aos testes; depois o documento é gerado de novo.

## Quem revisa e como

O ideal é uma pessoa fluente em japonês (professor da associação local, Bunkyo,
kenjinkai ou cliente nikkei de confiança). A seção **Casos duvidosos** é a
prioridade: são poucas linhas e cada resposta vira uma regra fixa.

Quem não lê japonês também ajuda nas tabelas completas usando a coluna
**Leitura de volta**: ela mostra o katakana convertido de novo para letras
latinas. Se a leitura não lembrar a pronúncia do nome, há erro. Exemplo: a
versão anterior gerava エヅアルド para Eduardo, cuja leitura de volta é
"ezuarudo" — fácil de perceber mesmo sem saber japonês.

Fontes para conferir sem fluência:

- **Sobrenomes japoneses:** a própria família — Noshigami ou convite de missa
  anterior, tabuleta budista (位牌), lápide, documentos japoneses (koseki) e
  pedidos anteriores da loja. Se a família usa kanji, a sugestão em katakana não
  deve ser usada.
- **Nomes brasileiros:** como a Wikipédia em japonês e os jornais nikkeis de
  São Paulo escrevem o mesmo nome (jogadores, artistas, políticos).

## Casos duvidosos — revisar primeiro

| Nome | Sugestão | Leitura de volta | Dúvida | Resposta |
|---|---|---|---|---|
| Aline | アリネ | arine | O "e" final soa "i" no português: アリネ ou アリーニ/アリニ? |  |
| Jorge | ジョルジェ | joruje | ジョルジェ ou ジョルジ (como se pronuncia no Brasil)? |  |
| Simone | シモネ | shimone | シモネ ou シモーネ (vogal longa)? |  |
| Helena | ヘレナ | herena | O "h" é mudo no português: ヘレナ ou エレナ? |  |
| Hugo | フゴ | fugo | O "h" é mudo no português: フゴ ou ウーゴ? |  |
| Vitor | ビトル | bitoru | ビトル, ヴィトル ou ビトール? |  |
| Martins | マルチンス | maruchinsu | マルチンス (como se fala no Brasil) ou マルティンス? |  |
| Carvalho | カルバリョ | karubaryo | カルバリョ ou カルヴァーリョ? |  |
| Lucas | ルカス | rukasu | ルカス ou ルーカス? |  |
| Denise | デニセ | denise | デニセ ou デニーズ (o "s" entre vogais soa "z")? |  |
| Souza | ソウザ | souza | ソウザ ou ソーザ? |  |
| Ono | オノ | ono | Depende do kanji: 小野 é オノ, 大野 é オオノ. Perguntar à família. |  |
| Higa | ヒガ | higa | Sobrenome okinawano frequente no Brasil: confirmar ヒガ. |  |
| Chinen | チネン | chinen | Sobrenome okinawano: confirmar チネン. |  |
| Kinjo | キンジョウ | kinjou | Sobrenome okinawano (金城): confirmar キンジョウ. |  |
| Oshiro | オオシロ | ooshiro | Sobrenome okinawano (大城): confirmar オオシロ. |  |
| Miyagi | ミヤギ | miyagi | Sobrenome okinawano: confirmar ミヤギ. |  |
| Shinichi | シニチ | shinichi | Sem apóstrofo vira シニチ; digitando Shin'ichi sai シンイチ. Confirmar a leitura e se vale orientar os vendedores. |  |

## Nomes e sobrenomes brasileiros

| Nome | Origem detectada | Sugestão | Leitura de volta | OK? | Correção |
|---|---|---|---|---|---|
| Maria | portuguesa | マリア | maria |  |  |
| Ana | portuguesa | アナ | ana |  |  |
| José | portuguesa | ジョゼ | joze |  |  |
| João | portuguesa | ジョアン | joan |  |  |
| Antônio | portuguesa | アントニオ | antonio |  |  |
| Francisco | portuguesa | フランシスコ | furanshisuko |  |  |
| Carlos | portuguesa | カルロス | karurosu |  |  |
| Paulo | portuguesa | パウロ | pauro |  |  |
| Pedro | portuguesa | ペドロ | pedoro |  |  |
| Lucas | portuguesa | ルカス | rukasu |  |  |
| Luiz | portuguesa | ルイス | ruisu |  |  |
| Marcos | portuguesa | マルコス | marukosu |  |  |
| Luís | portuguesa | ルイス | ruisu |  |  |
| Gabriel | portuguesa | ガブリエル | gaburieru |  |  |
| Rafael | portuguesa | ラファエル | rafuaeru |  |  |
| Daniel | portuguesa | ダニエル | danieru |  |  |
| Marcelo | portuguesa | マルセロ | marusero |  |  |
| Bruno | portuguesa | ブルノ | buruno |  |  |
| Eduardo | portuguesa | エドゥアルド | edouarudo |  |  |
| Felipe | portuguesa | フェリペ | fyeripe |  |  |
| Rodrigo | portuguesa | ロドリゴ | rodorigo |  |  |
| Manoel | portuguesa | マノエル | manoeru |  |  |
| Armando | portuguesa | アルマンド | arumando |  |  |
| Gerônimo | portuguesa | ジェロニモ | jeronimo |  |  |
| Regina | portuguesa | レジナ | rejina |  |  |
| Rogério | portuguesa | ロジェリオ | rojerio |  |  |
| Fernanda | portuguesa | フェルナンダ | fyerunanda |  |  |
| Juliana | portuguesa | ジュリアナ | juriana |  |  |
| Patrícia | portuguesa | パトリシア | patorishia |  |  |
| Aline | portuguesa | アリネ | arine |  |  |
| Camila | portuguesa | カミラ | kamira |  |  |
| Sandra | portuguesa | サンドラ | sandora |  |  |
| Vitor | portuguesa | ビトル | bitoru |  |  |
| Vera | portuguesa | ベラ | bera |  |  |
| Cecília | portuguesa | セシリア | seshiria |  |  |
| Helena | portuguesa | ヘレナ | herena |  |  |
| Sérgio | portuguesa | セルジオ | serujio |  |  |
| Jorge | portuguesa | ジョルジェ | joruje |  |  |
| Guilherme | portuguesa | ギリェルメ | giryerume |  |  |
| Thiago | portuguesa | チアゴ | chiago |  |  |
| Diego | portuguesa | ジエゴ | jiego |  |  |
| Silva | portuguesa | シルバ | shiruba |  |  |
| Santos | portuguesa | サントス | santosu |  |  |
| Oliveira | portuguesa | オリベイラ | oribeira |  |  |
| Souza | portuguesa | ソウザ | souza |  |  |
| Rodrigues | portuguesa | ロドリゲス | rodorigesu |  |  |
| Ferreira | portuguesa | フェレイラ | fyereira |  |  |
| Alves | portuguesa | アルベス | arubesu |  |  |
| Pereira | portuguesa | ペレイラ | pereira |  |  |
| Lima | portuguesa | リマ | rima |  |  |
| Gomes | portuguesa | ゴメス | gomesu |  |  |
| Costa | portuguesa | コスタ | kosuta |  |  |
| Ribeiro | portuguesa | リベイロ | ribeiro |  |  |
| Martins | portuguesa | マルチンス | maruchinsu |  |  |
| Carvalho | portuguesa | カルバリョ | karubaryo |  |  |
| Almeida | portuguesa | アルメイダ | arumeida |  |  |
| Lopes | portuguesa | ロペス | ropesu |  |  |
| Gonçalves | portuguesa | ゴンサルベス | gonsarubesu |  |  |
| Rocha | portuguesa | ロシャ | rosha |  |  |
| Machado | portuguesa | マシャド | mashado |  |  |
| Nogueira | portuguesa | ノゲイラ | nogeira |  |  |

## Nomes e sobrenomes de origem japonesa

| Nome | Origem detectada | Sugestão | Leitura de volta | OK? | Correção |
|---|---|---|---|---|---|
| Sato | japonesa | サトウ | satou |  |  |
| Suzuki | japonesa | スズキ | suzuki |  |  |
| Takahashi | japonesa | タカハシ | takahashi |  |  |
| Tanaka | japonesa | タナカ | tanaka |  |  |
| Watanabe | japonesa | ワタナベ | watanabe |  |  |
| Ito | japonesa | イトウ | itou |  |  |
| Yamamoto | japonesa | ヤマモト | yamamoto |  |  |
| Nakamura | japonesa | ナカムラ | nakamura |  |  |
| Kobayashi | japonesa | コバヤシ | kobayashi |  |  |
| Kato | japonesa | カトウ | katou |  |  |
| Yoshida | japonesa | ヨシダ | yoshida |  |  |
| Yamada | japonesa | ヤマダ | yamada |  |  |
| Sasaki | japonesa | ササキ | sasaki |  |  |
| Yamaguchi | japonesa | ヤマグチ | yamaguchi |  |  |
| Matsumoto | japonesa | マツモト | matsumoto |  |  |
| Inoue | japonesa | イノウエ | inoue |  |  |
| Kimura | japonesa | キムラ | kimura |  |  |
| Hayashi | japonesa | ハヤシ | hayashi |  |  |
| Shimizu | japonesa | シミズ | shimizu |  |  |
| Yamazaki | japonesa | ヤマザキ | yamazaki |  |  |
| Mori | japonesa | モリ | mori |  |  |
| Abe | japonesa | アベ | abe |  |  |
| Ikeda | japonesa | イケダ | ikeda |  |  |
| Hashimoto | japonesa | ハシモト | hashimoto |  |  |
| Ishikawa | japonesa | イシカワ | ishikawa |  |  |
| Ogawa | japonesa | オガワ | ogawa |  |  |
| Okada | japonesa | オカダ | okada |  |  |
| Hasegawa | japonesa | ハセガワ | hasegawa |  |  |
| Fujita | japonesa | フジタ | fujita |  |  |
| Goto | japonesa | ゴトウ | gotou |  |  |
| Kondo | japonesa | コンドウ | kondou |  |  |
| Murakami | japonesa | ムラカミ | murakami |  |  |
| Endo | japonesa | エンドウ | endou |  |  |
| Aoki | japonesa | アオキ | aoki |  |  |
| Sakamoto | japonesa | サカモト | sakamoto |  |  |
| Saito | japonesa | サイトウ | saitou |  |  |
| Fukuda | japonesa | フクダ | fukuda |  |  |
| Ota | japonesa | オオタ | oota |  |  |
| Nishimura | japonesa | ニシムラ | nishimura |  |  |
| Fujii | japonesa | フジイ | fujii |  |  |
| Okamoto | japonesa | オカモト | okamoto |  |  |
| Matsuda | japonesa | マツダ | matsuda |  |  |
| Nakagawa | japonesa | ナカガワ | nakagawa |  |  |
| Harada | japonesa | ハラダ | harada |  |  |
| Oshiro | japonesa | オオシロ | ooshiro |  |  |
| Higa | japonesa | ヒガ | higa |  |  |
| Miyagi | japonesa | ミヤギ | miyagi |  |  |
| Chinen | japonesa | チネン | chinen |  |  |
| Kinjo | japonesa | キンジョウ | kinjou |  |  |
| Tsuchiya | japonesa | ツチヤ | tsuchiya |  |  |
| Chiba | japonesa | チバ | chiba |  |  |
| Uchida | japonesa | ウチダ | uchida |  |  |
| Iwamoto | japonesa | イワモト | iwamoto |  |  |
| Ohno | japonesa | オオノ | oono |  |  |
| Hattori | japonesa | ハットリ | hattori |  |  |
| Shigeru | japonesa | シゲル | shigeru |  |  |
| Hiroshi | japonesa | ヒロシ | hiroshi |  |  |
| Takeshi | japonesa | タケシ | takeshi |  |  |
| Kenji | japonesa | ケンジ | kenji |  |  |
| Michiko | japonesa | ミチコ | michiko |  |  |
| Yoko | japonesa | ヨウコ | youko |  |  |
| Keiko | japonesa | ケイコ | keiko |  |  |
| Akemi | japonesa | アケミ | akemi |  |  |
| Tsuyoshi | japonesa | ツヨシ | tsuyoshi |  |  |
| Taro | japonesa | タロウ | tarou |  |  |
| Ryu | japonesa | リュウ | ryuu |  |  |

## Convenções já adotadas

- **V → B:** Silva → シルバ, Gonçalves → ゴンサルベス (forma mais usada no Brasil).
- **RR → R:** Ferreira → フェレイラ.
- **DU/TU → ドゥ/トゥ** e **DI → ジ:** Eduardo → エドゥアルド, Diego → ジエゴ.
- **Vogal longa em sobrenomes japoneses frequentes:** Sato → サトウ, Ito → イトウ,
  Oshiro → オオシロ. Nomes ambíguos (Ono) ficam como digitados.
- **Origem japonesa:** a confirmação da sugestão alerta o vendedor para
  perguntar se a família usa kanji.
