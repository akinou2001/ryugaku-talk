-- CSVファイルから日本語名（name_ja）を更新するSQL
-- 生成日時: 2026-01-07T20:40:35.339Z
-- 総件数: 570件

BEGIN;

UPDATE universities 
SET name_ja = '愛知文教大学', updated_at = NOW()
WHERE id = 'bc136f55-cf9d-49f9-bff3-21f7feb8d4b2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知学院大学', updated_at = NOW()
WHERE id = '1c404c42-739e-4be1-ab60-39716d3e1f60' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知学泉大学', updated_at = NOW()
WHERE id = 'f795f728-5e6a-4c28-83fd-b46d5e8f2e63' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知工業大学', updated_at = NOW()
WHERE id = 'b2ffd9d1-cef0-4d04-bb92-6e9efe841807' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知医科大学', updated_at = NOW()
WHERE id = 'f1cf4f9b-799b-47eb-a4b6-e1578201d276' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知県立大学', updated_at = NOW()
WHERE id = '9495963c-5e3f-4435-87bb-cfb3ba14a075' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知県立芸術大学', updated_at = NOW()
WHERE id = 'abf87a2c-e239-4f09-965f-aec5d243a13b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知産業大学', updated_at = NOW()
WHERE id = '1dab164a-5552-4521-9df7-bd65b85088ec' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知淑徳大学', updated_at = NOW()
WHERE id = '5781f0bc-03d7-41f4-bc95-cc13004e7147' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知大学', updated_at = NOW()
WHERE id = '4a933d7e-b249-4e01-9249-8f4c5ced1d4b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛知教育大学', updated_at = NOW()
WHERE id = '09ea530e-a329-44b8-a718-1696f5519d34' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛国学園大学', updated_at = NOW()
WHERE id = 'a692c8d4-70c2-4690-b032-e94f213b8654' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '秋田大学', updated_at = NOW()
WHERE id = '1b9fcb90-4bbe-424f-aa9c-daafab1ad48e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '秋田経済法科大学', updated_at = NOW()
WHERE id = 'e67e678f-6bb5-48f7-b552-d481f9fd150b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'アメリカン大学沖縄校', updated_at = NOW()
WHERE id = 'ca5bebd9-9492-46cb-9462-0d40b5d9cf99' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '青森中央学院大学', updated_at = NOW()
WHERE id = 'c93bde9d-a6b7-4788-b4b1-38c1bace7465' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '青森公立大学', updated_at = NOW()
WHERE id = '6d5fe7f2-1614-4744-849d-0e1a80cdb388' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '青森大学', updated_at = NOW()
WHERE id = '9abb6684-f48d-4735-a761-e2039dce7b97' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '青森県立保健大学', updated_at = NOW()
WHERE id = '8d03d34d-5972-4ba7-9637-581c160926c4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '青山学院大学', updated_at = NOW()
WHERE id = '84167a74-30ae-4b74-a8f0-6147ac2d1548' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '朝日大学', updated_at = NOW()
WHERE id = '052f8cf6-1e8f-42ce-9d3a-3144ccc4b578' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '旭川医科大学', updated_at = NOW()
WHERE id = '3f6108d3-38fa-4746-a322-66d8682dbc61' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '旭川大学', updated_at = NOW()
WHERE id = '2b2e43cc-8b53-4b77-ab66-f9e7625ddc97' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '足利工業大学', updated_at = NOW()
WHERE id = 'c76d9240-2c99-42dd-a45f-2ba2dbecb1bb' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '芦屋大学', updated_at = NOW()
WHERE id = 'bd0c636d-dd50-47cf-b0d2-61d3b9ffcc81' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '亜細亜大学', updated_at = NOW()
WHERE id = 'bb6545af-04bc-4304-9914-d44db01fda6e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '跡見学園女子大学', updated_at = NOW()
WHERE id = 'd93d0457-7618-4049-b052-bec0821da78f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '麻布大学', updated_at = NOW()
WHERE id = '3a1b4074-dd45-4433-90b5-87836b825679' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '梅花女子大学', updated_at = NOW()
WHERE id = 'b1742f81-8c29-4ca5-be7c-94579c743c96' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '梅光学院大学', updated_at = NOW()
WHERE id = '9fa18a8f-3229-451a-96a1-8399c04a874a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '別府大学', updated_at = NOW()
WHERE id = '296d2b32-8f67-47ce-81f6-e064f75750ce' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '佛教大学', updated_at = NOW()
WHERE id = '2ca91dba-8649-4ea2-97eb-a8133315c64b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '文化女子大学', updated_at = NOW()
WHERE id = 'd47ed358-1479-41e1-a53f-667ca0f5bfa0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '文京学院大学', updated_at = NOW()
WHERE id = 'b5dcf906-18d3-4914-8c19-ac65e2c7903b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '文教大学', updated_at = NOW()
WHERE id = '7e6882eb-f5ef-46b0-904f-4883ebf3c697' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '千葉工業大学', updated_at = NOW()
WHERE id = '29bba4b3-f184-4b91-8bc1-40c4718e1823' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '千葉経済大学', updated_at = NOW()
WHERE id = 'bd45c596-d529-4061-b1be-aa59ae076e4b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '千葉大学', updated_at = NOW()
WHERE id = 'a4dffce7-0ee4-41c5-be83-19ab7ecda1e5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '千葉商科大学', updated_at = NOW()
WHERE id = 'a8c003d4-1d9d-4541-a646-6b837f25fcd8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '筑紫女学園大学', updated_at = NOW()
WHERE id = '977e7c41-9651-4e93-8b2f-a6237884dfb2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '中部学院大学', updated_at = NOW()
WHERE id = 'f41f55c9-489e-4039-995f-c110db81a4c2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '中部大学', updated_at = NOW()
WHERE id = 'bc046419-d7a1-4109-91b2-388ef306437f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '中京学院大学', updated_at = NOW()
WHERE id = 'e61b136d-5ba3-47f1-8bb5-27dd3d7a7717' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '中京大学', updated_at = NOW()
WHERE id = '52949e49-c0b9-4872-96c8-48d222ab329b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '中京女子大学', updated_at = NOW()
WHERE id = '3d705641-4229-435b-ba81-714ff9487d2c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '中央学院大学', updated_at = NOW()
WHERE id = '28350f50-0750-45e6-ad1e-921a1121ded7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '中央大学', updated_at = NOW()
WHERE id = 'f617b93c-0713-4914-8d88-0b47607f706e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '第一工業大学', updated_at = NOW()
WHERE id = '10be8a73-f694-44d9-8e52-82b5518baecd' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大同工業大学', updated_at = NOW()
WHERE id = '239c522d-43f5-4c2b-a8f5-b406dd19730c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '第一薬科大学', updated_at = NOW()
WHERE id = '802d9237-2891-4b3d-85ad-583026606f3f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '第一経済大学', updated_at = NOW()
WHERE id = '0db7ff5e-0237-49f4-8f6e-2b99288d3b57' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大東文化大学', updated_at = NOW()
WHERE id = '9c1cabac-4457-4b39-bfdb-4ba2ec66753a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '同朋大学', updated_at = NOW()
WHERE id = '3a91bbe4-1024-40aa-9ab1-b45c9b1e87d4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '道都大学', updated_at = NOW()
WHERE id = '1fbb53a3-9c19-43ff-9a77-07204f67a2ce' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '獨協大学', updated_at = NOW()
WHERE id = 'ee95b8fd-ba22-49a0-87a9-edbe7214f1e9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '獨協医科大学', updated_at = NOW()
WHERE id = '244d78e0-e584-4e52-a9c6-27ff3b9291d1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '同志社大学', updated_at = NOW()
WHERE id = '4471422b-0dfb-40ff-a578-bc57cc0190b0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '同志社女子大学', updated_at = NOW()
WHERE id = '1dc21296-b4f1-47fb-a3c5-3851ed269ef8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '江戸川大学', updated_at = NOW()
WHERE id = '54886718-94dc-441d-998b-2714d25fd7fd' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '愛媛大学', updated_at = NOW()
WHERE id = '27216c2c-df67-4f25-a2fa-6fd4129ae21f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '英知大学', updated_at = NOW()
WHERE id = '65ae84de-9ade-4674-b93c-ccdc8c411704' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'エリザベト音楽大学', updated_at = NOW()
WHERE id = '16ee72ec-ce27-4ba8-9a82-08372a05f28e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'フェリス女学院大学', updated_at = NOW()
WHERE id = 'dc54dbb3-d5c4-43d8-8626-8d25590492fc' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '富士大学', updated_at = NOW()
WHERE id = '1cff70d9-fb82-4518-ada2-11e06a2bbcf4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '藤女子大学', updated_at = NOW()
WHERE id = '3d2db2b6-6f48-4e99-a9c3-1fa670a82d92' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '藤田医科大学', updated_at = NOW()
WHERE id = '50dd047c-4326-495e-8670-da22c43ebdf7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福井医科大学', updated_at = NOW()
WHERE id = '76717227-e7d3-497e-b5d6-d14f8728cb78' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福井県立大学', updated_at = NOW()
WHERE id = '46971115-5cf3-43c0-ba7f-6f6d3c8ec9be' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福井大学', updated_at = NOW()
WHERE id = '656a7c5e-827a-45af-863f-a726ad0453d2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福井工業大学', updated_at = NOW()
WHERE id = '2ea753d9-5943-45a9-b0a5-85a2224f3cc6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福岡歯科大学', updated_at = NOW()
WHERE id = '6f276d68-caf2-4949-ac37-f47ca18e7b76' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福岡工業大学', updated_at = NOW()
WHERE id = 'cc2cb4bc-fc93-4413-83e7-50dbd78bcca9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福岡国際大学', updated_at = NOW()
WHERE id = '1dd5a19a-13fd-41de-9afe-cde7dc5c5097' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福岡県立大学', updated_at = NOW()
WHERE id = '513af46d-de4c-4a20-aea5-83e8bcd80e22' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福岡大学', updated_at = NOW()
WHERE id = '82798b4e-295a-431a-a580-035dcda2b53b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福岡教育大学', updated_at = NOW()
WHERE id = '0da74cb4-706e-4d7f-a283-fc67d47f284b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福岡女子大学', updated_at = NOW()
WHERE id = '7e05c0d3-af5d-4dac-ad82-feb9dceefd0e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福島医科大学', updated_at = NOW()
WHERE id = '4b80cd95-efcf-43da-a9ac-1b03b04dfabe' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福島大学', updated_at = NOW()
WHERE id = '2f11dc73-f9a3-40ad-8cb6-e9bfb6dcf850' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福山平成大学', updated_at = NOW()
WHERE id = '68068d9c-ce56-4033-8c33-76b463b85f88' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '福山大学', updated_at = NOW()
WHERE id = '01196bc5-d49f-4be4-ba9e-1f5508fa3b49' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '学習院大学', updated_at = NOW()
WHERE id = 'ee83a850-297d-4d03-8ee0-0fdc17d23528' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岐阜経済大学', updated_at = NOW()
WHERE id = '52b55ffa-2b77-454b-a4e5-2a040a3c0fa6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岐阜薬科大学', updated_at = NOW()
WHERE id = 'a6080e21-8cfb-4cac-8a33-006683195dbf' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岐阜聖徳学園大学', updated_at = NOW()
WHERE id = '408878b6-88ee-453c-9c7b-e4b8095b6c7b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岐阜大学', updated_at = NOW()
WHERE id = 'bc8364a9-6e55-4025-a900-d824bd64316d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岐阜教育大学', updated_at = NOW()
WHERE id = 'feaaf0a6-d239-4041-9cb9-0cc9d3bded03' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岐阜女子大学', updated_at = NOW()
WHERE id = 'a90d997a-1c0d-4b2d-adb0-a10826cbeca6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '総合研究大学院大学', updated_at = NOW()
WHERE id = '16110e86-03f2-4569-bb83-a0835b03e39f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '群馬県立女子大学', updated_at = NOW()
WHERE id = '26e2da0d-e7f1-4130-b323-5a37fa6ac786' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '群馬大学', updated_at = NOW()
WHERE id = '57863cb3-d774-4c6e-bc51-ac06acb33b97' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '八戸工業大学', updated_at = NOW()
WHERE id = 'c877774f-83d9-4097-bd95-271a026adfc9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '八戸大学', updated_at = NOW()
WHERE id = '1f54134c-baec-413f-b1b7-a7eeb0983ac4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '函館大学', updated_at = NOW()
WHERE id = '73251123-c3bd-4c47-8705-18c4297e31d1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '白鴎大学', updated_at = NOW()
WHERE id = '18888389-dc70-4e41-83a9-928ef839230d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '浜松大学', updated_at = NOW()
WHERE id = '69c45a4f-92ba-4cc9-875e-a186f7778bd3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '浜松医科大学', updated_at = NOW()
WHERE id = 'ca742f61-4f51-40c7-b46e-91f15eda7c9b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '花園大学', updated_at = NOW()
WHERE id = 'cb6969e8-9c2f-409a-9ace-6e92bfd1ee61' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '阪南大学', updated_at = NOW()
WHERE id = 'f0434544-d3bd-4df7-8c91-382175ece75a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '平成国際大学', updated_at = NOW()
WHERE id = '900774e0-6521-46dd-b16b-fa01f89b8ab5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東日本国際大学', updated_at = NOW()
WHERE id = 'dffb4190-e9f9-40e8-8d71-f46395f049c1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '比治山大学', updated_at = NOW()
WHERE id = '6c83c652-93f3-4122-92cd-22b33009d5ee' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '姫路獨協大学', updated_at = NOW()
WHERE id = '43f52618-8f63-42ba-8334-cf643f5c2711' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '姫路工業大学', updated_at = NOW()
WHERE id = 'd74aba19-7305-4f0c-a8f4-ac0c056d11b2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '弘前学院大学', updated_at = NOW()
WHERE id = '02e609bf-bca4-4e7e-8c8e-d90fb0d4fe48' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '弘前大学', updated_at = NOW()
WHERE id = '5c6c820a-8d31-428a-bd46-b9cad268f536' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島文教女子大学', updated_at = NOW()
WHERE id = '850ab243-58fe-4184-b990-d5541dd3cfca' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島市立大学', updated_at = NOW()
WHERE id = 'd5c3b588-3d5c-4f0c-af33-9f46936766d7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島工業大学', updated_at = NOW()
WHERE id = '1a3fe079-74e4-438d-b566-8d7435a5d561' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島国際大学', updated_at = NOW()
WHERE id = 'a2deb2d3-f86c-4b17-82c9-da57e61b6ef5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島女学院大学', updated_at = NOW()
WHERE id = 'a6171200-4344-4d64-9aa9-6a7c2e8e5ebe' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島国際学院大学', updated_at = NOW()
WHERE id = '8ac5819b-656e-4f4e-af2b-a523cc15afa1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島県立大学', updated_at = NOW()
WHERE id = 'e54edc7b-fcf0-4a9b-8224-06765fc396d4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島修道大学', updated_at = NOW()
WHERE id = '42f2dd31-9d2d-45b2-ac84-f2c6f0987cbb' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島大学', updated_at = NOW()
WHERE id = 'a6d15a5c-416a-432d-90f9-e61602a4a7ad' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島経済大学', updated_at = NOW()
WHERE id = '78b54375-d397-45cd-a474-8e22e7e200f7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '広島女子大学', updated_at = NOW()
WHERE id = 'ae09618f-6300-47c6-a0f4-5d7d08132f34' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '一橋大学', updated_at = NOW()
WHERE id = 'e73d2cec-4838-4309-8caa-ea493b680898' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北海道情報大学', updated_at = NOW()
WHERE id = 'ae22a25d-9a50-4135-8efa-1cfe75cfa2a2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北海道薬科大学', updated_at = NOW()
WHERE id = '5e0d1e5e-00c2-4843-a7be-50a181c4a152' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北海道工業大学', updated_at = NOW()
WHERE id = 'a1cac84d-c968-464f-a4a0-0ea0795111cc' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北海道東海大学', updated_at = NOW()
WHERE id = 'cbe0a9ef-502e-4ff6-89cf-00e91aa8bc73' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北海道大学', updated_at = NOW()
WHERE id = 'bd54bd25-895b-46a2-8622-3aa241784880' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北海道教育大学', updated_at = NOW()
WHERE id = '54864ab0-450e-49ba-822a-693f85447470' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北海道医療大学', updated_at = NOW()
WHERE id = '85f84bc9-8c95-45c3-9a97-8fe9377782f3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北海学園大学', updated_at = NOW()
WHERE id = '1f332ca2-94fd-42d8-8f78-d95a129cc26d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北海学園北見大学', updated_at = NOW()
WHERE id = '5b3c0077-8e1e-43bf-af9f-88fbf0e330b3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北陸大学', updated_at = NOW()
WHERE id = '3bb3fb88-6812-49ec-8424-53943afda905' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北星学園大学', updated_at = NOW()
WHERE id = '972b66d8-b2bf-4b3c-8896-a3eaf9a51f4e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '法政大学', updated_at = NOW()
WHERE id = '17639089-2e48-40d2-b92e-bb630294089f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '星薬科大学', updated_at = NOW()
WHERE id = 'd62bf6cf-e157-4973-b4b1-116b97733047' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '兵庫医科大学', updated_at = NOW()
WHERE id = '8e106ebc-28c3-4a4b-9537-fb1b3a5e60a0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '兵庫大学', updated_at = NOW()
WHERE id = '847caeb5-625c-49a7-a3cd-b8d83cc2e2ce' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '兵庫教育大学', updated_at = NOW()
WHERE id = 'e9a7d576-07fa-40ac-9f7b-3885deff959e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '茨城キリスト教大学', updated_at = NOW()
WHERE id = 'b09758b7-50e1-4eb0-b93b-a2864dcad9c2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '茨城県立医療大学', updated_at = NOW()
WHERE id = '8632bb4e-31d0-4006-824a-46e2173311db' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '茨城大学', updated_at = NOW()
WHERE id = '5deb358b-55a5-4ec1-9dbe-f9bb0f38bac9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '四天王寺大学', updated_at = NOW()
WHERE id = 'd016d3d6-1129-4c8e-ace4-df13b104b0c8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '国際武道大学', updated_at = NOW()
WHERE id = 'b64c70c1-9c66-48df-b62e-e86bb85c5a3a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '国際基督教大学', updated_at = NOW()
WHERE id = 'f889a87c-27ad-4ec4-bc72-274da3d6d91b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '国際医療福祉大学', updated_at = NOW()
WHERE id = 'b4c26528-8934-40e7-9580-493f5b9a2b22' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '国際大学', updated_at = NOW()
WHERE id = 'ec80d882-08e6-4b87-8d72-61e9ac356c59' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鹿児島国際大学', updated_at = NOW()
WHERE id = 'afc53f5c-4f32-4202-886f-d0c4b82bceb3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '石巻専修大学', updated_at = NOW()
WHERE id = '6a6783ba-455b-42bf-9819-61c0ac71c0a7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'いわき明星大学', updated_at = NOW()
WHERE id = 'faf1bf32-b2dd-40b1-8498-b8e21c79e583' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岩手医科大学', updated_at = NOW()
WHERE id = 'd8b21622-47c2-4450-9ba2-9d990e7d3a4d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岩手県立大学', updated_at = NOW()
WHERE id = '582081a3-7d55-44c6-a592-0e93341335a7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岩手大学', updated_at = NOW()
WHERE id = '30591645-061c-4f6f-92a0-88a00874bc85' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北陸先端科学技術大学院大学', updated_at = NOW()
WHERE id = '656de37a-db76-4c9b-8c15-c3c40919a7e6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本社会事業大学', updated_at = NOW()
WHERE id = 'c6b307b5-71d8-4917-8509-528860d7f5f8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本女子大学', updated_at = NOW()
WHERE id = '861f3000-1de0-4209-a3ec-c7a8f1346217' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本赤十字看護大学', updated_at = NOW()
WHERE id = '83aaca02-9b46-4383-8255-3add7f26086f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '自治医科大学', updated_at = NOW()
WHERE id = '802254e4-8508-4e02-a5ca-9aa5f1c9d390' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京慈恵会医科大学', updated_at = NOW()
WHERE id = 'd4957e76-27b4-4a80-b438-2de07ac3cfc9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '実践女子大学', updated_at = NOW()
WHERE id = '0f2c31c2-3f02-403a-b9ee-f704377e5778' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '上武大学', updated_at = NOW()
WHERE id = '95105b15-0806-437e-9767-3699c9bbb775' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '上越教育大学', updated_at = NOW()
WHERE id = 'c79ad6e5-75a7-4f78-9231-520007e058ce' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '城西国際大学', updated_at = NOW()
WHERE id = '6c2c828c-87e7-4a4a-b775-8a06a961f7ea' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '城西大学', updated_at = NOW()
WHERE id = '0701a829-f304-4ce3-8760-d3ffb51ceb16' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '順天堂大学', updated_at = NOW()
WHERE id = '33e59722-af6e-41bf-b527-4e372a48f6b1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '香川栄養大学', updated_at = NOW()
WHERE id = '40c77e90-bf9b-4b4d-a424-780b09b2d0e0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '香川医科大学', updated_at = NOW()
WHERE id = 'aecef8a6-bcbe-4f6f-ae38-9fc269c75653' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '香川大学', updated_at = NOW()
WHERE id = '6c2511be-4f13-4e94-a9f9-84b83e7babbd' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鹿児島純心女子大学', updated_at = NOW()
WHERE id = '8fd4fed6-13c2-4bcf-811a-a28739f12828' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鹿児島大学', updated_at = NOW()
WHERE id = '301ed2ca-a376-4e43-9b5f-a9f6ee4adc9a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鹿児島女子大学', updated_at = NOW()
WHERE id = 'ec3e64b6-f21e-4dc8-bc1c-43c27f891756' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鎌倉女子大学', updated_at = NOW()
WHERE id = '0e57b6b3-153d-435b-a60f-fcea3b4670c3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神奈川歯科大学', updated_at = NOW()
WHERE id = 'f7e3f85a-43ef-47f4-8a53-ac5123296e5e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神奈川工業大学', updated_at = NOW()
WHERE id = '93e60157-e567-49b8-b317-fae8697fe35b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神奈川大学', updated_at = NOW()
WHERE id = 'e286f458-50ba-4cc3-8a5b-7f013fbd9da7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '金沢美術工芸大学', updated_at = NOW()
WHERE id = '9b82ab5e-fb18-4a3d-b532-54b277c72ee2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '金沢経済大学', updated_at = NOW()
WHERE id = 'bb5ecfbf-375e-4693-8f89-d4d259d9e789' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '金沢学院大学', updated_at = NOW()
WHERE id = '5504f37a-7371-43b0-b32e-9df408bafe57' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '金沢工業大学', updated_at = NOW()
WHERE id = '1f4f4205-9e73-40f5-b466-28f12f86d3e5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '金沢医科大学', updated_at = NOW()
WHERE id = '7f1a1e11-49d7-4cc6-ab87-0e4c5736c0a1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '金沢大学', updated_at = NOW()
WHERE id = 'e1d7b482-a08b-466d-85b2-f95cdfafa11d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神田外語大学', updated_at = NOW()
WHERE id = '68e0ce67-358f-4b9e-a575-ca7b4862f3fe' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '関西外国語大学', updated_at = NOW()
WHERE id = '0580b78e-34a1-43c1-9aad-570240e89fd3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '関西医科大学', updated_at = NOW()
WHERE id = '14af2b9a-31d6-40fc-9a62-39c68230b7a9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '関西大学', updated_at = NOW()
WHERE id = '27a4ec53-4fbd-4b54-ad57-02157133aa05' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '関西国際大学', updated_at = NOW()
WHERE id = '6b7fb0cb-4eb5-498a-89db-106ff3777360' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '関西福祉大学', updated_at = NOW()
WHERE id = '68435dc4-aca0-4f60-9bf9-252e0d6242d0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '関東学園大学', updated_at = NOW()
WHERE id = 'badc1e5c-16d5-4ef3-8737-dcd9650da63a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '関東学院大学', updated_at = NOW()
WHERE id = 'd1a7b510-63bc-475a-ab55-54bf04c37ab2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '川村学園女子大学', updated_at = NOW()
WHERE id = 'f67fbec3-3ab0-47d2-86b8-e0ec91f8e4d3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '川崎医科大学', updated_at = NOW()
WHERE id = '2ffd556c-9298-4871-84c4-3f1d9bdc0848' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '敬愛大学', updated_at = NOW()
WHERE id = 'ff45f558-f22c-4e99-bc76-1c7b679e64be' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '慶應義塾大学', updated_at = NOW()
WHERE id = 'a25f756e-206a-4f27-867b-8a1082191d32' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '恵泉女学園大学', updated_at = NOW()
WHERE id = '519e1fbc-021c-486d-b468-35ec9bc261ac' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '敬和学園大学', updated_at = NOW()
WHERE id = '676293cc-f639-4c04-8292-2d986b09f3c5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '吉備国際大学', updated_at = NOW()
WHERE id = 'c125973c-1a84-4717-834e-baa002b1ec18' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '金城学院大学', updated_at = NOW()
WHERE id = 'dee7a20f-dc0c-42ef-9525-7bca880237f4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '近畿大学', updated_at = NOW()
WHERE id = '2a27bd22-2463-45d1-883b-56240ec3030d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北九州大学', updated_at = NOW()
WHERE id = '6f7bbf91-8381-4cdf-bfe1-a536ecbb5f9c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北見工業大学', updated_at = NOW()
WHERE id = '0dea0fe8-b204-4342-8da3-4d047822bcef' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '北里大学', updated_at = NOW()
WHERE id = 'd05de7d1-ad39-4537-8440-e8316ea8b891' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸市外国語大学', updated_at = NOW()
WHERE id = '42e66d27-a01f-4781-b4da-89063efbbcff' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸芸術工科大学', updated_at = NOW()
WHERE id = '317798b4-dd3f-41d0-8cd1-1e59c41ec0f7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸学院大学', updated_at = NOW()
WHERE id = '92299d6d-7471-417e-a50c-57c18b1e4d69' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸国際大学', updated_at = NOW()
WHERE id = '65de2b0f-2c02-4dd3-b0ea-57440752cef8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸女学院大学', updated_at = NOW()
WHERE id = '3863469b-e4af-495e-86e5-c1d567b6aac6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸薬科大学', updated_at = NOW()
WHERE id = 'ecfd2051-534b-4e2e-b859-33b621f92d8a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸親和女子大学', updated_at = NOW()
WHERE id = '60402ecb-d493-438b-bec1-5c56e979a738' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸松蔭女子学院大学', updated_at = NOW()
WHERE id = '3b5ab21f-0341-43c3-8bd4-07d038cfd637' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸大学', updated_at = NOW()
WHERE id = '45150197-8690-41dc-8c85-5b20d2b7da8c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸商船大学', updated_at = NOW()
WHERE id = 'b5d3f634-05c2-470a-b3d1-8ba8cd0a8010' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '神戸女子大学', updated_at = NOW()
WHERE id = '93a5830a-8f46-40c9-b947-aef2e395a7f9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '高知医科大学', updated_at = NOW()
WHERE id = 'd7dcd873-1e79-46cb-bde4-0a3e18be00fb' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '高知大学', updated_at = NOW()
WHERE id = 'c8445152-0f1b-4798-a341-7955ee90ef48' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '高知工科大学', updated_at = NOW()
WHERE id = 'ec7f370c-9adb-4856-b519-53568fc28d5d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '高知女子大学', updated_at = NOW()
WHERE id = '589dde1b-5e84-41ca-bdc2-a3cf21096e7a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '皇學館大学', updated_at = NOW()
WHERE id = '3d36312b-6f51-4524-b434-5390939354ed' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '工学院大学', updated_at = NOW()
WHERE id = 'd7e344b7-8170-44fa-81c1-ff7f049b0830' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '光華女子大学', updated_at = NOW()
WHERE id = 'bf82c04b-a04f-4992-a465-f64e337e6219' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '國學院大學', updated_at = NOW()
WHERE id = '6968c36f-d67d-42ff-9126-7b3fae217ddf' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '国士舘大学', updated_at = NOW()
WHERE id = '2d5bf91b-b77f-4b4e-a06c-1ed352153c99' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '駒澤大学', updated_at = NOW()
WHERE id = '29f89c23-79d2-4e81-bd7d-b2becfc90a0b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '甲南大学', updated_at = NOW()
WHERE id = '778b31df-b2cb-4f2d-b762-f282f3aa2e2d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '甲南女子大学', updated_at = NOW()
WHERE id = 'd30b2e39-407c-4d81-834c-d2f75f0eeaf8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '高麗大学', updated_at = NOW()
WHERE id = '36b6a165-638c-479b-bccb-d74eaa65cd6b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '郡山女子大学', updated_at = NOW()
WHERE id = 'da9edebd-dbbc-43d5-981b-6519960174fa' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '甲子園大学', updated_at = NOW()
WHERE id = '53df87ad-d5dc-47cc-90f3-d83db6ac8a72' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '高野山大学', updated_at = NOW()
WHERE id = 'ba72b8fd-3f81-470f-9904-9ad1ef8f3062' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '熊本学園大学', updated_at = NOW()
WHERE id = '9a5ab632-66d6-449f-91bc-1b569e644684' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '熊本工業大学', updated_at = NOW()
WHERE id = '314cc27c-dce2-4085-a1a2-8ebe5115b2ae' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '熊本県立大学', updated_at = NOW()
WHERE id = '64c44796-625f-42a7-9126-85e2001cfab0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '熊本大学', updated_at = NOW()
WHERE id = '6e4f42aa-e716-4862-8d55-4a108ba35c6c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '国立音楽大学', updated_at = NOW()
WHERE id = 'aefa34bf-de37-498a-9914-9c2298523f91' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '倉敷作陽大学', updated_at = NOW()
WHERE id = 'c6381bec-cc45-4eb5-8b44-711c439bf795' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '倉敷芸術科学大学', updated_at = NOW()
WHERE id = '58c4d68a-6c21-4cae-88f5-8ee86037bfff' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '呉大学', updated_at = NOW()
WHERE id = '387a19e7-e694-4b64-8155-419e196ea630' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '久留米工業大学', updated_at = NOW()
WHERE id = 'e6eb8f19-d3b7-4d96-b1c6-3a68a425c360' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '久留米大学', updated_at = NOW()
WHERE id = 'f6ef10c0-d9be-4494-8ca9-4c90a13485ca' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '釧路公立大学', updated_at = NOW()
WHERE id = 'ae07e8f6-cfcf-40f3-a360-855117d84863' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '関西学院大学', updated_at = NOW()
WHERE id = '28ee2f34-6741-43ec-a61e-be9a9f2b9433' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '活水女子大学', updated_at = NOW()
WHERE id = 'f8180384-32be-4263-9ba5-c01996ab48df' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '杏林大学', updated_at = NOW()
WHERE id = 'eb526146-1a77-4d36-bd9d-7eb50421aed1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '共立薬科大学', updated_at = NOW()
WHERE id = '700b892a-5627-475a-9927-4ddd1c944250' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '共立女子大学', updated_at = NOW()
WHERE id = '95a2013d-275f-463a-a38b-d60ba6416466' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都文教大学', updated_at = NOW()
WHERE id = 'ff9719cc-0c43-4add-a247-48c6e3dc870f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都市立芸術大学', updated_at = NOW()
WHERE id = 'cf93ebf4-1f64-4304-bce9-73e80b79e14b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都学園大学', updated_at = NOW()
WHERE id = '57eebf92-47da-4402-a16d-e59b8d924455' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都工芸繊維大学', updated_at = NOW()
WHERE id = '004555cc-361d-4994-b573-98800e7aeef5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'ノートルダム女子大学', updated_at = NOW()
WHERE id = '56b144d7-9bcd-471c-bce9-0b6649d9ba22' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都薬科大学', updated_at = NOW()
WHERE id = '0e834924-3cfb-4429-a67d-a43bc1c0ac16' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都府立大学', updated_at = NOW()
WHERE id = 'e305638c-2565-4270-8f9e-4b8e8f836919' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都府立医科大学', updated_at = NOW()
WHERE id = '222115a5-c234-45d5-bf72-7375bf2ecfa5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都産業大学', updated_at = NOW()
WHERE id = '9d525a21-7ab3-4085-93c8-8e0d7519b0d1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都精華大学', updated_at = NOW()
WHERE id = 'c094f2bc-1560-4b2e-8eca-76aa5c2042ec' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都橘女子大学', updated_at = NOW()
WHERE id = 'a27b9b87-db1d-41a7-aec5-1947a1f24620' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都大学', updated_at = NOW()
WHERE id = '6e2549e3-3a65-49e6-901f-2dfd08a09b40' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都造形芸術大学', updated_at = NOW()
WHERE id = '6f113b62-d078-4dba-9c7a-9cee6a767337' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都教育大学', updated_at = NOW()
WHERE id = 'fc53f1e5-24a4-4329-a66c-21fd3559e0da' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都外国語大学', updated_at = NOW()
WHERE id = '713e81fe-31f6-4d8f-a910-17efb289edb0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '京都女子大学', updated_at = NOW()
WHERE id = '2932c5aa-1310-4c7f-bed4-f60679eddd0c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州歯科大学', updated_at = NOW()
WHERE id = '9394d351-973d-4cf5-b89d-91e3c86e69de' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州芸術工科大学', updated_at = NOW()
WHERE id = 'bc668223-b516-4077-a487-90a5766f7836' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州工業大学', updated_at = NOW()
WHERE id = 'c0ce4a4a-fc4f-4f59-8dce-b60069de2688' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州国際大学', updated_at = NOW()
WHERE id = 'c8b9621a-6a89-4b72-94bd-38330f00bd78' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州共立大学', updated_at = NOW()
WHERE id = '2ca52330-a54b-4022-ad11-a3ee45d967fc' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州産業大学', updated_at = NOW()
WHERE id = '353db330-682f-4684-b6d7-6cc1f4a77853' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州東海大学', updated_at = NOW()
WHERE id = '9fe9afc5-98c6-451c-80a8-ed83588a8451' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州大学', updated_at = NOW()
WHERE id = '84decd58-0b98-43ed-b8aa-889a968fa231' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州看護福祉大学', updated_at = NOW()
WHERE id = 'd64e6acc-f1b3-45d0-81e5-60c25a892ef3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '九州女子大学', updated_at = NOW()
WHERE id = 'a7d9660e-5ce0-4cc2-bc7e-7a62cf07c603' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '松本歯科大学', updated_at = NOW()
WHERE id = 'e8361529-63f0-4bae-b912-cd6aa0bf73b3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '松阪大学', updated_at = NOW()
WHERE id = '34e72521-3d8b-4fca-9f75-3ed7834adb27' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '松山大学', updated_at = NOW()
WHERE id = 'ff9d7d6f-b207-4946-9a0e-14cad9cd2744' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '明治薬科大学', updated_at = NOW()
WHERE id = '9c334305-77df-4d5f-a671-41145621c80e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '明治学院大学', updated_at = NOW()
WHERE id = '9a1765be-e685-4db3-b90d-031d8b27f726' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '明治大学', updated_at = NOW()
WHERE id = '5c93cc62-9013-4c27-9ae9-55f1ade107cf' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '明治鍼灸大学', updated_at = NOW()
WHERE id = 'bd35694c-8538-47dd-8c04-c4efcede4a87' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名城大学', updated_at = NOW()
WHERE id = 'cd22c1d8-b395-4f44-8ff8-57bf0cc47900' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '明海大学', updated_at = NOW()
WHERE id = 'e3f6245b-d902-426c-9504-5d2262133792' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名桜大学', updated_at = NOW()
WHERE id = '1081bf15-9976-4384-bfb3-3aa3b9c832ec' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '明星大学', updated_at = NOW()
WHERE id = '2dc53476-db13-48c5-bc7a-0ed60218b1ff' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '目白大学', updated_at = NOW()
WHERE id = '53ce9cbc-9129-4db1-9cc4-e8b1940a3410' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '三重大学', updated_at = NOW()
WHERE id = '54fb853b-2afd-459a-b319-89473ffdc0d2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '美作女子大学', updated_at = NOW()
WHERE id = '16a26df3-94b2-4d01-9743-c7bc14debabd' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '南九州大学', updated_at = NOW()
WHERE id = '357159bd-76d3-4b97-8308-d0a2053c5fee' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '宮城学院女子大学', updated_at = NOW()
WHERE id = 'f7070722-4f68-447a-938c-9898bdedfc7e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '宮城大学', updated_at = NOW()
WHERE id = 'a596791e-3a04-4c2b-bf99-cec6cc5d8e78' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '宮城教育大学', updated_at = NOW()
WHERE id = '2db4bbb5-14a9-4c4e-ab6a-7efc72e0b007' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '宮崎医科大学', updated_at = NOW()
WHERE id = '96d1a132-73d3-47e3-bc63-90e649f41442' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '宮崎公立大学', updated_at = NOW()
WHERE id = '8baf7aa8-d649-4389-9225-4fb1eef3d4e9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '宮崎県立看護大学', updated_at = NOW()
WHERE id = 'ac0cb206-8d1b-4c25-9f64-7aa19f60e9f0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '宮崎大学', updated_at = NOW()
WHERE id = '0810e863-c08b-42f8-8978-a7b7e046daa9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '盛岡大学', updated_at = NOW()
WHERE id = '5269cc94-9b19-4f9c-9582-b4bd4ee833b3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '武庫川女子大学', updated_at = NOW()
WHERE id = '6f38ee68-378e-493f-a28a-f1d09141f9e3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '室蘭工業大学', updated_at = NOW()
WHERE id = 'a4e34ace-bf25-4bc1-aefe-f158f62ecf18' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '武蔵工業大学', updated_at = NOW()
WHERE id = 'a5c2ebfc-efd1-489a-a0ee-710b8dff5b77' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '武蔵大学', updated_at = NOW()
WHERE id = '3069090a-2899-420d-9c32-2227ad4cbf45' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '武蔵野音楽大学', updated_at = NOW()
WHERE id = '21d768ac-2247-4516-bc04-9a406f58d543' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '武蔵野美術大学', updated_at = NOW()
WHERE id = 'e04c72d6-4c2c-49db-9556-a420aac6c07e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '武蔵野女子大学', updated_at = NOW()
WHERE id = 'bd185fd0-ff48-4cee-aaa6-571eaf468cfa' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '長野大学', updated_at = NOW()
WHERE id = '4e627abc-9c92-4854-9cd1-99ac03152d80' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '長岡技術科学大学', updated_at = NOW()
WHERE id = '6601316d-46c7-4ed5-bb7a-3715308b9ea0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '長崎総合科学大学', updated_at = NOW()
WHERE id = '7984a2b0-542d-43e8-b4ff-0f9324c7cf0e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '長崎県立大学', updated_at = NOW()
WHERE id = '455b7f01-7def-465d-9ed5-5999f1f0081c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '長崎大学', updated_at = NOW()
WHERE id = 'bee38161-a39f-4a50-9d21-775e4c8fda51' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名古屋市立大学', updated_at = NOW()
WHERE id = 'da918caa-acb1-4be5-a818-fb71a523a0cd' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名古屋経済大学', updated_at = NOW()
WHERE id = 'e153a0c2-44b7-45d2-838e-d2963a57550c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名古屋学院大学', updated_at = NOW()
WHERE id = '39acf750-08eb-4b0d-a323-2697571080cb' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名古屋工業大学', updated_at = NOW()
WHERE id = '03b4bedf-f176-4927-87f6-1e5ceacdcfc8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名古屋大学', updated_at = NOW()
WHERE id = '2e07f88e-8cee-468a-9144-387622d25528' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名古屋芸術大学', updated_at = NOW()
WHERE id = '82e3e151-7ea9-4399-872c-a180d1c52201' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名古屋商科大学', updated_at = NOW()
WHERE id = '49429347-627c-4f88-be3e-e8e7d2580358' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名古屋外国語大学', updated_at = NOW()
WHERE id = '47d5339e-22bd-4317-bad6-41f7f6060b2b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '名古屋女子大学', updated_at = NOW()
WHERE id = '33243858-09cb-4013-9fa0-4b94be895baa' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '中村学園大学', updated_at = NOW()
WHERE id = '1413767e-0a28-4cb6-b781-d5e2713bb96a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '南山大学', updated_at = NOW()
WHERE id = 'ff18e047-5954-47b9-b3fd-f01780af8c3c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '奈良先端科学技術大学院大学', updated_at = NOW()
WHERE id = 'f6bcfdc8-8ab5-48f5-b20a-5d6f6d4e4617' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '奈良医科大学', updated_at = NOW()
WHERE id = '8b9cd31b-bf3f-44ed-9d36-888c1aa725de' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '奈良産業大学', updated_at = NOW()
WHERE id = 'fe6c945d-feb1-4828-b578-8ddef1948a63' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '奈良大学', updated_at = NOW()
WHERE id = 'b564ae08-fc20-403a-b3f6-704d97759dde' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '奈良大学', updated_at = NOW()
WHERE id = '01eb7e27-fab0-44dd-a635-c8f8a84a1b33' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '奈良教育大学', updated_at = NOW()
WHERE id = '36dd736e-60c2-4ec9-971c-e2fbbb8c3dc2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '奈良女子大学', updated_at = NOW()
WHERE id = '1a621712-65fb-4911-a9c4-0af207b113da' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鳴門教育大学', updated_at = NOW()
WHERE id = 'c380a011-5f43-4842-a8ad-51893c8e84b7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '防衛医科大学校', updated_at = NOW()
WHERE id = 'e99c9b49-686e-4766-a906-ec38441332c1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '水産大学校', updated_at = NOW()
WHERE id = '3dbffe88-7d03-414b-bb88-7e81736d7e17' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鹿屋体育大学', updated_at = NOW()
WHERE id = '048989f6-8a2c-4df4-a4ee-be5da8937724' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '旭川工業高等専門学校', updated_at = NOW()
WHERE id = '88f4819c-d0ff-4ddb-a077-f316e92eaf2b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本福祉大学', updated_at = NOW()
WHERE id = '34a1c411-cf21-4b5a-bb5b-d925922e9429' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本大学', updated_at = NOW()
WHERE id = '55bd15a7-252f-4a8c-b062-81c0bd0316c8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '新潟薬科大学', updated_at = NOW()
WHERE id = '13ca65a7-191f-434f-b6d5-fef5173673bd' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '新潟産業大学', updated_at = NOW()
WHERE id = '67cab6cb-ddee-4db3-84be-4ea5ce51b3c3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '新潟大学', updated_at = NOW()
WHERE id = 'e320a76b-5465-4281-a7c0-3c9ca8d9a7c1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '新潟国際情報大学', updated_at = NOW()
WHERE id = 'ac643836-eab2-426b-85ff-945240b6862e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '新潟経営大学', updated_at = NOW()
WHERE id = 'cd5b17c6-b6c6-46eb-a3d8-494b88c771c6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本文理大学', updated_at = NOW()
WHERE id = '8c238eb8-f185-4910-998b-f222a94ebf97' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本歯科大学', updated_at = NOW()
WHERE id = 'b1fd7444-821d-4019-af18-e6eca078018c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本工業大学', updated_at = NOW()
WHERE id = '375a70b7-3f2b-4bbb-9ccd-3c92317afe2c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本医科大学', updated_at = NOW()
WHERE id = '6c18d2e8-7d95-4cef-bfad-0dfb6be93343' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本体育大学', updated_at = NOW()
WHERE id = 'dcc3c442-6370-4b29-b88a-3b418b3a46de' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '日本獣医生命科学大学', updated_at = NOW()
WHERE id = '79af4a26-e33c-45c8-b73b-d90ca5dcab26' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '西九州大学', updated_at = NOW()
WHERE id = '6441b43a-5d05-47ad-b211-335ccacdb861' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '西日本工業大学', updated_at = NOW()
WHERE id = '8377dfa8-e609-4caf-a4f3-7ea8a5e4a612' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '二松学舎大学', updated_at = NOW()
WHERE id = 'b01836f2-529b-4b85-8cc6-2f3bfea82643' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'ノートルダム清心女子大学', updated_at = NOW()
WHERE id = '6a085251-53c8-4730-ad97-ea8505f5d328' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '帯広畜産大学', updated_at = NOW()
WHERE id = '691744bc-8caa-4c23-9f9b-cbb2cf30e857' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '桜美林大学', updated_at = NOW()
WHERE id = 'c4179622-07fb-42bf-9347-881f1715f7fb' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'お茶の水女子大学', updated_at = NOW()
WHERE id = '2cdfbd4d-7e96-42b9-96b2-706c59ee9af3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '桜花学園大学', updated_at = NOW()
WHERE id = '9de86c30-2e8f-4d71-9c12-89d3927ecc02' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大谷女子大学', updated_at = NOW()
WHERE id = 'fa43fde8-b975-4b03-b085-4de2cafb3017' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '奥羽大学', updated_at = NOW()
WHERE id = 'ba960fc2-01cc-4d57-a967-c08979303534' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大分医科大学', updated_at = NOW()
WHERE id = 'b425ba29-ba40-41e6-be25-6fc1fa8c4e3f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大分大学', updated_at = NOW()
WHERE id = '569ab37f-a361-4e64-9d87-1cef486d0c49' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大分県立看護科学大学', updated_at = NOW()
WHERE id = 'f543e992-81b1-4f14-b703-847f771372ce' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岡山県立大学', updated_at = NOW()
WHERE id = '2b456d13-0157-48f6-a61e-430891a674a8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岡山商科大学', updated_at = NOW()
WHERE id = 'a0b778c3-e76d-4799-b85e-acbc4cdadbb7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岡山大学', updated_at = NOW()
WHERE id = '571a6d4f-3dbd-4dcc-904c-a011bb743614' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '岡山理科大学', updated_at = NOW()
WHERE id = '88ae7dbf-acee-4f57-aee2-820a65b53ce8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '沖縄科学技術大学院大学', updated_at = NOW()
WHERE id = '3b8dc976-f404-4bfc-aaf0-0cb48290b7fc' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '沖縄国際大学', updated_at = NOW()
WHERE id = '6f3ec6a9-14f8-4999-b14a-3bcf146b7b5d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '沖縄県立芸術大学', updated_at = NOW()
WHERE id = '6af92c59-b290-4449-bafb-6fecc5b025a9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '沖縄大学', updated_at = NOW()
WHERE id = '2f0eb6cc-ac1e-4346-9b0f-69c64136f7d5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪市立大学', updated_at = NOW()
WHERE id = 'a501c352-48ac-4a5c-b746-a77ab4fa9624' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪音楽大学', updated_at = NOW()
WHERE id = '163586b4-1929-41e3-b8ef-277da0f88fe8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪歯科大学', updated_at = NOW()
WHERE id = '834cd3e2-c647-4048-a7f8-0a2493448f1d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪電気通信大学', updated_at = NOW()
WHERE id = '1f4cff89-f121-4e48-9080-e6bdf15904fe' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪学院大学', updated_at = NOW()
WHERE id = '34121cf5-842f-4d68-b409-f0a7e02701f7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪工業大学', updated_at = NOW()
WHERE id = 'ac344514-f74a-4334-9d8c-e35bd98c975b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪国際大学', updated_at = NOW()
WHERE id = '8e7c5fa7-18d3-4bba-be80-be14e65c0b7b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪国際女子大学', updated_at = NOW()
WHERE id = '3b8b208c-441c-4edb-b690-9487397b29a6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪女学院大学', updated_at = NOW()
WHERE id = 'd25d4207-81e2-4320-9099-b177d0158af2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪医科大学', updated_at = NOW()
WHERE id = '5c89d1fc-2c3a-4e47-a43c-abd277a1f5ef' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪府立大学', updated_at = NOW()
WHERE id = '8f72530c-5b62-4bf7-9633-ef77fe30d861' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪産業大学', updated_at = NOW()
WHERE id = 'c2c1356a-f766-4d78-9ffd-2aa7496bdd18' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪樟蔭女子大学', updated_at = NOW()
WHERE id = 'f6cab3f2-3596-43b2-92ab-7417f5bc9b11' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪大学', updated_at = NOW()
WHERE id = '2d9fe440-2375-451a-9e8d-24c31b43511c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪芸術大学', updated_at = NOW()
WHERE id = '39e36136-2e32-4ab3-8a5a-11501501d9d3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪商業大学', updated_at = NOW()
WHERE id = 'd09a4adb-25ad-4f2d-9f4f-8cfba087608e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪経済大学', updated_at = NOW()
WHERE id = '36b83f49-83e9-491a-8f6b-d5f5bbed3554' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪経済法科大学', updated_at = NOW()
WHERE id = 'b081d33e-43e8-459a-aa19-74f4fa69718c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪教育大学', updated_at = NOW()
WHERE id = 'f8c5b78c-3982-4619-8ef9-00fbff1f1053' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪外国語大学', updated_at = NOW()
WHERE id = '7fac597b-b04b-4ae3-b1d9-0295f89b0462' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪体育大学', updated_at = NOW()
WHERE id = '341bc5b3-2cf9-421a-a59d-28b9d2d2a1f0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪薬科大学', updated_at = NOW()
WHERE id = '39e767f3-b038-42f6-8bd2-f04852caea21' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大阪女子大学', updated_at = NOW()
WHERE id = '4f990c05-9140-4e63-88f1-382eb390a97e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大谷大学', updated_at = NOW()
WHERE id = '53f6401e-ebcb-41b0-a9f6-19e9d6f78021' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '小樽商科大学', updated_at = NOW()
WHERE id = 'a1fb9d33-bdd5-4a0d-b7b5-42701a0747e9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大手前大学', updated_at = NOW()
WHERE id = '2277f668-f8e1-468d-a69a-457b4ca9557d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '追手門学院大学', updated_at = NOW()
WHERE id = '879ab5c5-7f9e-4e82-bff4-8409125f1412' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大妻女子大学', updated_at = NOW()
WHERE id = '61b894c9-04d1-47cd-8bf7-2caaaaf9fa44' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'ポリテクニック大学', updated_at = NOW()
WHERE id = '5c359f1e-81f7-4af0-b82b-daff9a4b81e5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'プール学院大学', updated_at = NOW()
WHERE id = 'a2da0948-8ac2-4ab1-a0f8-ac0f823d74bc' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '酪農学園大学', updated_at = NOW()
WHERE id = '942030ba-fa65-4254-b0cb-e2437986c46b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '麗澤大学', updated_at = NOW()
WHERE id = 'e6127661-91f8-40eb-bbe9-1cdb0899ad61' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '立教大学', updated_at = NOW()
WHERE id = '12b2d5e8-0f1a-4717-87c6-489e07c8a638' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '立正大学', updated_at = NOW()
WHERE id = 'fc53a9a2-5999-4167-8d2a-c8b79c7437c5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '立命館アジア太平洋大学', updated_at = NOW()
WHERE id = 'a7e66ed2-3d4d-43f2-b3c9-fcb4f5242f00' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '立命館大学', updated_at = NOW()
WHERE id = '92a5b157-801f-45fb-b279-aee02ecfc4b2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '龍谷大学', updated_at = NOW()
WHERE id = '7243302f-9427-46c6-8bf8-918db7d4a3c0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '流通経済大学', updated_at = NOW()
WHERE id = 'c88305b0-1109-4ea4-bd35-5c3ec0de2e16' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '佐賀医科大学', updated_at = NOW()
WHERE id = 'cfd89f09-1422-4493-a192-015224dbf27c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '佐賀大学', updated_at = NOW()
WHERE id = '54ec0dde-dbee-4b9e-adb0-d24688b74ad3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '相模女子大学', updated_at = NOW()
WHERE id = '38a905e8-4db1-4645-8bcd-645314edbb56' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '埼玉工業大学', updated_at = NOW()
WHERE id = 'dd67c956-f138-49b6-b3e6-6eacaca8b2c8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '埼玉医科大学', updated_at = NOW()
WHERE id = '45b1987f-2e62-4563-b419-9f601b29ecd0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '埼玉県立大学', updated_at = NOW()
WHERE id = '6e9c59df-3434-41fa-8798-38bc439acf9f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '埼玉大学', updated_at = NOW()
WHERE id = '941b5388-7d81-4863-aefb-f2f944d39d83' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '作新学院大学', updated_at = NOW()
WHERE id = '12212a8b-7001-4690-8c7b-c5987fbcb7ac' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '産経大学', updated_at = NOW()
WHERE id = 'dabd756c-2476-4658-8308-663ec3ff42d1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '産能大学', updated_at = NOW()
WHERE id = 'ff0c9fa3-c1c7-4512-ac41-b8fe4acfc264' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '山陽学園大学', updated_at = NOW()
WHERE id = 'f4371b98-34b6-4209-a85c-b18c27213575' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '札幌学院大学', updated_at = NOW()
WHERE id = 'e8cde6d6-81df-4547-af5a-b52ddc8ef53c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '札幌国際大学', updated_at = NOW()
WHERE id = 'bb1aaf78-bbfd-40e5-be24-deca25ceb0e1' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '札幌医科大学', updated_at = NOW()
WHERE id = 'cf584eb3-41f1-4715-b18c-b3856304e507' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '札幌大学', updated_at = NOW()
WHERE id = '9638a314-a56a-4b96-b49a-270153938fc4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京理科大学', updated_at = NOW()
WHERE id = '9e545f03-943c-475c-9d30-8b768060b39b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '山口東京理科大学', updated_at = NOW()
WHERE id = '30ec532d-3cc9-482c-aa10-fbff2afc0b5d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '成安造形大学', updated_at = NOW()
WHERE id = '1aa65c26-5537-465b-a5db-74205a9a0ada' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '聖学院大学', updated_at = NOW()
WHERE id = '5d681c7d-4f1a-4c33-b35b-2f4c7e834f9d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '成城大学', updated_at = NOW()
WHERE id = '17a74d65-6b99-4682-a9e7-c25fb923f47b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '成蹊大学', updated_at = NOW()
WHERE id = 'a6f92bc8-1132-4be4-bb9e-a8c9c0efd47a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '西南学院大学', updated_at = NOW()
WHERE id = '512e96f1-c673-4c53-9732-d20bf172871c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '清泉女子大学', updated_at = NOW()
WHERE id = '35bc2ac7-f5c0-4c09-8fd0-931657141610' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '聖和大学', updated_at = NOW()
WHERE id = 'c6464385-68cd-4c49-82d2-5f867a7f289b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '仙台大学', updated_at = NOW()
WHERE id = '8ac0f1be-10c7-4fd7-b65e-4693898f06d7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '専修大学', updated_at = NOW()
WHERE id = '1fb985c4-4670-419a-80b1-9ab9e8978b0a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '洗足学園音楽大学', updated_at = NOW()
WHERE id = 'cd8b1be7-27bb-4663-9927-b26bbb6060ca' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '摂南大学', updated_at = NOW()
WHERE id = '3d9a3fff-bfcd-47a6-bc5d-2d290e0b7d11' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '芝浦工業大学', updated_at = NOW()
WHERE id = '19feed2b-3b74-44e7-94fd-83e36642c9b2' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '滋賀県農業技術振興センター', updated_at = NOW()
WHERE id = 'effa896b-688c-4b28-8ce2-04dbefedbefa' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '滋賀大学', updated_at = NOW()
WHERE id = 'fd12ae2a-56fd-4465-90e5-283031dfc738' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '滋賀医科大学', updated_at = NOW()
WHERE id = 'd5cfdefa-937b-44af-b45a-0a85e611eaeb' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '四国学院大学', updated_at = NOW()
WHERE id = '30048cfa-8c7f-45bc-9b3d-f93d8049ebe8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '四国大学', updated_at = NOW()
WHERE id = '44b7b0ed-cf83-4b0e-9e36-dc57fcb6d222' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '島根大学', updated_at = NOW()
WHERE id = '2b7bc8e0-c58a-411c-90ed-7d7426b7c59e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '島根医科大学', updated_at = NOW()
WHERE id = '0bcdbcd7-f380-4f9e-b334-878454bd4ca7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '下関市立大学', updated_at = NOW()
WHERE id = '298aa56b-67ed-407b-9324-1766ca920d50' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '信州大学', updated_at = NOW()
WHERE id = '89f19f2b-c41e-46cb-b5ac-4ef79d32e716' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '白百合女子大学', updated_at = NOW()
WHERE id = '8ec2792c-b323-4e9e-bbee-4b425fdc9c11' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '静岡県立大学', updated_at = NOW()
WHERE id = 'fa804add-d730-4102-9524-c3c186f668ef' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '静岡産業大学', updated_at = NOW()
WHERE id = '6fd21efd-8333-4f0b-8fef-53a66a0e780d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '静岡大学', updated_at = NOW()
WHERE id = '47f4370f-451c-4b4b-8058-bf83f7eefd83' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '尚絅大学', updated_at = NOW()
WHERE id = 'e8f12d0e-049d-4c07-b1b1-1bc8a51addef' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '湘南工科大学', updated_at = NOW()
WHERE id = 'ff0fce62-2e0c-45a1-97d1-0db02c564dcc' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '昭和薬科大学', updated_at = NOW()
WHERE id = 'ea8fa454-0633-43a3-9e3f-d0e0ab6f4a45' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '昭和大学', updated_at = NOW()
WHERE id = 'ce0aabf2-ff28-43e9-b658-6d7b38efab69' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '昭和女子大学', updated_at = NOW()
WHERE id = '46d3e5e7-4423-471a-a002-046e75168787' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '種智院大学', updated_at = NOW()
WHERE id = '23fdc8c0-f41b-4a70-93ab-e11bd4230b10' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '就実女子大学', updated_at = NOW()
WHERE id = '6c932ad6-49d3-46a2-85b5-cc8edee90a78' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '淑徳大学', updated_at = NOW()
WHERE id = '23e2097b-a0d5-4e0f-a211-e0bf9dd5012a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '秀明大学', updated_at = NOW()
WHERE id = '90d3f436-5530-44d0-88c2-ba4b98d665d6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '長崎シーボルト大学', updated_at = NOW()
WHERE id = '4c6a89bd-4aaf-4a22-b76f-dbbceb0b9c1c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '相愛大学', updated_at = NOW()
WHERE id = '19344ecd-971a-4a8d-8d12-2cf6242722d6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '創価大学', updated_at = NOW()
WHERE id = 'e44e2a35-73c3-4b41-842d-dd72b2e14b6a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '園田女子大学', updated_at = NOW()
WHERE id = '35446f53-ac1e-4b2f-a131-db905c227055' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '上智大学', updated_at = NOW()
WHERE id = '60b1b727-2076-441f-a6cf-47a3b017040d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '聖アンデレ大学', updated_at = NOW()
WHERE id = 'b0632cff-15b8-4a8d-93a2-b732cd341c32' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '聖路加看護大学', updated_at = NOW()
WHERE id = 'f4373912-67d4-4cb4-bfda-6ba9626081f3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '聖マリアンナ医科大学', updated_at = NOW()
WHERE id = 'd09817d9-6322-4d2b-bf59-3c2d6e3003fe' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '杉野女子大学', updated_at = NOW()
WHERE id = '1441bf6f-cb16-4fe1-a430-b2f65beb6476' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '椙山女学園大学', updated_at = NOW()
WHERE id = '7368e5fd-b4ff-4f41-84e8-3fdbe09fcbcf' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '駿河台大学', updated_at = NOW()
WHERE id = '2a8c11ea-4ed1-497c-997d-a102e1550bd9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鈴鹿国際大学', updated_at = NOW()
WHERE id = 'b6fcaf3c-b68d-45a4-beb5-5832eef66423' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鈴鹿医療科学大学', updated_at = NOW()
WHERE id = '8df69084-2b47-400e-a209-0ee468046ee6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '大正大学', updated_at = NOW()
WHERE id = 'f69aa746-715a-46b0-b52f-6f4ddeae98fb' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '高千穂大学', updated_at = NOW()
WHERE id = '84041199-0eec-4cc1-9dd3-b749cc8a0b92' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '高松大学', updated_at = NOW()
WHERE id = '940497d5-ea06-44ae-a83b-347184a85af6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '宝塚造形芸術大学', updated_at = NOW()
WHERE id = '82a86694-3905-4862-85e2-f34430a461af' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '高崎経済大学', updated_at = NOW()
WHERE id = '319fbc65-0b89-4ee8-8b65-7f666fe3d99a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '拓殖大学', updated_at = NOW()
WHERE id = '37e93a78-e938-444a-9458-f844ae7c82c0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '多摩美術大学', updated_at = NOW()
WHERE id = '7790fc85-4a43-4fc9-913a-fe9adb17b1ab' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '多摩大学', updated_at = NOW()
WHERE id = 'ca8def18-175d-404d-afec-c82afcc8680d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '玉川大学', updated_at = NOW()
WHERE id = '2ab18259-0d07-46c8-8a1a-4ad2d207438a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '帝京平成大学', updated_at = NOW()
WHERE id = '260aeede-179e-476c-b08f-4b115a23920a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '帝京科学大学', updated_at = NOW()
WHERE id = 'd1062ce5-e4d1-4cc9-9ff3-65238c473475' AND country_code = 'JP';
UPDATE universities 
SET name_ja = 'テンプル大学ジャパン', updated_at = NOW()
WHERE id = '09d2b8a1-724f-4e17-bbba-d1067c8505e5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '天理大学', updated_at = NOW()
WHERE id = '99c90c89-e815-48ec-bf63-7fec9978524f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '帝塚山学院大学', updated_at = NOW()
WHERE id = 'a77e9d25-73a6-42d9-9c1f-4e04c74b60f5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '帝塚山大学', updated_at = NOW()
WHERE id = '8de77829-ecca-4969-8a58-d6594592efed' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東邦音楽大学', updated_at = NOW()
WHERE id = 'ca758910-e130-4dc9-9486-2b6702b14864' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東邦音楽大学', updated_at = NOW()
WHERE id = 'e2df1425-cba5-44dd-bc8f-1679c865e7c6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東邦大学', updated_at = NOW()
WHERE id = '2fb47a38-2a9a-431f-ab14-d8a2682a1ec8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東北文化学園大学', updated_at = NOW()
WHERE id = 'c1906584-8bac-4ee1-82e2-300740474a8d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東北薬科大学', updated_at = NOW()
WHERE id = 'b745c156-7f8f-4a7a-aea3-62b0086a3726' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東北福祉大学', updated_at = NOW()
WHERE id = 'a76ccb7f-db54-4cf2-93c0-7a9d83442a8e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東北学院大学', updated_at = NOW()
WHERE id = 'e970e2f4-43b8-413f-ba89-3241c9a512de' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東北工業大学', updated_at = NOW()
WHERE id = '3fa50a0c-2735-4873-9562-cc7f07c7a6f9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東北大学', updated_at = NOW()
WHERE id = '4b605a65-5ffb-4bb0-9670-683c4056250e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東北芸術工科大学', updated_at = NOW()
WHERE id = '0d58b048-2f7d-4100-a16d-a244e267590a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東北女子大学', updated_at = NOW()
WHERE id = '79847a11-eeea-4624-afed-159d8c0e92f6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東和大学', updated_at = NOW()
WHERE id = '573abe54-d928-4c4f-8fcf-d2cc50b278af' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '桐蔭横浜大学', updated_at = NOW()
WHERE id = '4105b4e6-85a4-4fd2-b437-8fb3313d5c3d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東海学園大学', updated_at = NOW()
WHERE id = 'ce6fd746-19a7-4452-9c2b-694c27d89237' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東海大学', updated_at = NOW()
WHERE id = '5d3f1a56-0c41-443d-a20e-d53cc5b774c8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東海女子大学', updated_at = NOW()
WHERE id = '903ad182-07e6-4fe7-b20c-79dbc9d83a07' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '常磐大学', updated_at = NOW()
WHERE id = 'cb91a348-3a79-4471-aa53-ac4a7b7c14d4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '常葉学園大学', updated_at = NOW()
WHERE id = '25db46d0-73a3-4387-ac67-446c946dd64d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '徳島文理大学', updated_at = NOW()
WHERE id = 'c19f3fc4-ece8-4004-b1dc-b410faa6345c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '徳島大学', updated_at = NOW()
WHERE id = '0f7e66a2-26d6-4ac9-a1da-a6d13406f33e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '徳山大学', updated_at = NOW()
WHERE id = 'b37233d2-c9bb-4b95-ba87-898b1bc3516c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京音楽大学', updated_at = NOW()
WHERE id = 'ff5e6cbf-de2a-4ad9-b1ed-7aef7b647397' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京電機大学', updated_at = NOW()
WHERE id = 'b4b615b1-e11e-4f24-a745-a3a7b16aa065' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京歯科大学', updated_at = NOW()
WHERE id = 'eea17ce7-92a2-4c4f-98f7-9de370a66524' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京工科大学', updated_at = NOW()
WHERE id = '46889b49-72c5-4966-a9b0-e0824aebf037' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京学芸大学', updated_at = NOW()
WHERE id = 'bc205c31-cfe4-420d-9e20-70b04c414525' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京工芸大学', updated_at = NOW()
WHERE id = '29c5040f-be37-4cc4-a0e3-d4fa65512d55' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京工業大学', updated_at = NOW()
WHERE id = '4f7e2a66-679d-47b5-b595-5e7c0fb979ce' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京国際大学', updated_at = NOW()
WHERE id = '9d2a21b7-4e8e-4bc2-94df-e150c6e39746' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京家政大学', updated_at = NOW()
WHERE id = '92f0a9d0-51a1-4574-889e-4da5eaac86f5' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京経済大学', updated_at = NOW()
WHERE id = '4efc788d-6497-4f04-a924-50fc113879c0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京医科歯科大学', updated_at = NOW()
WHERE id = '761e3829-e173-4d80-a670-ddd784c3ca00' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京医科大学', updated_at = NOW()
WHERE id = '89b28b1a-993b-42a1-a601-fb283e550c91' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京都立科学技術大学', updated_at = NOW()
WHERE id = '64ad8873-d520-4e3a-970c-58344ec1fa5f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京都立大学', updated_at = NOW()
WHERE id = '40ddd757-3b9e-4e81-8f6f-a6ed43416a03' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京都立保健科学大学', updated_at = NOW()
WHERE id = 'a2c63bf5-0d71-43d3-88f7-dba9f30f6e20' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京芸術大学', updated_at = NOW()
WHERE id = '04e84ba3-07dc-4375-a7f9-ebf28de4d71a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京農業大学', updated_at = NOW()
WHERE id = 'd0a10beb-6c11-43d1-9f8b-6f31d248ff1d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京農工大学', updated_at = NOW()
WHERE id = '50dfb064-81e4-439d-ac8f-4ca6722f3646' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京造形大学', updated_at = NOW()
WHERE id = '1a14fc00-7231-49f6-8dbb-435d7d3efbbc' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京水産大学', updated_at = NOW()
WHERE id = '7122fa01-521b-4a6c-b0ea-c7c8af83d006' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京外国語大学', updated_at = NOW()
WHERE id = '208a462b-fcf3-4232-9e5f-0adb3001c6f3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京情報大学', updated_at = NOW()
WHERE id = '1a781bb8-d1e7-4dfa-a5c9-399650ab58b9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京商船大学', updated_at = NOW()
WHERE id = '8c122c83-eee9-4630-9683-ceb79e90f016' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京薬科大学', updated_at = NOW()
WHERE id = 'ef4adee3-d9b5-47ce-b4af-ffa756067dc6' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京女子大学', updated_at = NOW()
WHERE id = 'a243d22f-2ab3-41de-89aa-2aed923905c3' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京女子体育大学', updated_at = NOW()
WHERE id = '99e8646c-709b-467f-9894-62474b745fe4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京女子医科大学', updated_at = NOW()
WHERE id = '9a67c63d-fc59-4bb0-af9a-1c3f9c41ad57' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '苫小牧駒澤大学', updated_at = NOW()
WHERE id = '9847c411-d20a-44de-b099-50933d22566e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鳥取大学', updated_at = NOW()
WHERE id = 'cb05ab2c-9527-4dd6-a787-8a035e5a763f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鳥取環境大学', updated_at = NOW()
WHERE id = '8e368d8a-8b3a-42c2-9777-0847c0f04ddc' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '富山医科薬科大学', updated_at = NOW()
WHERE id = 'd23e4d75-84de-4d04-81a3-2be55887ea63' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '富山県立大学', updated_at = NOW()
WHERE id = '41c771c8-3abc-4361-9e23-5be5b69fc7af' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '富山大学', updated_at = NOW()
WHERE id = '5586ec76-9617-47de-b3b9-ef29222454cf' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '富山国際大学', updated_at = NOW()
WHERE id = '80afa834-4e4e-4ebf-a0c0-384339340da4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東洋英和女学院大学', updated_at = NOW()
WHERE id = '6168153b-f5ab-4ae4-8dcd-2d12fb7a6168' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東洋学園大学', updated_at = NOW()
WHERE id = 'e01d4a05-e71d-454f-ace8-4c356d82c885' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東洋大学', updated_at = NOW()
WHERE id = 'dc3e5731-a934-47a2-8651-3b65765cb17e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '豊橋技術科学大学', updated_at = NOW()
WHERE id = '0be1bcdc-2c0d-427f-8713-c2cc0f89da9c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '豊田工業大学', updated_at = NOW()
WHERE id = '3f7fa647-5763-4975-a9f7-4d8032bcbb9f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '津田塾大学', updated_at = NOW()
WHERE id = '0effbc88-3cc9-4650-89b5-e2b36bfd671a' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '筑波大学', updated_at = NOW()
WHERE id = '2e55d102-decd-4f0a-bad1-b6ef9555d203' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '都留文科大学', updated_at = NOW()
WHERE id = '88085ff7-e8a8-4d5b-bfd7-5429c58ce24e' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '鶴見大学', updated_at = NOW()
WHERE id = '5cb33b2a-d1df-4670-9796-af7cb8e195c7' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '上野学園大学', updated_at = NOW()
WHERE id = '2f601d55-e64a-47be-8158-b71fed07ff01' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '国連大学', updated_at = NOW()
WHERE id = 'c8fd531c-0320-40fa-9cab-f053f65e76d0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '会津大学', updated_at = NOW()
WHERE id = 'b125522e-8621-4444-8b2b-c39ad2cac804' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '文教大学', updated_at = NOW()
WHERE id = '55531101-e74f-446b-9380-9b95a41b2991' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東亜大学', updated_at = NOW()
WHERE id = '94ce8949-3206-4140-bcd5-2956e9ffab61' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '電気通信大学', updated_at = NOW()
WHERE id = 'fa8d5996-6c45-4849-b16a-3904d2060e1b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '流通科学大学', updated_at = NOW()
WHERE id = 'a5e68850-dff6-465f-a8c4-feecff6648db' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '産業医科大学', updated_at = NOW()
WHERE id = '8e68db43-0587-4835-a867-7661ee9e61bb' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '滋賀県立大学', updated_at = NOW()
WHERE id = 'c439e54f-8670-44bc-b4e5-cf7a36bd0b44' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '放送大学', updated_at = NOW()
WHERE id = '7a7566f4-bafb-48db-bdc6-dc2f489d768c' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '琉球大学', updated_at = NOW()
WHERE id = '66ae00fb-a0d2-444d-b6fc-e2296134efbe' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '聖心女子大学', updated_at = NOW()
WHERE id = '1d484c76-c769-40e3-bbec-4bda093536ec' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '東京大学', updated_at = NOW()
WHERE id = '5009c0b3-5c75-4c76-a498-534ddbe7c0e8' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '宇都宮大学', updated_at = NOW()
WHERE id = '0ac71d8b-2b8a-4544-9c6f-148312efa869' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '和歌山医科大学', updated_at = NOW()
WHERE id = '0609c621-475c-4acb-bea8-a6f46f520150' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '和歌山大学', updated_at = NOW()
WHERE id = '5ee52f31-ba59-4f50-9832-50d61eae7399' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '稚内北星学園大学', updated_at = NOW()
WHERE id = '0ded12a0-e611-4f14-9dc7-06e5ffaf39a0' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '和光大学', updated_at = NOW()
WHERE id = 'c4344fef-e591-4e79-b053-ef177db34ed9' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '早稲田大学', updated_at = NOW()
WHERE id = 'e47d4a08-e91a-4f24-9e00-cd056b4d2131' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '和洋女子大学', updated_at = NOW()
WHERE id = 'a1ddc9e5-6ba8-4923-8e95-509c6d8b654b' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '女子美術大学', updated_at = NOW()
WHERE id = 'cdd275e5-793f-4a0b-aec9-7b5c938e9d97' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '山形大学', updated_at = NOW()
WHERE id = 'd16d002a-0ab7-4e04-a7ca-94cd6d43702f' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '山口県立大学', updated_at = NOW()
WHERE id = 'b3b9ce9f-4614-4bfe-a1c8-ce7c55d83d20' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '山口大学', updated_at = NOW()
WHERE id = 'e248fe26-17ff-4a39-9e7f-2ce17c267a66' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '山梨学院大学', updated_at = NOW()
WHERE id = '545c9128-c2b2-4795-83d7-2298b6e162da' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '山梨医科大学', updated_at = NOW()
WHERE id = '006ecf89-8bbf-43ca-823b-a242e0307cd4' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '山梨大学', updated_at = NOW()
WHERE id = 'c93db332-a37b-47c8-a5f0-cc5e6106e57d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '安田女子大学', updated_at = NOW()
WHERE id = '460c615c-bd2a-45d9-8989-7dba0298a19d' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '四日市大学', updated_at = NOW()
WHERE id = 'bb921385-4b79-4615-aff8-0fbf30c4d989' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '横浜市立大学', updated_at = NOW()
WHERE id = '28818ddd-dc50-46dd-9d10-89e156861664' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '横浜商科大学', updated_at = NOW()
WHERE id = 'bebc4e4d-f4d0-40d7-be4d-bbcd70b4f8ce' AND country_code = 'JP';
UPDATE universities 
SET name_ja = '横浜国立大学', updated_at = NOW()
WHERE id = 'fbddb9fc-0e81-4136-93cd-618da75ee917' AND country_code = 'JP';

COMMIT;

-- 更新された件数を確認
SELECT COUNT(*) as updated_count
FROM universities
WHERE country_code = 'JP' AND name_ja IS NOT NULL;