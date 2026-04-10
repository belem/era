#!/usr/bin/env python3
"""
Curated list of 50 classical Chinese poems from PEP (人教版) textbooks, grades 1-6.
Each poem includes title, author, dynasty, grade level, and complete text as paragraphs.
"""

import json
from pathlib import Path

CURATED_POEMS = [
    # Grade 1 - 8 poems
    {
        "title": "静夜思",
        "author": "李白",
        "dynasty": "唐",
        "grade": 1,
        "paragraphs": ["床前明月光，", "疑是地上霜。", "举头望明月，", "低头思故乡。"]
    },
    {
        "title": "春晓",
        "author": "孟浩然",
        "dynasty": "唐",
        "grade": 1,
        "paragraphs": ["春眠不觉晓，", "处处闻啼鸟。", "夜来风雨声，", "花落知多少。"]
    },
    {
        "title": "画",
        "author": "王维",
        "dynasty": "唐",
        "grade": 1,
        "paragraphs": ["远看山有色，", "近听水无声。", "春去花还在，", "人来鸟不惊。"]
    },
    {
        "title": "咏鹅",
        "author": "骆宾王",
        "dynasty": "唐",
        "grade": 1,
        "paragraphs": ["鹅鹅鹅，", "曲项向天歌。", "白毛浮绿水，", "红掌拨清波。"]
    },
    {
        "title": "悯农二首·其二",
        "author": "李绅",
        "dynasty": "唐",
        "grade": 1,
        "paragraphs": ["锄禾日当午，", "汗滴禾下土。", "谁知盘中餐，", "粒粒皆辛苦。"]
    },
    {
        "title": "古朗月行",
        "author": "李白",
        "dynasty": "唐",
        "grade": 1,
        "paragraphs": ["小时不识月，", "呼作白玉盘。", "又疑瑶台镜，", "飞在青云端。"]
    },
    {
        "title": "风",
        "author": "李峤",
        "dynasty": "唐",
        "grade": 1,
        "paragraphs": ["解落三秋叶，", "能开二月花。", "过江千尺浪，", "入竹万竿斜。"]
    },
    {
        "title": "江南",
        "author": "汉乐府",
        "dynasty": "汉",
        "grade": 1,
        "paragraphs": ["江南可采莲，", "莲叶何田田。", "鱼戏莲叶间。", "鱼戏莲叶东，", "鱼戏莲叶西，", "鱼戏莲叶南，", "鱼戏莲叶北。"]
    },

    # Grade 2 - 8 poems
    {
        "title": "登鹳雀楼",
        "author": "王之涣",
        "dynasty": "唐",
        "grade": 2,
        "paragraphs": ["白日依山尽，", "黄河入海流。", "欲穷千里目，", "更上一层楼。"]
    },
    {
        "title": "望庐山瀑布",
        "author": "李白",
        "dynasty": "唐",
        "grade": 2,
        "paragraphs": ["日照香炉生紫烟，", "遥看瀑布挂前川。", "飞流直下三千尺，", "疑是银河落九天。"]
    },
    {
        "title": "绝句",
        "author": "杜甫",
        "dynasty": "唐",
        "grade": 2,
        "paragraphs": ["两个黄鹂鸣翠柳，", "一行白鹭上青天。", "窗含西岭千秋雪，", "门泊东吴万里船。"]
    },
    {
        "title": "赠汪伦",
        "author": "李白",
        "dynasty": "唐",
        "grade": 2,
        "paragraphs": ["李白乘舟将欲行，", "忽闻岸上踏歌声。", "桃花潭水深千尺，", "不及汪伦送我情。"]
    },
    {
        "title": "小池",
        "author": "杨万里",
        "dynasty": "宋",
        "grade": 2,
        "paragraphs": ["泉眼无声惜细流，", "树阴照水爱晴柔。", "小荷才露尖尖角，", "早有蜻蜓立上头。"]
    },
    {
        "title": "村居",
        "author": "高鼎",
        "dynasty": "清",
        "grade": 2,
        "paragraphs": ["草长莺飞二月天，", "拂堤杨柳醉春烟。", "儿童散学归来早，", "忙趁东风放纸鸢。"]
    },
    {
        "title": "咏柳",
        "author": "贺知章",
        "dynasty": "唐",
        "grade": 2,
        "paragraphs": ["碧玉妆成一树高，", "万条垂下绿丝绦。", "不知细叶谁裁出，", "二月春风似剪刀。"]
    },
    {
        "title": "晓出净慈寺送林子方",
        "author": "杨万里",
        "dynasty": "宋",
        "grade": 2,
        "paragraphs": ["毕竟西湖六月中，", "风光不与四时同。", "接天莲叶无穷碧，", "映日荷花别样红。"]
    },

    # Grade 3 - 8 poems
    {
        "title": "江雪",
        "author": "柳宗元",
        "dynasty": "唐",
        "grade": 3,
        "paragraphs": ["千山鸟飞绝，", "万径人踪灭。", "孤舟蓑笠翁，", "独钓寒江雪。"]
    },
    {
        "title": "山行",
        "author": "杜牧",
        "dynasty": "唐",
        "grade": 3,
        "paragraphs": ["远上寒山石径斜，", "白云生处有人家。", "停车坐爱枫林晚，", "霜叶红于二月花。"]
    },
    {
        "title": "望天门山",
        "author": "李白",
        "dynasty": "唐",
        "grade": 3,
        "paragraphs": ["天门中断楚江开，", "碧水东流至此回。", "两岸青山相对出，", "孤帆一片日边来。"]
    },
    {
        "title": "饮湖上初晴后雨",
        "author": "苏轼",
        "dynasty": "宋",
        "grade": 3,
        "paragraphs": ["水光潋滟晴方好，", "山色空蒙雨亦奇。", "欲把西湖比西子，", "淡妆浓抹总相宜。"]
    },
    {
        "title": "夜书所见",
        "author": "叶绍翁",
        "dynasty": "宋",
        "grade": 3,
        "paragraphs": ["萧萧梧叶送寒声，", "江上秋风动客情。", "知有儿童挑促织，", "夜深篱落一灯明。"]
    },
    {
        "title": "九月九日忆山东兄弟",
        "author": "王维",
        "dynasty": "唐",
        "grade": 3,
        "paragraphs": ["独在异乡为异客，", "每逢佳节倍思亲。", "遥知兄弟登高处，", "遍插茱萸少一人。"]
    },
    {
        "title": "早发白帝城",
        "author": "李白",
        "dynasty": "唐",
        "grade": 3,
        "paragraphs": ["朝辞白帝彩云间，", "千里江陵一日还。", "两岸猿声啼不住，", "轻舟已过万重山。"]
    },
    {
        "title": "所见",
        "author": "袁枚",
        "dynasty": "清",
        "grade": 3,
        "paragraphs": ["牧童骑黄牛，", "歌声振林樾。", "意欲捕鸣蝉，", "忽然闭口立。"]
    },

    # Grade 4 - 8 poems
    {
        "title": "题西林壁",
        "author": "苏轼",
        "dynasty": "宋",
        "grade": 4,
        "paragraphs": ["横看成岭侧成峰，", "远近高低各不同。", "不识庐山真面目，", "只缘身在此山中。"]
    },
    {
        "title": "游山西村",
        "author": "陆游",
        "dynasty": "宋",
        "grade": 4,
        "paragraphs": ["莫笑农家腊酒浑，", "丰年留客足鸡豚。", "山重水复疑无路，", "柳暗花明又一村。"]
    },
    {
        "title": "黄鹤楼送孟浩然之广陵",
        "author": "李白",
        "dynasty": "唐",
        "grade": 4,
        "paragraphs": ["故人西辞黄鹤楼，", "烟花三月下扬州。", "孤帆远影碧空尽，", "唯见长江天际流。"]
    },
    {
        "title": "送元二使安西",
        "author": "王维",
        "dynasty": "唐",
        "grade": 4,
        "paragraphs": ["渭城朝雨浥轻尘，", "客舍青青柳色新。", "劝君更尽一杯酒，", "西出阳关无故人。"]
    },
    {
        "title": "独坐敬亭山",
        "author": "李白",
        "dynasty": "唐",
        "grade": 4,
        "paragraphs": ["众鸟高飞尽，", "孤云独去闲。", "相看两不厌，", "只有敬亭山。"]
    },
    {
        "title": "望洞庭",
        "author": "刘禹锡",
        "dynasty": "唐",
        "grade": 4,
        "paragraphs": ["湖光秋月两相和，", "潭面无风镜未磨。", "遥望洞庭山水翠，", "白银盘里一青螺。"]
    },
    {
        "title": "忆江南",
        "author": "白居易",
        "dynasty": "唐",
        "grade": 4,
        "paragraphs": ["江南好，", "风景旧曾谙。", "日出江花红胜火，", "春来江水绿如蓝。", "能不忆江南？"]
    },
    {
        "title": "渔歌子",
        "author": "张志和",
        "dynasty": "唐",
        "grade": 4,
        "paragraphs": ["西塞山前白鹭飞，", "桃花流水鳜鱼肥。", "青箬笠，", "绿蓑衣，", "斜风细雨不须归。"]
    },

    # Grade 5 - 8 poems
    {
        "title": "泊船瓜洲",
        "author": "王安石",
        "dynasty": "宋",
        "grade": 5,
        "paragraphs": ["京口瓜洲一水间，", "钟山只隔数重山。", "春风又绿江南岸，", "明月何时照我还。"]
    },
    {
        "title": "秋思",
        "author": "张籍",
        "dynasty": "唐",
        "grade": 5,
        "paragraphs": ["洛阳城里见秋风，", "欲作家书意万重。", "复恐匆匆说不尽，", "行人临发又开封。"]
    },
    {
        "title": "长相思",
        "author": "纳兰性德",
        "dynasty": "清",
        "grade": 5,
        "paragraphs": ["山一程，", "水一程，", "身向榆关那畔行，", "夜深千帐灯。", "风一更，", "雪一更，", "聒碎乡心梦不成，", "故园无此声。"]
    },
    {
        "title": "枫桥夜泊",
        "author": "张继",
        "dynasty": "唐",
        "grade": 5,
        "paragraphs": ["月落乌啼霜满天，", "江枫渔火对愁眠。", "姑苏城外寒山寺，", "夜半钟声到客船。"]
    },
    {
        "title": "己亥杂诗",
        "author": "龚自珍",
        "dynasty": "清",
        "grade": 5,
        "paragraphs": ["九州生气恃风雷，", "万马齐喑究可哀。", "我劝天公重抖擞，", "不拘一格降人才。"]
    },
    {
        "title": "牧童",
        "author": "吕岩",
        "dynasty": "唐",
        "grade": 5,
        "paragraphs": ["草铺横野六七里，", "笛弄晚风三四声。", "归来饱饭黄昏后，", "不脱蓑衣卧月明。"]
    },
    {
        "title": "舟过安仁",
        "author": "杨万里",
        "dynasty": "宋",
        "grade": 5,
        "paragraphs": ["一叶渔船两小童，", "收篙停棹坐船中。", "怪生无雨都张伞，", "不是遮头是使风。"]
    },
    {
        "title": "清平乐·村居",
        "author": "辛弃疾",
        "dynasty": "宋",
        "grade": 5,
        "paragraphs": ["茅檐低小，", "溪上青青草。", "醉里吴音相媚好，", "白发谁家翁媪？", "大儿锄豆溪东，", "中儿正织鸡笼。", "最喜小儿亡赖，", "溪头卧剥莲蓬。"]
    },

    # Grade 6 - 10 poems
    {
        "title": "石灰吟",
        "author": "于谦",
        "dynasty": "明",
        "grade": 6,
        "paragraphs": ["千锤万凿出深山，", "烈火焚烧若等闲。", "粉骨碎身全不怕，", "要留清白在人间。"]
    },
    {
        "title": "竹石",
        "author": "郑燮",
        "dynasty": "清",
        "grade": 6,
        "paragraphs": ["咬定青山不放松，", "立根原在破岩中。", "千磨万击还坚劲，", "任尔东西南北风。"]
    },
    {
        "title": "闻官军收河南河北",
        "author": "杜甫",
        "dynasty": "唐",
        "grade": 6,
        "paragraphs": ["剑外忽传收蓟北，", "初闻涕泪满衣裳。", "却看妻子愁何在，", "漫卷诗书喜欲狂。", "白日放歌须纵酒，", "青春作伴好还乡。", "即从巴峡穿巫峡，", "便下襄阳向洛阳。"]
    },
    {
        "title": "春夜喜雨",
        "author": "杜甫",
        "dynasty": "唐",
        "grade": 6,
        "paragraphs": ["好雨知时节，", "当春乃发生。", "随风潜入夜，", "润物细无声。", "野径云俱黑，", "江船火独明。", "晓看红湿处，", "花重锦官城。"]
    },
    {
        "title": "江畔独步寻花",
        "author": "杜甫",
        "dynasty": "唐",
        "grade": 6,
        "paragraphs": ["黄四娘家花满蹊，", "千朵万朵压枝低。", "留连戏蝶时时舞，", "自在娇莺恰恰啼。"]
    },
    {
        "title": "书湖阴先生壁",
        "author": "王安石",
        "dynasty": "宋",
        "grade": 6,
        "paragraphs": ["茅檐长扫净无苔，", "花木成畦手自栽。", "一水护田将绿绕，", "两山排闼送青来。"]
    },
    {
        "title": "六月二十七日望湖楼醉书",
        "author": "苏轼",
        "dynasty": "宋",
        "grade": 6,
        "paragraphs": ["黑云翻墨未遮山，", "白雨跳珠乱入船。", "卷地风来忽吹散，", "望湖楼下水如天。"]
    },
    {
        "title": "浣溪沙",
        "author": "苏轼",
        "dynasty": "宋",
        "grade": 6,
        "paragraphs": ["游蕲水清泉寺，", "寺临兰溪，", "溪水西流。", "山下兰芽短浸溪，", "松间沙路净无泥，", "潇潇暮雨子规啼。", "谁道人生无再少？", "门前流水尚能西！", "休将白发唱黄鸡。"]
    },
    {
        "title": "西江月·夜行黄沙道中",
        "author": "辛弃疾",
        "dynasty": "宋",
        "grade": 6,
        "paragraphs": ["明月别枝惊鹊，", "清风半夜鸣蝉。", "稻花香里说丰年，", "听取蛙声一片。", "七八个星天外，", "两三点雨山前。", "旧时茅店社林边，", "路转溪桥忽见。"]
    },
    {
        "title": "天净沙·秋",
        "author": "白朴",
        "dynasty": "元",
        "grade": 6,
        "paragraphs": ["孤村落日残霞，", "轻烟老树寒鸦，", "一点飞鸿影下。", "青山绿水，", "白草红叶黄花。"]
    }
]


def main():
    """Generate curated-poems.json with 50 classical Chinese poems."""
    output_path = Path(__file__).parent / "curated-poems.json"

    # Verify we have 50 poems
    assert len(CURATED_POEMS) == 50, f"Expected 50 poems, got {len(CURATED_POEMS)}"

    # Write to JSON file
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(CURATED_POEMS, f, ensure_ascii=False, indent=2)

    print(f"[OK] Generated {len(CURATED_POEMS)} poems")
    print(f"[OK] Output: {output_path}")

    # Print summary by grade
    grade_counts = {}
    for poem in CURATED_POEMS:
        grade = poem["grade"]
        grade_counts[grade] = grade_counts.get(grade, 0) + 1

    print("\nPoems by grade level:")
    for grade in sorted(grade_counts.keys()):
        print(f"  Grade {grade}: {grade_counts[grade]} poems")


if __name__ == "__main__":
    main()
