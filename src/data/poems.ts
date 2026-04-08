export interface PoemChar {
  char: string;
  pinyin: string;
  polyphone?: boolean;
}

export interface PoemLine {
  chars: PoemChar[];
  punctuation: string;
}

export interface Poem {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  grade: number;
  lines: PoemLine[];
}

export const poems: Poem[] = [
  {
    id: "jing-ye-si",
    title: "静夜思",
    author: "李白",
    dynasty: "唐",
    grade: 1,
    lines: [
      {
        chars: [
          { char: "床", pinyin: "chuáng" },
          { char: "前", pinyin: "qián" },
          { char: "明", pinyin: "míng" },
          { char: "月", pinyin: "yuè" },
          { char: "光", pinyin: "guāng" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "疑", pinyin: "yí" },
          { char: "是", pinyin: "shì" },
          { char: "地", pinyin: "dì" },
          { char: "上", pinyin: "shàng" },
          { char: "霜", pinyin: "shuāng" },
        ],
        punctuation: "。",
      },
      {
        chars: [
          { char: "举", pinyin: "jǔ" },
          { char: "头", pinyin: "tóu" },
          { char: "望", pinyin: "wàng" },
          { char: "明", pinyin: "míng" },
          { char: "月", pinyin: "yuè" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "低", pinyin: "dī" },
          { char: "头", pinyin: "tóu" },
          { char: "思", pinyin: "sī" },
          { char: "故", pinyin: "gù" },
          { char: "乡", pinyin: "xiāng" },
        ],
        punctuation: "。",
      },
    ],
  },
  {
    id: "chun-xiao",
    title: "春晓",
    author: "孟浩然",
    dynasty: "唐",
    grade: 1,
    lines: [
      {
        chars: [
          { char: "春", pinyin: "chūn" },
          { char: "眠", pinyin: "mián" },
          { char: "不", pinyin: "bù" },
          { char: "觉", pinyin: "jué" },
          { char: "晓", pinyin: "xiǎo" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "处", pinyin: "chù", polyphone: true },
          { char: "处", pinyin: "chù", polyphone: true },
          { char: "闻", pinyin: "wén" },
          { char: "啼", pinyin: "tí" },
          { char: "鸟", pinyin: "niǎo" },
        ],
        punctuation: "。",
      },
      {
        chars: [
          { char: "夜", pinyin: "yè" },
          { char: "来", pinyin: "lái" },
          { char: "风", pinyin: "fēng" },
          { char: "雨", pinyin: "yǔ" },
          { char: "声", pinyin: "shēng" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "花", pinyin: "huā" },
          { char: "落", pinyin: "luò" },
          { char: "知", pinyin: "zhī" },
          { char: "多", pinyin: "duō" },
          { char: "少", pinyin: "shǎo" },
        ],
        punctuation: "。",
      },
    ],
  },
  {
    id: "deng-guan-que-lou",
    title: "登鹳雀楼",
    author: "王之涣",
    dynasty: "唐",
    grade: 2,
    lines: [
      {
        chars: [
          { char: "白", pinyin: "bái" },
          { char: "日", pinyin: "rì" },
          { char: "依", pinyin: "yī" },
          { char: "山", pinyin: "shān" },
          { char: "尽", pinyin: "jìn" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "黄", pinyin: "huáng" },
          { char: "河", pinyin: "hé" },
          { char: "入", pinyin: "rù" },
          { char: "海", pinyin: "hǎi" },
          { char: "流", pinyin: "liú" },
        ],
        punctuation: "。",
      },
      {
        chars: [
          { char: "欲", pinyin: "yù" },
          { char: "穷", pinyin: "qióng" },
          { char: "千", pinyin: "qiān" },
          { char: "里", pinyin: "lǐ" },
          { char: "目", pinyin: "mù" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "更", pinyin: "gèng", polyphone: true },
          { char: "上", pinyin: "shàng" },
          { char: "一", pinyin: "yī" },
          { char: "层", pinyin: "céng" },
          { char: "楼", pinyin: "lóu" },
        ],
        punctuation: "。",
      },
    ],
  },
  {
    id: "min-nong-qi-er",
    title: "悯农·其二",
    author: "李绅",
    dynasty: "唐",
    grade: 2,
    lines: [
      {
        chars: [
          { char: "锄", pinyin: "chú" },
          { char: "禾", pinyin: "hé" },
          { char: "日", pinyin: "rì" },
          { char: "当", pinyin: "dāng" },
          { char: "午", pinyin: "wǔ" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "汗", pinyin: "hàn" },
          { char: "滴", pinyin: "dī" },
          { char: "禾", pinyin: "hé" },
          { char: "下", pinyin: "xià" },
          { char: "土", pinyin: "tǔ" },
        ],
        punctuation: "。",
      },
      {
        chars: [
          { char: "谁", pinyin: "shuí" },
          { char: "知", pinyin: "zhī" },
          { char: "盘", pinyin: "pán" },
          { char: "中", pinyin: "zhōng" },
          { char: "餐", pinyin: "cān" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "粒", pinyin: "lì" },
          { char: "粒", pinyin: "lì" },
          { char: "皆", pinyin: "jiē" },
          { char: "辛", pinyin: "xīn" },
          { char: "苦", pinyin: "kǔ" },
        ],
        punctuation: "。",
      },
    ],
  },
  {
    id: "jiang-xue",
    title: "江雪",
    author: "柳宗元",
    dynasty: "唐",
    grade: 3,
    lines: [
      {
        chars: [
          { char: "千", pinyin: "qiān" },
          { char: "山", pinyin: "shān" },
          { char: "鸟", pinyin: "niǎo" },
          { char: "飞", pinyin: "fēi" },
          { char: "绝", pinyin: "jué" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "万", pinyin: "wàn" },
          { char: "径", pinyin: "jìng" },
          { char: "人", pinyin: "rén" },
          { char: "踪", pinyin: "zōng" },
          { char: "灭", pinyin: "miè" },
        ],
        punctuation: "。",
      },
      {
        chars: [
          { char: "孤", pinyin: "gū" },
          { char: "舟", pinyin: "zhōu" },
          { char: "蓑", pinyin: "suō" },
          { char: "笠", pinyin: "lì" },
          { char: "翁", pinyin: "wēng" },
        ],
        punctuation: "，",
      },
      {
        chars: [
          { char: "独", pinyin: "dú" },
          { char: "钓", pinyin: "diào" },
          { char: "寒", pinyin: "hán" },
          { char: "江", pinyin: "jiāng" },
          { char: "雪", pinyin: "xuě" },
        ],
        punctuation: "。",
      },
    ],
  },
];
