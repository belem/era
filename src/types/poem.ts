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
