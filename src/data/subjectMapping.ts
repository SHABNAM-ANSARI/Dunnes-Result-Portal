// Derived from Subject_Maping.csv
// Each subject is classified as either "regular" (numeric marks /100)
// or "credit" (graded A+/A/B/C/D — for skill / co-scholastic subjects).

export type SubjectType = "regular" | "credit";

export interface SubjectDef {
  name: string;
  type: SubjectType;
}

export const GRADE_OPTIONS = ["A+", "A", "B", "C", "D"] as const;
export type GradeValue = (typeof GRADE_OPTIONS)[number];

// Canonical subject list per class (the CSV is identical for every class,
// so we share one list — adjust here if a class needs a custom set).
const COMMON_SUBJECTS: SubjectDef[] = [
  // Regular (numeric, out of 100)
  { name: "English", type: "regular" },
  { name: "Hindi", type: "regular" },
  { name: "Marathi", type: "regular" },
  { name: "Maths", type: "regular" },
  { name: "Science", type: "regular" },
  { name: "Social Studies", type: "regular" },
  { name: "GK", type: "regular" },
  { name: "Geography", type: "regular" },
  { name: "Economics", type: "regular" },
  { name: "Computer Education", type: "regular" },
  { name: "Handwriting", type: "regular" },

  // Credit / skill subjects (graded)
  { name: "Drawing", type: "credit" },
  { name: "Music", type: "credit" },
  { name: "Computer", type: "credit" },
  { name: "Physical Trainer", type: "credit" },
  { name: "SUPW", type: "credit" },
  { name: "Value Education", type: "credit" },
  { name: "Drawing Trainer", type: "credit" },
];

export const SUBJECT_MAP: Record<string, SubjectDef[]> = {
  Nursery: COMMON_SUBJECTS,
  "Jr.KG": COMMON_SUBJECTS,
  "Sr.KG": COMMON_SUBJECTS,
  "Class 1": COMMON_SUBJECTS,
  "Class 2": COMMON_SUBJECTS,
  "Class 3": COMMON_SUBJECTS,
  "Class 4": COMMON_SUBJECTS,
  "Class 5": COMMON_SUBJECTS,
  "Class 6": COMMON_SUBJECTS,
  "Class 7": COMMON_SUBJECTS,
  "Class 8": COMMON_SUBJECTS,
  "Class 9": COMMON_SUBJECTS,
  "Class 10": COMMON_SUBJECTS,
};

export const getSubjectsForClass = (className: string): SubjectDef[] =>
  SUBJECT_MAP[className] ?? COMMON_SUBJECTS;

export const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3"] as const;
