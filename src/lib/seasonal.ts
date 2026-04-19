// 24 solar terms with approximate date ranges (month-day)
// Each solar term maps to poem tags that can be queried from the database
const SOLAR_TERMS: { name: string; nameZh: string; start: string; tags: string[] }[] = [
  { name: "lichun", nameZh: "立春", start: "02-04", tags: ["lichun", "spring"] },
  { name: "yushui", nameZh: "雨水", start: "02-19", tags: ["yushui", "spring"] },
  { name: "jingzhe", nameZh: "惊蛰", start: "03-06", tags: ["jingzhe", "spring"] },
  { name: "chunfen", nameZh: "春分", start: "03-21", tags: ["chunfen", "spring"] },
  { name: "qingming", nameZh: "清明", start: "04-05", tags: ["qingming", "spring"] },
  { name: "guyu", nameZh: "谷雨", start: "04-20", tags: ["guyu", "spring"] },
  { name: "lixia", nameZh: "立夏", start: "05-06", tags: ["lixia", "summer"] },
  { name: "xiaoman", nameZh: "小满", start: "05-21", tags: ["xiaoman", "summer"] },
  { name: "mangzhong", nameZh: "芒种", start: "06-06", tags: ["mangzhong", "summer"] },
  { name: "xiazhi", nameZh: "夏至", start: "06-21", tags: ["xiazhi", "summer"] },
  { name: "xiaoshu", nameZh: "小暑", start: "07-07", tags: ["xiaoshu", "summer"] },
  { name: "dashu", nameZh: "大暑", start: "07-23", tags: ["dashu", "summer"] },
  { name: "liqiu", nameZh: "立秋", start: "08-07", tags: ["liqiu", "autumn"] },
  { name: "chushu", nameZh: "处暑", start: "08-23", tags: ["chushu", "autumn"] },
  { name: "bailu", nameZh: "白露", start: "09-08", tags: ["bailu", "autumn"] },
  { name: "qiufen", nameZh: "秋分", start: "09-23", tags: ["qiufen", "autumn"] },
  { name: "hanlu", nameZh: "寒露", start: "10-08", tags: ["hanlu", "autumn"] },
  { name: "shuanjiang", nameZh: "霜降", start: "10-23", tags: ["shuanjiang", "autumn"] },
  { name: "lidong", nameZh: "立冬", start: "11-07", tags: ["lidong", "winter"] },
  { name: "xiaoxue", nameZh: "小雪", start: "11-22", tags: ["xiaoxue", "winter"] },
  { name: "daxue", nameZh: "大雪", start: "12-07", tags: ["daxue", "winter"] },
  { name: "dongzhi", nameZh: "冬至", start: "12-22", tags: ["dongzhi", "winter"] },
  { name: "xiaohan", nameZh: "小寒", start: "01-06", tags: ["xiaohan", "winter"] },
  { name: "dahan", nameZh: "大寒", start: "01-20", tags: ["dahan", "winter"] },
];

export function getCurrentSolarTerm(date: Date = new Date()) {
  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // Find the current solar term by walking backward from the date
  // Solar terms are sorted by date within the year (except xiaohan/dahan which are Jan)
  let current = SOLAR_TERMS[SOLAR_TERMS.length - 1]; // Default to last term

  for (let i = SOLAR_TERMS.length - 1; i >= 0; i--) {
    if (monthDay >= SOLAR_TERMS[i].start) {
      current = SOLAR_TERMS[i];
      break;
    }
  }

  return current;
}

export function getSeasonalTags(date?: Date): string[] {
  return getCurrentSolarTerm(date).tags;
}
