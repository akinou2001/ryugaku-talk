#!/usr/bin/env node

/**
 * CSVファイルに日本語名（name_ja）を追加するスクリプト
 * 英語名（name_en）を日本語に翻訳してname_jaカラムに追加
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// 地名のマッピング
const prefectureMap: Record<string, string> = {
  'Aichi': '愛知',
  'Akita': '秋田',
  'Aomori': '青森',
  'Chiba': '千葉',
  'Ehime': '愛媛',
  'Fukui': '福井',
  'Fukuoka': '福岡',
  'Fukushima': '福島',
  'Gifu': '岐阜',
  'Gunma': '群馬',
  'Hiroshima': '広島',
  'Hokkaido': '北海道',
  'Hyogo': '兵庫',
  'Ibaraki': '茨城',
  'Ishikawa': '石川',
  'Iwate': '岩手',
  'Kagoshima': '鹿児島',
  'Kanagawa': '神奈川',
  'Kochi': '高知',
  'Kumamoto': '熊本',
  'Kyoto': '京都',
  'Mie': '三重',
  'Miyagi': '宮城',
  'Miyazaki': '宮崎',
  'Nagano': '長野',
  'Nagasaki': '長崎',
  'Nara': '奈良',
  'Niigata': '新潟',
  'Oita': '大分',
  'Okayama': '岡山',
  'Okinawa': '沖縄',
  'Osaka': '大阪',
  'Saga': '佐賀',
  'Saitama': '埼玉',
  'Shiga': '滋賀',
  'Shimane': '島根',
  'Shizuoka': '静岡',
  'Tochigi': '栃木',
  'Tokushima': '徳島',
  'Tokyo': '東京',
  'Tottori': '鳥取',
  'Toyama': '富山',
  'Wakayama': '和歌山',
  'Yamagata': '山形',
  'Yamaguchi': '山口',
  'Yamanashi': '山梨',
}

// 大学の種類のマッピング
const universityTypeMap: Record<string, string> = {
  'University': '大学',
  'College': '大学',
  'Institute': '大学',
  'School': '大学',
  'Academy': '大学',
  'Gakuin': '学院',
  'Gakuen': '学園',
  'Gakko': '学校',
}

// 専門分野のマッピング
const fieldMap: Record<string, string> = {
  'Medical': '医科',
  'Dental': '歯科',
  'Pharmaceutical': '薬科',
  'Nursing': '看護',
  'Health': '保健',
  'Welfare': '福祉',
  'Economics': '経済',
  'Commerce': '商科',
  'Business': '商学',
  'Law': '法',
  'Education': '教育',
  'Engineering': '工科',
  'Technology': '工業',
  'Science': '理学',
  'Arts': '芸術',
  'Fine Arts': '美術',
  'Music': '音楽',
  'Foreign Studies': '外国語',
  'International': '国際',
  'Agriculture': '農学',
  'Veterinary': '獣医',
  'Fisheries': '水産',
  'Marine': '海洋',
  'Mercantile Marine': '商船',
}

// 特別な大学名のマッピング（正確な日本語名）
const specialNames: Record<string, string> = {
  'Aichi Bunkyo University': '愛知文教大学',
  'Aichi Gakuin University': '愛知学院大学',
  'Aichi Gakusen University': '愛知学泉大学',
  'Aichi Institute of Technology': '愛知工業大学',
  'Aichi Medical University': '愛知医科大学',
  'Aichi Prefectural University': '愛知県立大学',
  'Aichi Prefectural University of Fine Arts & Music': '愛知県立芸術大学',
  'Aichi Sangyo University': '愛知産業大学',
  'Aichi Shukutoku University': '愛知淑徳大学',
  'Aichi University': '愛知大学',
  'Aichi University of Education': '愛知教育大学',
  'Aikoku Gakuen University': '愛国学園大学',
  'Akita University': '秋田大学',
  'Akita University of Economics and Law': '秋田経済法科大学',
  'American University Extension, Okinawa': 'アメリカン大学沖縄校',
  'Aomori Chuoh Gakuin University': '青森中央学院大学',
  'Aomori Public College': '青森公立大学',
  'Aomori University': '青森大学',
  'Aomori University of Health and Welfare': '青森県立保健大学',
  'Aoyama Gakuin University': '青山学院大学',
  'Asahi University': '朝日大学',
  'Asahikawa Medical College': '旭川医科大学',
  'Asahikawa University': '旭川大学',
  'Ashikaga Institute of Technology': '足利工業大学',
  'Ashiya University': '芦屋大学',
  'Asia University': '亜細亜大学',
  'Atomi College': '跡見学園女子大学',
  'Azabu University': '麻布大学',
  'Baika Women\'s College': '梅花女子大学',
  'Baiko Women\'s College': '梅光学院大学',
  'Beppu University': '別府大学',
  'Bukkyo University': '佛教大学',
  'Bunka Women\'s University': '文化女子大学',
  'Bunkyo Gakuin University': '文京学院大学',
  'Bunkyo University': '文教大学',
  'Chiba Institute of Technology': '千葉工業大学',
  'Chiba Keizai University': '千葉経済大学',
  'Chiba University': '千葉大学',
  'Chiba University of Commerce': '千葉商科大学',
  'Chikushi Jogakuen University': '筑紫女学園大学',
  'Chubu Gakuin University & Chubu Women\'s College': '中部学院大学',
  'Chubu University': '中部大学',
  'Chukyo Gakuin University': '中京学院大学',
  'Chukyo University': '中京大学',
  'Chukyo Women\'s University': '中京女子大学',
  'Chuo Gakuin University': '中央学院大学',
  'Chuo University': '中央大学',
  'Dai Ichi University, College of Technology': '第一工業大学',
  'Daido Institute of Technology': '大同工業大学',
  'Daiichi College of Pharmaceutical Sciences': '第一薬科大学',
  'Daiichi University of Economics': '第一経済大学',
  'Daito Bunka University': '大東文化大学',
  'Doho University': '同朋大学',
  'Dohto University': '道都大学',
  'Dokkyo University': '獨協大学',
  'Dokkyo University School of Medicine': '獨協医科大学',
  'Doshisha University': '同志社大学',
  'Doshisha Women\'s College of Liberal Arts': '同志社女子大学',
  'Edogawa University': '江戸川大学',
  'Ehime University': '愛媛大学',
  'Eichi University': '英知大学',
  'Elisabeth University of Music': 'エリザベト音楽大学',
  'Ferris University': 'フェリス女学院大学',
  'Fuji University': '富士大学',
  'Fuji Women\'s College': '藤女子大学',
  'Fujita Health University': '藤田医科大学',
  'Fukui Medical School': '福井医科大学',
  'Fukui Prefectural University': '福井県立大学',
  'Fukui University': '福井大学',
  'Fukui University of Technology': '福井工業大学',
  'Fukuoka Dental College': '福岡歯科大学',
  'Fukuoka Institute of Technology': '福岡工業大学',
  'Fukuoka International University': '福岡国際大学',
  'Fukuoka Prefectural University': '福岡県立大学',
  'Fukuoka University': '福岡大学',
  'Fukuoka University of Education': '福岡教育大学',
  'Fukuoka Women\'s University': '福岡女子大学',
  'Fukushima Medical College': '福島医科大学',
  'Fukushima University': '福島大学',
  'Fukuyama Heisei University': '福山平成大学',
  'Fukuyama University': '福山大学',
  'Gakushuin University': '学習院大学',
  'Gifu Keizai University': '岐阜経済大学',
  'Gifu Pharmaceutical University': '岐阜薬科大学',
  'Gifu Shotoku Gakuen University': '岐阜聖徳学園大学',
  'Gifu University': '岐阜大学',
  'Gifu University for Education and Languages': '岐阜教育大学',
  'Gifu Women\'s University': '岐阜女子大学',
  'Graduate University for Advanced Studies': '総合研究大学院大学',
  'Gunma Prefectural Women\'s University': '群馬県立女子大学',
  'Gunma University': '群馬大学',
  'Hachinohe Institute of Technology': '八戸工業大学',
  'Hachinohe University': '八戸大学',
  'Hakodate University': '函館大学',
  'Hakuoh University': '白鴎大学',
  'Hamamatsu University': '浜松大学',
  'Hamamatsu University School of Medicine': '浜松医科大学',
  'Hanazono University': '花園大学',
  'Hannan University': '阪南大学',
  'Heisei International University': '平成国際大学',
  'Higashi Nippon International University': '東日本国際大学',
  'Hijiyama University': '比治山大学',
  'Himeji Dokkyo University': '姫路獨協大学',
  'Himeji Institute of Technology': '姫路工業大学',
  'Hirosaki Gakuin University': '弘前学院大学',
  'Hirosaki University': '弘前大学',
  'Hiroshima Bunkyo Women\'s University': '広島文教女子大学',
  'Hiroshima City University': '広島市立大学',
  'Hiroshima Institute of Technology': '広島工業大学',
  'Hiroshima International University': '広島国際大学',
  'Hiroshima Jogakuin University': '広島女学院大学',
  'Hiroshima Kokusai Gakuin University': '広島国際学院大学',
  'Hiroshima Prefectural University': '広島県立大学',
  'Hiroshima Shudo University': '広島修道大学',
  'Hiroshima University': '広島大学',
  'Hiroshima University of Economics': '広島経済大学',
  'Hiroshima Women\'s University': '広島女子大学',
  'Hitotsubashi University': '一橋大学',
  'Hokkaido Information University': '北海道情報大学',
  'Hokkaido Institute of Pharmaceutical Sciences': '北海道薬科大学',
  'Hokkaido Institute of Technology': '北海道工業大学',
  'Hokkaido Tokai University': '北海道東海大学',
  'Hokkaido University': '北海道大学',
  'Hokkaido University of Education': '北海道教育大学',
  'Hokkaido University of Health Sciences': '北海道医療大学',
  'Hokkaigakuen University': '北海学園大学',
  'Hokkaigakuen University of Kitami': '北海学園北見大学',
  'Hokuriku University': '北陸大学',
  'Hokusei Gakuen University': '北星学園大学',
  'Hosei University': '法政大学',
  'Hoshi University': '星薬科大学',
  'Hyogo College of Medicine': '兵庫医科大学',
  'Hyogo University': '兵庫大学',
  'Hyogo University of Education': '兵庫教育大学',
  'Ibaraki Christian College': '茨城キリスト教大学',
  'Ibaraki Prefectural University of Health Sciences': '茨城県立医療大学',
  'Ibaraki University': '茨城大学',
  'International Buddhist University': '四天王寺大学',
  'International Budo University': '国際武道大学',
  'International Christian University': '国際基督教大学',
  'International University of Health and Welfare': '国際医療福祉大学',
  'International University of Japan': '国際大学',
  'International University of Kagoshima': '鹿児島国際大学',
  'Ishinomaki Senshu University': '石巻専修大学',
  'Iwaki Meisei University': 'いわき明星大学',
  'Iwate Medical University': '岩手医科大学',
  'Iwate Prefectural University': '岩手県立大学',
  'Iwate University': '岩手大学',
  'Japan Advanced Institute of Science and Technology': '北陸先端科学技術大学院大学',
  'Japan College of Social Work': '日本社会事業大学',
  'Japan Women\'s University': '日本女子大学',
  'Japanese Red Cross College of Nursing': '日本赤十字看護大学',
  'Jichi Medical School': '自治医科大学',
  'Jikei University School of Medicine': '東京慈恵会医科大学',
  'Jissen Women\'s University': '実践女子大学',
  'Jobu University': '上武大学',
  'Joetsu University of Education': '上越教育大学',
  'Josai International University': '城西国際大学',
  'Josai University': '城西大学',
  'Juntendo University': '順天堂大学',
  'Kagawa Institute of Nutrition': '香川栄養大学',
  'Kagawa Medical School': '香川医科大学',
  'Kagawa University': '香川大学',
  'Kagoshima Immaculate Heart University': '鹿児島純心女子大学',
  'Kagoshima University': '鹿児島大学',
  'Kagoshima Women\'s College': '鹿児島女子大学',
  'Kamakura Women\'s College': '鎌倉女子大学',
  'Kanagawa Dental College': '神奈川歯科大学',
  'Kanagawa Institute of Technology': '神奈川工業大学',
  'Kanagawa University': '神奈川大学',
  'Kanazawa College of Art': '金沢美術工芸大学',
  'Kanazawa College of Economics': '金沢経済大学',
  'Kanazawa Gakuin University': '金沢学院大学',
  'Kanazawa Institute of Technology': '金沢工業大学',
  'Kanazawa Medical University': '金沢医科大学',
  'Kanazawa University': '金沢大学',
  'Kanda University of International Studies': '神田外語大学',
  'Kansai Gaidai University': '関西外国語大学',
  'Kansai Medical University': '関西医科大学',
  'Kansai University': '関西大学',
  'Kansai University of International Studies': '関西国際大学',
  'Kansai University of Social Welfare': '関西福祉大学',
  'Kanto Gakuen University': '関東学園大学',
  'Kanto Gakuin University': '関東学院大学',
  'Kawamura Gakuen Woman\'s University': '川村学園女子大学',
  'Kawasaki Medical School': '川崎医科大学',
  'Keiai University': '敬愛大学',
  'Keio University': '慶應義塾大学',
  'Keisen Jogaku-en College': '恵泉女学園大学',
  'Keiwa College': '敬和学園大学',
  'Kibi International University': '吉備国際大学',
  'Kinjo Gakuin University': '金城学院大学',
  'Kinki University': '近畿大学',
  'Kitakyushu University': '北九州大学',
  'Kitami Institute of Technology': '北見工業大学',
  'Kitasato University': '北里大学',
  'Kobe City University of ForeignStudies': '神戸市外国語大学',
  'Kobe Design University': '神戸芸術工科大学',
  'Kobe Gakuin University': '神戸学院大学',
  'Kobe International University': '神戸国際大学',
  'Kobe Jogakuin University': '神戸女学院大学',
  'Kobe Pharmaceutical University': '神戸薬科大学',
  'Kobe Shinwa Women\'s University': '神戸親和女子大学',
  'Kobe Shoin Women\'s University': '神戸松蔭女子学院大学',
  'Kobe University': '神戸大学',
  'Kobe University of Mercantile Marine': '神戸商船大学',
  'Kobe Women\'s University': '神戸女子大学',
  'Kochi Medical School': '高知医科大学',
  'Kochi University': '高知大学',
  'Kochi University of Technology': '高知工科大学',
  'Kochi Women\'s University': '高知女子大学',
  'Kogakkan University': '皇學館大学',
  'Kogakuin University': '工学院大学',
  'Koka Women\'s College': '光華女子大学',
  'Kokugakuin University': '國學院大學',
  'Kokushikan University': '国士舘大学',
  'Komazawa University': '駒澤大学',
  'Konan University': '甲南大学',
  'Konan Women\'s University': '甲南女子大学',
  'Korea University': '高麗大学',
  'Koriyama Women\'s University and College': '郡山女子大学',
  'Koshien University': '甲子園大学',
  'Koyasan University': '高野山大学',
  'Kumamoto Gakuen University': '熊本学園大学',
  'Kumamoto Institute of Technology': '熊本工業大学',
  'Kumamoto Prefectural University': '熊本県立大学',
  'Kumamoto University': '熊本大学',
  'Kunitachi College of Music': '国立音楽大学',
  'Kurashiki Sakuyo University': '倉敷作陽大学',
  'Kurashiki University of Science and the Arts': '倉敷芸術科学大学',
  'Kure University': '呉大学',
  'Kurume Institute of Technology': '久留米工業大学',
  'Kurume University': '久留米大学',
  'Kushiro Public University of Economics': '釧路公立大学',
  'Kwansei Gakuin University': '関西学院大学',
  'Kwassui Women\'s College': '活水女子大学',
  'Kyorin University': '杏林大学',
  'Kyoritsu Pharmaceutical University': '共立薬科大学',
  'Kyoritsu Woman\'s University': '共立女子大学',
  'Kyoto Bunkyo University': '京都文教大学',
  'Kyoto City University of Arts': '京都市立芸術大学',
  'Kyoto Gakuen University': '京都学園大学',
  'Kyoto Institute of Technology': '京都工芸繊維大学',
  'Kyoto Notre Dame University': 'ノートルダム女子大学',
  'Kyoto Pharmaceutical University': '京都薬科大学',
  'Kyoto Prefectural University': '京都府立大学',
  'Kyoto Prefectural University of Medicine': '京都府立医科大学',
  'Kyoto Sangyo University': '京都産業大学',
  'Kyoto Seika University': '京都精華大学',
  'Kyoto Tachibana Women\'s University': '京都橘女子大学',
  'Kyoto University': '京都大学',
  'Kyoto University of Art and Design': '京都造形芸術大学',
  'Kyoto University of Education': '京都教育大学',
  'Kyoto University of Foreign Studies': '京都外国語大学',
  'Kyoto Women\'s University': '京都女子大学',
  'Kyushu Dental College': '九州歯科大学',
  'Kyushu Institute of Design': '九州芸術工科大学',
  'Kyushu Institute of Technology': '九州工業大学',
  'Kyushu International University': '九州国際大学',
  'Kyushu Kyoritsu University': '九州共立大学',
  'Kyushu Sangyo University': '九州産業大学',
  'Kyushu Tokai University': '九州東海大学',
  'Kyushu University': '九州大学',
  'Kyushu University of Nursing and SocialWelfare': '九州看護福祉大学',
  'Kyushu Women\'s University': '九州女子大学',
  'Matsumoto Dental University': '松本歯科大学',
  'Matsusaka University': '松阪大学',
  'Matsuyama University': '松山大学',
  'Meiji College of Pharmacy': '明治薬科大学',
  'Meiji Gakuin University': '明治学院大学',
  'Meiji University': '明治大学',
  'Meiji University of Oriental Medicine': '明治鍼灸大学',
  'Meijo University': '名城大学',
  'Meikai University': '明海大学',
  'Meio University': '名桜大学',
  'Meisei University': '明星大学',
  'Mejiro University': '目白大学',
  'Mie University': '三重大学',
  'Mimasaka Women\'s College': '美作女子大学',
  'Minamikyushu University': '南九州大学',
  'Miyagi Gakuin Women\'s College': '宮城学院女子大学',
  'Miyagi University': '宮城大学',
  'Miyagi University of Education': '宮城教育大学',
  'Miyazaki Medical College': '宮崎医科大学',
  'Miyazaki Municipal University': '宮崎公立大学',
  'Miyazaki Prefectural Nursing University': '宮崎県立看護大学',
  'Miyazaki University': '宮崎大学',
  'Morioka College': '盛岡大学',
  'Mukogawa Women\'s University': '武庫川女子大学',
  'Muroran Institute of Technology': '室蘭工業大学',
  'Musashi Institute of Technology': '武蔵工業大学',
  'Musashi University': '武蔵大学',
  'Musashino Academy of Music': '武蔵野音楽大学',
  'Musashino Art University': '武蔵野美術大学',
  'Musashino Women\'s University': '武蔵野女子大学',
  'Nagano University': '長野大学',
  'Nagaoka University of Technology': '長岡技術科学大学',
  'Nagasaki Institute of Applied Science': '長崎総合科学大学',
  'Nagasaki Prefectural University': '長崎県立大学',
  'Nagasaki University': '長崎大学',
  'Nagoya City University': '名古屋市立大学',
  'Nagoya Economics University': '名古屋経済大学',
  'Nagoya Gakuin University': '名古屋学院大学',
  'Nagoya Institute of Technology': '名古屋工業大学',
  'Nagoya University': '名古屋大学',
  'Nagoya University of Arts': '名古屋芸術大学',
  'Nagoya University of Commerce and Business Administration': '名古屋商科大学',
  'Nagoya University of Foreign Studies': '名古屋外国語大学',
  'Nagoya Women\'s University': '名古屋女子大学',
  'Nakamura Gakuen University': '中村学園大学',
  'Nanzan University': '南山大学',
  'Nara Institute of Science and Technology': '奈良先端科学技術大学院大学',
  'Nara Medical University': '奈良医科大学',
  'Nara Sangyo University': '奈良産業大学',
  'Nara University': '奈良大学',
  'Nara University of Commerce': '奈良大学',
  'Nara University of Education': '奈良教育大学',
  'Nara Women\'s University': '奈良女子大学',
  'Naruto University of Education': '鳴門教育大学',
  'National Defence Medical College': '防衛医科大学校',
  'National Fisheries University': '水産大学校',
  'National Institute of Fitness and Sports Kanoya': '鹿屋体育大学',
  'National Institute of Technology, Asahikawa College': '旭川工業高等専門学校',
  'Nihon Fukushi University': '日本福祉大学',
  'Nihon University': '日本大学',
  'Niigata College of Pharmacy': '新潟薬科大学',
  'Niigata Sangyo University': '新潟産業大学',
  'Niigata University': '新潟大学',
  'Niigata University of International and Information Studies': '新潟国際情報大学',
  'Niigata University of Management': '新潟経営大学',
  'Nippon Bunri University': '日本文理大学',
  'Nippon Dental University': '日本歯科大学',
  'Nippon Institute of Technology': '日本工業大学',
  'Nippon Medical School': '日本医科大学',
  'Nippon Sport Science University': '日本体育大学',
  'Nippon Veterinary and Animalscience University': '日本獣医生命科学大学',
  'Nishikyushu University': '西九州大学',
  'Nishinippon Institute of Technology': '西日本工業大学',
  'Nisho Gakusha University': '二松学舎大学',
  'Nortre Dame Seishin University': 'ノートルダム清心女子大学',
  'Obihiro University of Agriculture and Veterinary Medicine': '帯広畜産大学',
  'Obirin University': '桜美林大学',
  'Ochanomizu Women\'s University': 'お茶の水女子大学',
  'Ohka Gakuen University': '桜花学園大学',
  'Ohtani Women\'s University': '大谷女子大学',
  'Ohu University': '奥羽大学',
  'Oita Medical University': '大分医科大学',
  'Oita University': '大分大学',
  'Oita University of Nursing and Health Sciences': '大分県立看護科学大学',
  'Okayama Prefectural University': '岡山県立大学',
  'Okayama Shoka University': '岡山商科大学',
  'Okayama University': '岡山大学',
  'Okayama University of Science': '岡山理科大学',
  'Okinawa Institute of Science and Technology': '沖縄科学技術大学院大学',
  'Okinawa International University': '沖縄国際大学',
  'Okinawa Prefectural University of Fine Arts': '沖縄県立芸術大学',
  'Okinawa University': '沖縄大学',
  'Osaka City University': '大阪市立大学',
  'Osaka College of Music': '大阪音楽大学',
  'Osaka Dental University': '大阪歯科大学',
  'Osaka Electro-Communication University': '大阪電気通信大学',
  'Osaka Gakuin University': '大阪学院大学',
  'Osaka Institute of Technology': '大阪工業大学',
  'Osaka International University': '大阪国際大学',
  'Osaka International University for Women': '大阪国際女子大学',
  'Osaka Jogakuin University': '大阪女学院大学',
  'Osaka Medical College': '大阪医科大学',
  'Osaka Prefectural University': '大阪府立大学',
  'Osaka Sangyo University': '大阪産業大学',
  'Osaka Shoin Women\'s College': '大阪樟蔭女子大学',
  'Osaka University': '大阪大学',
  'Osaka University of Arts': '大阪芸術大学',
  'Osaka University of Commerce': '大阪商業大学',
  'Osaka University of Economics': '大阪経済大学',
  'Osaka University of Economics & Law': '大阪経済法科大学',
  'Osaka University of Education': '大阪教育大学',
  'Osaka University of Foreign Studies': '大阪外国語大学',
  'Osaka University of Health and Sport Sciences': '大阪体育大学',
  'Osaka University of Pharmaceutical Sciences': '大阪薬科大学',
  'Osaka Women\'s University': '大阪女子大学',
  'Otani University': '大谷大学',
  'Otaru University of Commerce': '小樽商科大学',
  'Otemae University': '大手前大学',
  'Otemon Gakuin University': '追手門学院大学',
  'Otsuma Women\'s University': '大妻女子大学',
  'Polytechnic University': 'ポリテクニック大学',
  'Poole Gakuin University': 'プール学院大学',
  'Rakuno Gakuen University': '酪農学園大学',
  'Reitaku University': '麗澤大学',
  'Rikkyo University (St. Paul\'s University)': '立教大学',
  'Rissho University': '立正大学',
  'Ritsumeikan Asia Pacific University': '立命館アジア太平洋大学',
  'Ritsumeikan University': '立命館大学',
  'Ryukoku University': '龍谷大学',
  'Ryutsu Keizai University': '流通経済大学',
  'Saga Medical School': '佐賀医科大学',
  'Saga University': '佐賀大学',
  'Sagami Women\'s University': '相模女子大学',
  'Saitama Institute of Technology': '埼玉工業大学',
  'Saitama Medical School': '埼玉医科大学',
  'Saitama Prefectural University': '埼玉県立大学',
  'Saitama University': '埼玉大学',
  'Sakushin Gakuin University': '作新学院大学',
  'Sankei University': '産経大学',
  'Sanno University': '産能大学',
  'Sanyo Gakuen University': '山陽学園大学',
  'Sapporo Gakuin University': '札幌学院大学',
  'Sapporo International University': '札幌国際大学',
  'Sapporo Medical University': '札幌医科大学',
  'Sapporo University': '札幌大学',
  'Science University of Tokyo': '東京理科大学',
  'Science University of Tokyo in Yamaguchi': '山口東京理科大学',
  'Seian University of Art & Design': '成安造形大学',
  'Seigakuin University': '聖学院大学',
  'Seijo University': '成城大学',
  'Seikei University': '成蹊大学',
  'Seinan Gakuin University': '西南学院大学',
  'Seisen University': '清泉女子大学',
  'Seiwa College': '聖和大学',
  'Sendai University': '仙台大学',
  'Senshu University': '専修大学',
  'Senzoku Gakuen College': '洗足学園音楽大学',
  'Setsunan University': '摂南大学',
  'Shibaura Institute of Technology': '芝浦工業大学',
  'Shiga Prefecture Agricultural Technology Promotion Center': '滋賀県農業技術振興センター',
  'Shiga University': '滋賀大学',
  'Shiga University of Medical Science': '滋賀医科大学',
  'Shikoku Christian College': '四国学院大学',
  'Shikoku University': '四国大学',
  'Shimane University': '島根大学',
  'Shimane University, Faculty of Medicine': '島根医科大学',
  'Shimonoseki City University': '下関市立大学',
  'Shinshu University': '信州大学',
  'Shirayuri Women\'s College': '白百合女子大学',
  'Shizuoka Prefectural University': '静岡県立大学',
  'Shizuoka Sangyo University': '静岡産業大学',
  'Shizuoka University': '静岡大学',
  'Shokei College': '尚絅大学',
  'Shonan Institute of Technology': '湘南工科大学',
  'Showa College of Pharmaceutical Sciences': '昭和薬科大学',
  'Showa University': '昭和大学',
  'Showa Women\'s University': '昭和女子大学',
  'Shuchiin College': '種智院大学',
  'Shujitsu Women\'s University': '就実女子大学',
  'Shukutoku University': '淑徳大学',
  'Shumei University': '秀明大学',
  'Siebold University of Nagasaki': '長崎シーボルト大学',
  'Soai University': '相愛大学',
  'Soka University': '創価大学',
  'Sonoda Women\'s University': '園田女子大学',
  'Sophia University': '上智大学',
  'St. Andrew\'s University': '聖アンデレ大学',
  'St. Luke\' s College of Nursing': '聖路加看護大学',
  'St. Marianna University School of Medicine': '聖マリアンナ医科大学',
  'Sugino Women\'s College': '杉野女子大学',
  'Sugiyama Jogakuen University': '椙山女学園大学',
  'Surugadai University': '駿河台大学',
  'Suzuka International University': '鈴鹿国際大学',
  'Suzuka University of Medical Science': '鈴鹿医療科学大学',
  'Taisho University': '大正大学',
  'Takachiho University': '高千穂大学',
  'Takamatsu University': '高松大学',
  'Takarazuka University of Art and Design': '宝塚造形芸術大学',
  'Takasaki City University of Economics': '高崎経済大学',
  'Takushoku University': '拓殖大学',
  'Tama Art University': '多摩美術大学',
  'Tama Institute of Management and Information Sciences': '多摩大学',
  'Tamagawa University': '玉川大学',
  'Teikyo Heisei University': '帝京平成大学',
  'Teikyo University of Science and Technology': '帝京科学大学',
  'Temple University Japan': 'テンプル大学ジャパン',
  'Tenri University': '天理大学',
  'Tezukayama Gakuin University': '帝塚山学院大学',
  'Tezukayama University': '帝塚山大学',
  'Toho College of Music': '東邦音楽大学',
  'Toho Gakuen School of Music': '東邦音楽大学',
  'Toho University': '東邦大学',
  'Tohoku Bunka Gakuen University': '東北文化学園大学',
  'Tohoku College of Pharmacy': '東北薬科大学',
  'Tohoku Fukushi University': '東北福祉大学',
  'Tohoku Gakuin University': '東北学院大学',
  'Tohoku Institute of Technology': '東北工業大学',
  'Tohoku University': '東北大学',
  'Tohoku University of Art and Design': '東北芸術工科大学',
  'Tohoku Women\'s College': '東北女子大学',
  'Tohwa University': '東和大学',
  'Toin University of Yokohama': '桐蔭横浜大学',
  'Tokai Gakuen University': '東海学園大学',
  'Tokai University Educational System': '東海大学',
  'Tokai Women\'s College': '東海女子大学',
  'Tokiwa University': '常磐大学',
  'Tokoha Gakuen University': '常葉学園大学',
  'Tokushima Bunri University': '徳島文理大学',
  'Tokushima University': '徳島大学',
  'Tokuyama University': '徳山大学',
  'Tokyo College of Music': '東京音楽大学',
  'Tokyo Denki University': '東京電機大学',
  'Tokyo Dental College': '東京歯科大学',
  'Tokyo Engineering University': '東京工科大学',
  'Tokyo Gakugei University': '東京学芸大学',
  'Tokyo Institute of Polytechnics': '東京工芸大学',
  'Tokyo Institute of Technology': '東京工業大学',
  'Tokyo International University': '東京国際大学',
  'Tokyo Kasei University': '東京家政大学',
  'Tokyo Keizai University': '東京経済大学',
  'Tokyo Medical and Dental University': '東京医科歯科大学',
  'Tokyo Medical College': '東京医科大学',
  'Tokyo Metropolitan Institute of Technology': '東京都立科学技術大学',
  'Tokyo Metropolitan University': '東京都立大学',
  'Tokyo Metropolitan University of Health Sciences': '東京都立保健科学大学',
  'Tokyo National University of Fine Arts and Music': '東京芸術大学',
  'Tokyo University of Agriculture': '東京農業大学',
  'Tokyo University of Agriculture and Technology': '東京農工大学',
  'Tokyo University of Art and Design': '東京造形大学',
  'Tokyo University of Fisheries': '東京水産大学',
  'Tokyo University of Foreign Studies': '東京外国語大学',
  'Tokyo University of Information Sciences': '東京情報大学',
  'Tokyo University of Mercantile Marine': '東京商船大学',
  'Tokyo University of Pharmacy and Life Science': '東京薬科大学',
  'Tokyo Woman\'s Christian University': '東京女子大学',
  'Tokyo Women\'s College of Physical Education': '東京女子体育大学',
  'Tokyo Women\'s Medial College': '東京女子医科大学',
  'Tomakomai Komazawa University': '苫小牧駒澤大学',
  'Tottori University': '鳥取大学',
  'Tottori University of Environmental Studies': '鳥取環境大学',
  'Toyama Medical and Pharmaceutical University': '富山医科薬科大学',
  'Toyama Prefectural University': '富山県立大学',
  'Toyama University': '富山大学',
  'Toyama University of International Studies': '富山国際大学',
  'Toyo Eiwa Women\'s University': '東洋英和女学院大学',
  'Toyo Gakuen University': '東洋学園大学',
  'Toyo University': '東洋大学',
  'Toyohashi University of Technology': '豊橋技術科学大学',
  'Toyota Technological Institute': '豊田工業大学',
  'Tsuda College': '津田塾大学',
  'Tsukuba University': '筑波大学',
  'Tsuru University': '都留文科大学',
  'Tsurumi University': '鶴見大学',
  'Ueno Gakuen College': '上野学園大学',
  'United Nations University': '国連大学',
  'University of Aizu': '会津大学',
  'University of Bunkyo': '文教大学',
  'University of East Asia': '東亜大学',
  'University of Electro-Communications': '電気通信大学',
  'University of Marketing and Distribution Sciences': '流通科学大学',
  'University of Occupational and Environmental Health, Japan': '産業医科大学',
  'University of Shiga Prefecture': '滋賀県立大学',
  'University of the Air': '放送大学',
  'University of the Ryukyus': '琉球大学',
  'University of the Sacred Heart Tokyo': '聖心女子大学',
  'University of Tokyo': '東京大学',
  'Utsunomiya University': '宇都宮大学',
  'Wakayama Medical College': '和歌山医科大学',
  'Wakayama University': '和歌山大学',
  'Wakkanai Hokusei Gakuen University': '稚内北星学園大学',
  'Wako University': '和光大学',
  'Waseda University': '早稲田大学',
  'Wayo Women\'s University': '和洋女子大学',
  'Women\'s College of Fine Arts': '女子美術大学',
  'Yamagata University': '山形大学',
  'Yamaguchi Prefectural University': '山口県立大学',
  'Yamaguchi University': '山口大学',
  'Yamanashi Gakuin University': '山梨学院大学',
  'Yamanashi Medical University': '山梨医科大学',
  'Yamanashi University': '山梨大学',
  'Yasuda Women\'s University': '安田女子大学',
  'Yokkaichi University': '四日市大学',
  'Yokohama City University': '横浜市立大学',
  'Yokohama College of Commerce': '横浜商科大学',
  'Yokohama National University': '横浜国立大学',
}

/**
 * 英語の大学名を日本語に翻訳
 */
