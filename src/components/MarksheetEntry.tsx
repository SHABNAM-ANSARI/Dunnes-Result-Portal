import { useState, useMemo } from "react";
import DunnesHeader from "./DunnesHeader";
import signature from "@/assets/principal-signature.png";
import { STUDENTS_BY_CLASS, ACADEMIC_SUBJECTS, getTeacherForClass } from "@/data/schoolData";

interface Student {
  grNo: string;
  name: string;
  rollNo: string;
  marks: Record<string, number>;
}

interface MarksheetEntryProps {
  selectedClass: string;
  selectedTerm: string;
}

const getGrade = (percentage: number): string => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "E";
};

const MarksheetEntry = ({ selectedClass, selectedTerm }: MarksheetEntryProps) => {
  const subjects = ACADEMIC_SUBJECTS[selectedClass] || ACADEMIC_SUBJECTS["Class 1"];
  const maxMarks = 100;
  const classTeacher = getTeacherForClass(selectedClass);

  const storageKey = `dunnes_marks_${selectedClass}_${selectedTerm}`;

  const initialStudents = useMemo(() => {
    const csvStudents = STUDENTS_BY_CLASS[selectedClass] || [];
    const base = csvStudents.map((s, idx) => ({
      grNo: s.grNo,
      name: s.name,
      rollNo: s.rollNo || String(idx + 1),
      marks: Object.fromEntries(subjects.map((sub) => [sub, 0])) as Record<string, number>,
    }));
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedMarks: Record<string, Record<string, number>> = JSON.parse(saved);
        return base.map((s) => ({ ...s, marks: { ...s.marks, ...(savedMarks[s.grNo] || {}) } }));
      }
    } catch {}
    return base;
  }, [selectedClass, selectedTerm]);

  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [savedAt, setSavedAt] = useState<string>("");

  const persist = (next: Student[]) => {
    try {
      const map: Record<string, Record<string, number>> = {};
      next.forEach((s) => (map[s.grNo] = s.marks));
      localStorage.setItem(storageKey, JSON.stringify(map));
      setSavedAt(new Date().toLocaleTimeString());
    } catch {}
  };

  const updateMark = (grNo: string, subject: string, value: number) => {
    setStudents((prev) => {
      const next = prev.map((s) =>
        s.grNo === grNo
          ? { ...s, marks: { ...s.marks, [subject]: Math.min(maxMarks, Math.max(0, value)) } }
          : s
      );
      persist(next);
      return next;
    });
  };

  const getTotal = (marks: Record<string, number>) =>
    Object.values(marks).reduce((a, b) => a + b, 0);

  const getPercentage = (marks: Record<string, number>) =>
    (getTotal(marks) / (subjects.length * maxMarks)) * 100;

  return (
    <div className="mt-10 report-card p-8 shadow-2xl rounded-xl print:shadow-none">
      <DunnesHeader />
      <div className="flex justify-between mb-4 font-bold text-sm text-primary">
        <span>CLASS: {selectedClass}</span>
        <span>TERM: {selectedTerm}</span>
        <span>STUDENTS: {students.length}</span>
        <span>MAX MARKS: {maxMarks}/subject</span>
      </div>
      {classTeacher && (
        <div className="mb-4 text-xs text-muted-foreground">
          Class Teacher: <strong>{classTeacher}</strong>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-primary text-xs">
          <thead>
            <tr className="bg-primary text-primary-foreground text-[10px]">
              <th className="border border-primary/50 p-2">SR</th>
              <th className="border border-primary/50 p-2">GR NO</th>
              <th className="border border-primary/50 p-2 text-left">STUDENT NAME</th>
              {subjects.map((sub) => (
                <th key={sub} className="border border-primary/50 p-2 uppercase text-[9px]">
                  {sub}
                </th>
              ))}
              <th className="border border-primary/50 p-2">TOTAL</th>
              <th className="border border-primary/50 p-2">%</th>
              <th className="border border-primary/50 p-2">GRADE</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => {
              const total = getTotal(student.marks);
              const pct = getPercentage(student.marks);
              return (
                <tr key={student.grNo} className="hover:bg-primary/5 transition">
                  <td className="border border-primary/30 p-1 text-center text-[10px]">{idx + 1}</td>
                  <td className="border border-primary/30 p-1 text-center font-bold text-[10px]">{student.grNo}</td>
                  <td className="border border-primary/30 p-2 uppercase font-semibold text-[10px] whitespace-nowrap">{student.name}</td>
                  {subjects.map((sub) => (
                    <td key={sub} className="border border-primary/30 p-1 text-center">
                      <input
                        type="number"
                        min={0}
                        max={maxMarks}
                        value={student.marks[sub] || ""}
                        onChange={(e) => updateMark(student.grNo, sub, Number(e.target.value))}
                        className="w-10 text-center outline-none bg-transparent font-medium text-[11px]"
                      />
                    </td>
                  ))}
                  <td className="border border-primary/30 p-2 text-center font-bold">{total}</td>
                  <td className="border border-primary/30 p-2 text-center font-semibold">{pct.toFixed(1)}</td>
                  <td className="border border-primary/30 p-2 text-center font-black text-primary">
                    {getGrade(pct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-10 flex justify-between px-4">
        <div className="text-center">
          <img src={signature} alt="Principal Signature" className="h-12 mx-auto mb-1 opacity-70" />
          <div className="border-t border-foreground text-[10px] pt-1 w-32 font-bold uppercase">Principal</div>
        </div>
        <div className="text-center">
          <div className="h-12 mb-1" />
          <div className="border-t border-foreground text-[10px] pt-1 w-32 font-bold uppercase">
            {classTeacher || "Class Teacher"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksheetEntry;
