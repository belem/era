export const CN_NUM = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function nameInitial(name: string): string {
  if (!name) return "?";
  const last = name.charAt(name.length - 1);
  if (/[\u4e00-\u9fff]/.test(last)) return last;
  return name.charAt(0).toUpperCase();
}

export interface PoemEdition {
  edition: string;
  school_system: string;
  level: string;
  grade: number | null;
  page?: number | null;
}

export function formatGrade(level: string, grade: number | null): string {
  if (grade == null) return level;
  if (level === "高中") return `高${CN_NUM[grade] ?? String(grade)}`;
  return `${CN_NUM[grade] ?? String(grade)}年级`;
}

export function formatEdition(e: PoemEdition): string {
  const parts: string[] = [e.edition];
  if (e.school_system !== "高中") parts.push(e.school_system);
  if (e.grade != null) {
    if (e.level === "高中") {
      parts.push(`高${CN_NUM[e.grade] ?? String(e.grade)}`);
    } else {
      parts.push(`${CN_NUM[e.grade] ?? String(e.grade)}年级`);
    }
  }
  if (e.page != null) parts.push(`第${e.page}页`);
  return parts.join("·");
}

export function levelFromSchoolSystem(schoolSystem: string): string {
  return schoolSystem === "高中" ? "高中" : "义务教育";
}

export function maxGradeForSchoolSystem(schoolSystem: string): number {
  return schoolSystem === "高中" ? 3 : 9;
}
