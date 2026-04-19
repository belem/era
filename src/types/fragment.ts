export interface FragmentDeck {
  id: string;
  student_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  fragment_count?: number;
  due_count?: number;
}

export interface Fragment {
  id: string;
  deck_id: string;
  student_id: string;
  front: string;
  back: string;
  tags: string[];
  created_at: string;
}
