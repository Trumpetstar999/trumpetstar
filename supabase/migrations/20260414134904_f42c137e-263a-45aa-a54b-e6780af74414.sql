-- Auto-link QR codes to videos based on level + sort_order mapping
-- Band 1: Level 1 (V001-V032)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V001' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V002' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V003' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V004' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V005' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V006' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 7 AND is_active = true LIMIT 1) WHERE code = 'V007' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 8 AND is_active = true LIMIT 1) WHERE code = 'V008' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 9 AND is_active = true LIMIT 1) WHERE code = 'V009' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 10 AND is_active = true LIMIT 1) WHERE code = 'V010' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 11 AND is_active = true LIMIT 1) WHERE code = 'V011' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 12 AND is_active = true LIMIT 1) WHERE code = 'V012' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 14 AND is_active = true LIMIT 1) WHERE code = 'V014' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 15 AND is_active = true LIMIT 1) WHERE code = 'V015' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 16 AND is_active = true LIMIT 1) WHERE code = 'V016' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 18 AND is_active = true LIMIT 1) WHERE code = 'V018' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 19 AND is_active = true LIMIT 1) WHERE code = 'V019' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 20 AND is_active = true LIMIT 1) WHERE code = 'V020' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 22 AND is_active = true LIMIT 1) WHERE code = 'V022' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 23 AND is_active = true LIMIT 1) WHERE code = 'V023' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 24 AND is_active = true LIMIT 1) WHERE code = 'V024' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 26 AND is_active = true LIMIT 1) WHERE code = 'V026' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 27 AND is_active = true LIMIT 1) WHERE code = 'V027' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 28 AND is_active = true LIMIT 1) WHERE code = 'V028' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 29 AND is_active = true LIMIT 1) WHERE code = 'V029' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 30 AND is_active = true LIMIT 1) WHERE code = 'V030' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 31 AND is_active = true LIMIT 1) WHERE code = 'V031' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 32 AND is_active = true LIMIT 1) WHERE code = 'V032' AND video_id IS NULL;

-- Band 1: Level 2 (V033-V037)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6bed0cd2-6f4f-4c23-ad9c-f0c8c486c5a9' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V033' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6bed0cd2-6f4f-4c23-ad9c-f0c8c486c5a9' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V034' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6bed0cd2-6f4f-4c23-ad9c-f0c8c486c5a9' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V035' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6bed0cd2-6f4f-4c23-ad9c-f0c8c486c5a9' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V036' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6bed0cd2-6f4f-4c23-ad9c-f0c8c486c5a9' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V037' AND video_id IS NULL;

-- Band 1: Level 3 (V039-V044)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c10f6574-07ba-4dd8-8a05-68008e9b49fb' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V039' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c10f6574-07ba-4dd8-8a05-68008e9b49fb' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V040' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c10f6574-07ba-4dd8-8a05-68008e9b49fb' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V041' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c10f6574-07ba-4dd8-8a05-68008e9b49fb' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V042' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c10f6574-07ba-4dd8-8a05-68008e9b49fb' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V043' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c10f6574-07ba-4dd8-8a05-68008e9b49fb' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V044' AND video_id IS NULL;

-- Band 1: Level 4 (V047-V052)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '596415f4-8757-4856-94db-6dc6741d3b35' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V047' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '596415f4-8757-4856-94db-6dc6741d3b35' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V048' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '596415f4-8757-4856-94db-6dc6741d3b35' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V049' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '596415f4-8757-4856-94db-6dc6741d3b35' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V050' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '596415f4-8757-4856-94db-6dc6741d3b35' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V051' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '596415f4-8757-4856-94db-6dc6741d3b35' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V052' AND video_id IS NULL;

-- Band 1: Level 5 (V053-V058)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '5c2dd55a-196e-4711-8bdb-c00423214084' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V053' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '5c2dd55a-196e-4711-8bdb-c00423214084' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V054' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '5c2dd55a-196e-4711-8bdb-c00423214084' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V055' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '5c2dd55a-196e-4711-8bdb-c00423214084' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V056' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '5c2dd55a-196e-4711-8bdb-c00423214084' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V057' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '5c2dd55a-196e-4711-8bdb-c00423214084' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V058' AND video_id IS NULL;

-- Band 1: Level 6 (V059-V064)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '77ee1028-5b70-424c-8570-ae3aadfb8ce1' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V059' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '77ee1028-5b70-424c-8570-ae3aadfb8ce1' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V060' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '77ee1028-5b70-424c-8570-ae3aadfb8ce1' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V061' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '77ee1028-5b70-424c-8570-ae3aadfb8ce1' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V062' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '77ee1028-5b70-424c-8570-ae3aadfb8ce1' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V063' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '77ee1028-5b70-424c-8570-ae3aadfb8ce1' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V064' AND video_id IS NULL;

-- Band 1: Level 7 (V068-V073)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6e474e5d-077c-480f-9838-a26fc003bb1a' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V068' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6e474e5d-077c-480f-9838-a26fc003bb1a' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V069' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6e474e5d-077c-480f-9838-a26fc003bb1a' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V070' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6e474e5d-077c-480f-9838-a26fc003bb1a' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V071' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6e474e5d-077c-480f-9838-a26fc003bb1a' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V072' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6e474e5d-077c-480f-9838-a26fc003bb1a' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V073' AND video_id IS NULL;

