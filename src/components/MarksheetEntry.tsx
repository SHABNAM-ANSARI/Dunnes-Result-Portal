import { useState } from "react";
import DunnesHeader from "./DunnesHeader";
import signature from "@/assets/principal-signature.png";

interface Student {
  rollNo: number;
  name: string;
  marks: Record<string, number>;
}

interface MarksheetEntryProps {
  selectedClass: string;
}

const SUBJECTS_MAP: Record<string, string[]> = {
  "Class 1": ["English", "Hindi", "Marathi", "Maths", "EVS"],
  "Class 2": ["English", "Hindi", "Marathi", "Maths", "EVS"],
  default: ["English", "Hindi", "Marathi", "Maths", "Science", "Social Studies", "Computer"],
};

const SAMPLE_STUDENTS: Student[] = [
  { rollNo: 101, name: "Aarav Sharma", marks: {} },
  { rollNo: 102, name: "Priya Deshmukh", marks: {} },
  { rollNo: 103, name: "Rohan Patel", marks: {} },
  { rollNo: 104, name: "Sneha Kulkarni", marks: {} },
  { rollNo: 105, name: "Vikram Joshi", marks: {} },
];

const getGrade = (percentage: number): string => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "E";
};

const MarksheetEntry = ({ selectedClass }: MarksheetEntryProps) => {
  const subjects = SUBJECTS_MAP[selectedClass] || SUBJECTS_MAP.default;
  const maxMarks = 100;

  const [students, setStudents] = useState<Student[]>(
    SAMPLE_STUDENTS.map((s) => ({
      ...s,
      marks: Object.fromEntries(subjects.map((sub) => [sub, 0])),
    }))
  );

  const updateMark = (rollNo: number, subject: string, value: number) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.rollNo === rollNo
          ? { ...s, marks: { ...s.marks, [subject]: Math.min(maxMarks, Math.max(0, value)) } }
          : s
      )
    );
  };

  const getTotal = (marks: Record<string, number>) =>
    Object.values(marks).reduce((a, b) => a + b, 0);

  const getPercentage = (marks: Record<string, number>) =>
    getTotal(marks) / (subjects.length * maxMarks) * 100;

  return (
    <div className="mt-10 report-card p-8 shadow-2xl rounded-xl print:shadow-none">
      <DunnesHeader />
      <div className="flex justify-between mb-4 font-bold text-sm text-primary">
        <span>CLASS: {selectedClass}</span>
        <span>TERM: Annual Examination</span>
        <span>MAX MARKS: {maxMarks} per subject</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-primary text-xs">
          <thead>
            <tr className="bg-primary text-primary-foreground text-[10px]">
              <th className="border border-primary/50 p-2">ROLL NO</th>
              <th className="border border-primary/50 p-2 text-left">STUDENT NAME</th>
              {subjects.map((sub) => (
                <th key={sub} className="border border-primary/50 p-2 uppercase">
                  {sub}
                </th>
              ))}
              <th className="border border-primary/50 p-2">TOTAL</th>
              <th className="border border-primary/50 p-2">%</th>
              <th className="border border-primary/50 p-2">GRADE</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const total = getTotal(student.marks);
              const pct = getPercentage(student.marks);
              return (
                <tr key={student.rollNo} className="hover:bg-primary/5 transition">
                  <td className="border border-primary/30 p-2 text-center font-bold">{student.rollNo}</td>
                  <td className="border border-primary/30 p-2 uppercase font-semibold">{student.name}</td>
                  {subjects.map((sub) => (
                    <td key={sub} className="border border-primary/30 p-1 text-center">
                      <input
                        type="number"
                        min={0}
                        max={maxMarks}
                        value={student.marks[sub] || ""}
                        onChange={(e) => updateMark(student.rollNo, sub, Number(e.target.value))}
                        className="w-12 text-center outline-none bg-transparent font-medium"
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
          <div className="border-t border-foreground text-[10px] pt-1 w-32 font-bold uppercase">Class Teacher</div>
        </div>
      </div>
    </div>
  );
};

export default MarksheetEntry;