function translateUniversityName(nameEn: string): string {
  // 特殊な名前のマッピングを確認
  if (specialNames[nameEn]) {
    return specialNames[nameEn]
  }

  // 一般的なパターンから翻訳を生成
  let result = nameEn

  // 地名の置換
  for (const [en, ja] of Object.entries(prefectureMap)) {
    result = result.replace(new RegExp(en, 'gi'), ja)
  }

  // 大学の種類の置換
  result = result.replace(/University/gi, '大学')
  result = result.replace(/College/gi, '大学')
  result = result.replace(/Institute/gi, '大学')
  result = result.replace(/School/gi, '大学')
  result = result.replace(/Academy/gi, '大学')

  // 専門分野の置換
  for (const [en, ja] of Object.entries(fieldMap)) {
    result = result.replace(new RegExp(en, 'gi'), ja)
  }

  // その他の置換
  result = result.replace(/Women's/gi, '女子')
  result = result.replace(/Women/gi, '女子')
  result = result.replace(/Woman's/gi, '女子')
  result = result.replace(/Woman/gi, '女子')
  result = result.replace(/Prefectural/gi, '県立')
  result = result.replace(/National/gi, '国立')
  result = result.replace(/City/gi, '市立')
  result = result.replace(/Municipal/gi, '市立')
  result = result.replace(/Public/gi, '公立')
  result = result.replace(/International/gi, '国際')
  result = result.replace(/Christian/gi, 'キリスト教')
  result = result.replace(/Buddhist/gi, '仏教')
  result = result.replace(/Gakuin/gi, '学院')
  result = result.replace(/Gakuen/gi, '学園')
  result = result.replace(/Gakko/gi, '学校')
  result = result.replace(/Jogakuin/gi, '女学院')
  result = result.replace(/Jogakuen/gi, '女学園')
  result = result.replace(/Jogaku/gi, '女学')
  result = result.replace(/Keizai/gi, '経済')
  result = result.replace(/Sangyo/gi, '産業')
  result = result.replace(/Bunka/gi, '文化')
  result = result.replace(/Bunkyo/gi, '文教')
  result = result.replace(/Shukutoku/gi, '淑徳')
  result = result.replace(/Shudo/gi, '修道')
  result = result.replace(/Shinwa/gi, '親和')
  result = result.replace(/Shoin/gi, '松蔭')
  result = result.replace(/Dokkyo/gi, '獨協')
  result = result.replace(/Doshisha/gi, '同志社')
  result = result.replace(/Rikkyo/gi, '立教')
  result = result.replace(/Rissho/gi, '立正')
  result = result.replace(/Ritsumeikan/gi, '立命館')
  result = result.replace(/Ryukoku/gi, '龍谷')
  result = result.replace(/Kwansei/gi, '関西学院')
  result = result.replace(/Kansai/gi, '関西')
  result = result.replace(/Kanto/gi, '関東')
  result = result.replace(/Hosei/gi, '法政')
  result = result.replace(/Keio/gi, '慶應')
  result = result.replace(/Waseda/gi, '早稲田')
  result = result.replace(/Meiji/gi, '明治')
  result = result.replace(/Chuo/gi, '中央')
  result = result.replace(/Nihon/gi, '日本')
  result = result.replace(/Nippon/gi, '日本')
  result = result.replace(/Sophia/gi, '上智')
  result = result.replace(/ICU/gi, '国際基督教')
  result = result.replace(/ICU/gi, '国際基督教')
  result = result.replace(/Tokyo/gi, '東京')
  result = result.replace(/Kyoto/gi, '京都')
  result = result.replace(/Osaka/gi, '大阪')
  result = result.replace(/Nagoya/gi, '名古屋')
  result = result.replace(/Yokohama/gi, '横浜')
  result = result.replace(/Kobe/gi, '神戸')
  result = result.replace(/Sendai/gi, '仙台')
  result = result.replace(/Sapporo/gi, '札幌')
  result = result.replace(/Fukuoka/gi, '福岡')
  result = result.replace(/Hiroshima/gi, '広島')
  result = result.replace(/Kumamoto/gi, '熊本')
  result = result.replace(/Kagoshima/gi, '鹿児島')
  result = result.replace(/Niigata/gi, '新潟')
  result = result.replace(/Shizuoka/gi, '静岡')
  result = result.replace(/Okayama/gi, '岡山')
  result = result.replace(/Kanazawa/gi, '金沢')
  result = result.replace(/Matsuyama/gi, '松山')
  result = result.replace(/Takamatsu/gi, '高松')
  result = result.replace(/Kochi/gi, '高知')
  result = result.replace(/Utsunomiya/gi, '宇都宮')
  result = result.replace(/Mito/gi, '水戸')
  result = result.replace(/Maebashi/gi, '前橋')
  result = result.replace(/Kofu/gi, '甲府')
  result = result.replace(/Yamagata/gi, '山形')
  result = result.replace(/Akita/gi, '秋田')
  result = result.replace(/Morioka/gi, '盛岡')
  result = result.replace(/Aomori/gi, '青森')
  result = result.replace(/Asahikawa/gi, '旭川')
  result = result.replace(/Hakodate/gi, '函館')
  result = result.replace(/Kushiro/gi, '釧路')
  result = result.replace(/Obihiro/gi, '帯広')
  result = result.replace(/Kitami/gi, '北見')
  result = result.replace(/Muroran/gi, '室蘭')
  result = result.replace(/Tomakomai/gi, '苫小牧')
  result = result.replace(/Iwaki/gi, 'いわき')
  result = result.replace(/Fukushima/gi, '福島')
  result = result.replace(/Koriyama/gi, '郡山')
  result = result.replace(/Aizu/gi, '会津')
  result = result.replace(/Mito/gi, '水戸')
  result = result.replace(/Tsukuba/gi, '筑波')
  result = result.replace(/Tsuchiura/gi, '土浦')
  result = result.replace(/Choshi/gi, '銚子')
  result = result.replace(/Kisarazu/gi, '木更津')
  result = result.replace(/Funabashi/gi, '船橋')
  result = result.replace(/Ichikawa/gi, '市川')
  result = result.replace(/Kawasaki/gi, '川崎')
  result = result.replace(/Yokosuka/gi, '横須賀')
  result = result.replace(/Odawara/gi, '小田原')
  result = result.replace(/Fujisawa/gi, '藤沢')
  result = result.replace(/Kamakura/gi, '鎌倉')
  result = result.replace(/Yokohama/gi, '横浜')
  result = result.replace(/Kawagoe/gi, '川越')
  result = result.replace(/Kumagaya/gi, '熊谷')
  result = result.replace(/Honjo/gi, '本庄')
  result = result.replace(/Chichibu/gi, '秩父')
  result = result.replace(/Omiya/gi, '大宮')
  result = result.replace(/Urawa/gi, '浦和')
  result = result.replace(/Ageo/gi, '上尾')
  result = result.replace(/Koshigaya/gi, '越谷')
  result = result.replace(/Kasukabe/gi, '春日部')
  result = result.replace(/Gyoda/gi, '行田')
  result = result.replace(/Fukaya/gi, '深谷')
  result = result.replace(/Higashimatsuyama/gi, '東松山')
  result = result.replace(/Sayama/gi, '狭山')
  result = result.replace(/Tokorozawa/gi, '所沢')
  result = result.replace(/Iruma/gi, '入間')
  result = result.replace(/Hanno/gi, '飯能')
  result = result.replace(/Hidaka/gi, '日高')
  result = result.replace(/Ogose/gi, '越生')
  result = result.replace(/Moroyama/gi, '毛呂山')
  result = result.replace(/Ogawa/gi, '小川')
  result = result.replace(/Namegawa/gi, '滑川')
  result = result.replace(/Ranzan/gi, '嵐山')
  result = result.replace(/Yoshimi/gi, '吉見')
  result = result.replace(/Hatoyama/gi, '鳩山')
  result = result.replace(/Tokigawa/gi, 'ときがわ')
  result = result.replace(/Ogawamachi/gi, '小川町')
  result = result.replace(/Higashichichibu/gi, '東秩父')
  result = result.replace(/Minano/gi, '皆野')
  result = result.replace(/Nagatoro/gi, '長瀞')
  result = result.replace(/Ogano/gi, '小鹿野')
  result = result.replace(/Yokoze/gi, '横瀬')
  result = result.replace(/Chichibu/gi, '秩父')
  result = result.replace(/Misato/gi, '美里')
  result = result.replace(/Kamikawa/gi, '神川')
  result = result.replace(/Kamisato/gi, '上里')
  result = result.replace(/Miyoshi/gi, '三芳')
  result = result.replace(/Fujimi/gi, '富士見')
  result = result.replace(/Shiki/gi, '志木')
  result = result.replace(/Hasuda/gi, '蓮田')
  result = result.replace(/Shiraoka/gi, '白岡')
  result = result.replace(/Sugito/gi, '杉戸')
  result = result.replace(/Matsubushi/gi, '松伏')
  result = result.replace(/Yashio/gi, '八潮')
  result = result.replace(/Misato/gi, '三郷')
  result = result.replace(/Yoshikawa/gi, '吉川')
  result = result.replace(/Koshigaya/gi, '越谷')
  result = result.replace(/Matsudo/gi, '松戸')
  result = result.replace(/Noda/gi, '野田')
  result = result.replace(/Nagareyama/gi, '流山')
  result = result.replace(/Ichikawa/gi, '市川')
  result = result.replace(/Urayasu/gi, '浦安')
  result = result.replace(/Kashiwa/gi, '柏')
  result = result.replace(/Noda/gi, '野田')
  result = result.replace(/Mobara/gi, '茂原')
  result = result.replace(/Togane/gi, '東金')
  result = result.replace(/Sawara/gi, '佐原')
  result = result.replace(/Narita/gi, '成田')
  result = result.replace(/Sakura/gi, '佐倉')
  result = result.replace(/Yachimata/gi, '八街')
  result = result.replace(/Tomisato/gi, '富里')
  result = result.replace(/Inzai/gi, '印西')
  result = result.replace(/Shisui/gi, '酒々井')
  result = result.replace(/Shibayama/gi, '芝山')
  result = result.replace(/Yokoshibahikari/gi, '横芝光')
  result = result.replace(/Asahi/gi, '旭')
  result = result.replace(/Ichinomiya/gi, '一宮')
  result = result.replace(/Katori/gi, '香取')
  result = result.replace(/Tako/gi, '多古')
  result = result.replace(/Tonosho/gi, '東庄')
  result = result.replace(/Kujukuri/gi, '九十九里')
  result = result.replace(/Oamishirasato/gi, '大網白里')
  result = result.replace(/Mobara/gi, '茂原')
  result = result.replace(/Togane/gi, '東金')
  result = result.replace(/Sawara/gi, '佐原')
  result = result.replace(/Narita/gi, '成田')
  result = result.replace(/Sakura/gi, '佐倉')
  result = result.replace(/Yachimata/gi, '八街')
  result = result.replace(/Tomisato/gi, '富里')
  result = result.replace(/Inzai/gi, '印西')
  result = result.replace(/Shisui/gi, '酒々井')
  result = result.replace(/Shibayama/gi, '芝山')
  result = result.replace(/Yokoshibahikari/gi, '横芝光')
  result = result.replace(/Asahi/gi, '旭')
  result = result.replace(/Ichinomiya/gi, '一宮')
  result = result.replace(/Katori/gi, '香取')
  result = result.replace(/Tako/gi, '多古')
  result = result.replace(/Tonosho/gi, '東庄')
  result = result.replace(/Kujukuri/gi, '九十九里')
  result = result.replace(/Oamishirasato/gi, '大網白里')

  return result
}

/**
 * CSVファイルを読み込んで日本語名を追加
 */
function processCsv(inputPath: string, outputPath: string) {
  console.log('📖 CSVファイルを読み込み中...')
  const content = readFileSync(inputPath, 'utf-8')
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)
  
  if (lines.length === 0) {
    console.error('❌ CSVファイルが空です')
    process.exit(1)
  }

  // ヘッダー行を処理
  const header = lines[0]
  const headerCols = header.split(',')
  const nameEnIdx = headerCols.findIndex(col => col === 'name_en')
  const nameJaIdx = headerCols.findIndex(col => col === 'name_ja')

  if (nameEnIdx === -1) {
    console.error('❌ name_enカラムが見つかりません')
    process.exit(1)
  }

  console.log(`📊 データ行数: ${lines.length - 1}件`)
  console.log(`🔍 name_enカラム: ${nameEnIdx + 1}列目`)
  console.log(`🔍 name_jaカラム: ${nameJaIdx !== -1 ? nameJaIdx + 1 + '列目' : '新規追加'}\n`)

  // データ行を処理
  const processedLines: string[] = [header]
  let processedCount = 0
  let skippedCount = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const cols = parseCsvLine(line)
    
    if (cols.length <= nameEnIdx) {
      console.warn(`⚠️ 行 ${i + 1}: カラム数が不足しています。スキップします。`)
      skippedCount++
      continue
    }

    const nameEn = cols[nameEnIdx]?.trim() || ''
    if (!nameEn) {
      console.warn(`⚠️ 行 ${i + 1}: name_enが空です。スキップします。`)
      skippedCount++
      continue
    }

    // 日本語名を翻訳
    const nameJa = translateUniversityName(nameEn)

    // name_jaカラムを追加または更新
    if (nameJaIdx === -1) {
      // name_jaカラムが存在しない場合は追加
      cols.push(nameJa)
    } else {
      // name_jaカラムが存在する場合は更新（空の場合のみ）
      if (!cols[nameJaIdx] || cols[nameJaIdx].trim() === '') {
        cols[nameJaIdx] = nameJa
      }
    }

    processedLines.push(formatCsvLine(cols))
    processedCount++

    if (processedCount % 50 === 0) {
      console.log(`  ✅ ${processedCount}件処理完了...`)
    }
  }

  // 結果をファイルに書き込み
  console.log(`\n💾 結果をファイルに書き込み中: ${outputPath}`)
  writeFileSync(outputPath, processedLines.join('\n'), 'utf-8')

  console.log('\n📊 処理結果:')
  console.log(`  ✅ 処理完了: ${processedCount}件`)
  console.log(`  ⚠️  スキップ: ${skippedCount}件`)
  console.log(`  📁 出力ファイル: ${outputPath}`)
  console.log('\n✨ 完了')
}

/**
 * CSV行をパース（カンマ区切り、引用符対応）
 */
function parseCsvLine(line: string): string[] {
  const cols: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"'
        i++
      } else {
        // 引用符の開始/終了
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // カラムの区切り
      cols.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // 最後のカラム
  cols.push(current.trim())
  
  return cols
}

/**
 * CSV行をフォーマット（引用符が必要な場合は追加）
 */
function formatCsvLine(cols: string[]): string {
  return cols.map(col => {
    // カンマ、改行、引用符が含まれる場合は引用符で囲む
    if (col.includes(',') || col.includes('\n') || col.includes('"')) {
      return `"${col.replace(/"/g, '""')}"`
    }
    return col
  }).join(',')
}

// メイン処理
const inputFile = resolve(process.cwd(), 'exports/japanese-universities-001.csv')
const outputFile = resolve(process.cwd(), 'exports/japanese-universities-001-with-ja.csv')

console.log('🚀 日本語名追加スクリプト開始\n')
console.log(`📂 入力ファイル: ${inputFile}`)
console.log(`📂 出力ファイル: ${outputFile}\n`)

try {
  processCsv(inputFile, outputFile)
} catch (error: any) {
  console.error('❌ エラーが発生しました:', error.message)
  process.exit(1)
}