-- Band 1: Level 8 (V074-V079)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'e1abf939-6ecd-43ee-9dc5-695182e204da' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V074' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'e1abf939-6ecd-43ee-9dc5-695182e204da' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V075' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'e1abf939-6ecd-43ee-9dc5-695182e204da' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V076' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'e1abf939-6ecd-43ee-9dc5-695182e204da' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V077' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'e1abf939-6ecd-43ee-9dc5-695182e204da' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V078' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'e1abf939-6ecd-43ee-9dc5-695182e204da' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V079' AND video_id IS NULL;

-- Band 1: Level 9 (V081-V085)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '1f5b5ef9-bd04-44f5-be64-9503a48d24ea' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V081' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '1f5b5ef9-bd04-44f5-be64-9503a48d24ea' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V082' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '1f5b5ef9-bd04-44f5-be64-9503a48d24ea' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V083' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '1f5b5ef9-bd04-44f5-be64-9503a48d24ea' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V084' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '1f5b5ef9-bd04-44f5-be64-9503a48d24ea' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V085' AND video_id IS NULL;

-- Band 1: Level 10 (V086-V091)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '13e3178d-0a6d-48c3-850b-e898f78af73c' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V086' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '13e3178d-0a6d-48c3-850b-e898f78af73c' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V087' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '13e3178d-0a6d-48c3-850b-e898f78af73c' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V088' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '13e3178d-0a6d-48c3-850b-e898f78af73c' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V089' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '13e3178d-0a6d-48c3-850b-e898f78af73c' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V090' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '13e3178d-0a6d-48c3-850b-e898f78af73c' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V091' AND video_id IS NULL;

-- Band 1: Level 11 (V093-V101)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'dd8f209f-3125-402b-af18-449a16f80190' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V093' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'dd8f209f-3125-402b-af18-449a16f80190' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V094' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'dd8f209f-3125-402b-af18-449a16f80190' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V095' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'dd8f209f-3125-402b-af18-449a16f80190' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V096' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'dd8f209f-3125-402b-af18-449a16f80190' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V097' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'dd8f209f-3125-402b-af18-449a16f80190' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V098' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'dd8f209f-3125-402b-af18-449a16f80190' AND sort_order = 7 AND is_active = true LIMIT 1) WHERE code = 'V099' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'dd8f209f-3125-402b-af18-449a16f80190' AND sort_order = 8 AND is_active = true LIMIT 1) WHERE code = 'V100' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'dd8f209f-3125-402b-af18-449a16f80190' AND sort_order = 9 AND is_active = true LIMIT 1) WHERE code = 'V101' AND video_id IS NULL;

-- Tipps und Tricks
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V013' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V017' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V021' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V025' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V038' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V045' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V065' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V066' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V067' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V080' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '3520c6a6-54ad-4453-a597-74d051701ef6' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V092' AND video_id IS NULL;

-- Halloween Special (V102-V107)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'd05b1f00-7783-4420-a028-de2a3a8a4d39' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V102' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'd05b1f00-7783-4420-a028-de2a3a8a4d39' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V103' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'd05b1f00-7783-4420-a028-de2a3a8a4d39' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V104' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'd05b1f00-7783-4420-a028-de2a3a8a4d39' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V105' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'd05b1f00-7783-4420-a028-de2a3a8a4d39' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V106' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'd05b1f00-7783-4420-a028-de2a3a8a4d39' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V107' AND video_id IS NULL;

-- V108 = Level 1, Video 1 (duplicate)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'fcfbbc8a-8616-47b7-8938-c62e80fa363c' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V108' AND video_id IS NULL;

-- Silvester Special (V249-V254)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '09748ccc-9479-474d-851f-b5327b282c90' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V249' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '09748ccc-9479-474d-851f-b5327b282c90' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V250' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '09748ccc-9479-474d-851f-b5327b282c90' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V251' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '09748ccc-9479-474d-851f-b5327b282c90' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V252' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '09748ccc-9479-474d-851f-b5327b282c90' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V253' AND video_id IS NULL;

-- Band 2 (V336-V350 = Level 12-13)
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c0ddc432-0c90-41a5-bf0c-26335b096130' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V336' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c0ddc432-0c90-41a5-bf0c-26335b096130' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V337' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c0ddc432-0c90-41a5-bf0c-26335b096130' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V338' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c0ddc432-0c90-41a5-bf0c-26335b096130' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V339' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c0ddc432-0c90-41a5-bf0c-26335b096130' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V340' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = 'c0ddc432-0c90-41a5-bf0c-26335b096130' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V341' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6278e402-9b0a-43de-bd06-7b74f2256ac5' AND sort_order = 1 AND is_active = true LIMIT 1) WHERE code = 'V342' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6278e402-9b0a-43de-bd06-7b74f2256ac5' AND sort_order = 2 AND is_active = true LIMIT 1) WHERE code = 'V343' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6278e402-9b0a-43de-bd06-7b74f2256ac5' AND sort_order = 3 AND is_active = true LIMIT 1) WHERE code = 'V344' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6278e402-9b0a-43de-bd06-7b74f2256ac5' AND sort_order = 4 AND is_active = true LIMIT 1) WHERE code = 'V345' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6278e402-9b0a-43de-bd06-7b74f2256ac5' AND sort_order = 5 AND is_active = true LIMIT 1) WHERE code = 'V346' AND video_id IS NULL;
UPDATE qr_codes SET video_id = (SELECT id FROM videos WHERE level_id = '6278e402-9b0a-43de-bd06-7b74f2256ac5' AND sort_order = 6 AND is_active = true LIMIT 1) WHERE code = 'V347' AND video_id IS NULL;