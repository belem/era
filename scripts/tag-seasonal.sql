-- Tag poems with seasonal associations based on title/content keywords.
-- Run after seeding. Appends to existing tags without removing them.
-- Uses array_cat to merge, then array_distinct (via unnest) to deduplicate.

-- Spring poems (spring, lichun, yushui, jingzhe, chunfen, qingming, guyu)
UPDATE poems SET tags = (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(tags, ARRAY['spring']))))
WHERE title ~ '春|柳|燕|桃|杏|梨花|清明|踏青|惊蛰|谷雨'
   OR content_lines::text ~ '"char":"春"|"char":"柳"|"char":"燕"|"char":"桃"';

-- Qingming specifically
UPDATE poems SET tags = (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(tags, ARRAY['spring', 'qingming']))))
WHERE title ~ '清明';

-- Summer poems
UPDATE poems SET tags = (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(tags, ARRAY['summer']))))
WHERE title ~ '夏|荷|蝉|暑|芒种|夏至|小满'
   OR content_lines::text ~ '"char":"荷"|"char":"蝉"|"char":"蛙"';

-- Autumn poems
UPDATE poems SET tags = (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(tags, ARRAY['autumn']))))
WHERE title ~ '秋|菊|霜|重阳|中秋|枫|寒露'
   OR content_lines::text ~ '"char":"秋"|"char":"菊"|"char":"枫"|"char":"霜"';

-- Mid-Autumn / Moon poems
UPDATE poems SET tags = (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(tags, ARRAY['autumn', 'qiufen']))))
WHERE title ~ '中秋|月夜|望月';

-- Winter poems
UPDATE poems SET tags = (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(tags, ARRAY['winter']))))
WHERE title ~ '冬|雪|梅|寒|冰|岁暮|除夜|元日|冬至'
   OR content_lines::text ~ '"char":"雪"|"char":"梅"|"char":"寒"';

-- Dongzhi / New Year
UPDATE poems SET tags = (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(tags, ARRAY['winter', 'dongzhi']))))
WHERE title ~ '冬至|除夜|元日|岁暮';

-- Guyu (current solar term, Apr 20)
UPDATE poems SET tags = (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(tags, ARRAY['spring', 'guyu']))))
WHERE title ~ '谷雨|春雨|雨'
   OR content_lines::text ~ '"char":"雨".*"char":"润"';
