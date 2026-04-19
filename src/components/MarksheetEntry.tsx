import { useState, useEffect, useMemo } from "react";
import DunnesHeader from "./DunnesHeader";
import signature from "@/assets/principal-signature.png";
import { STUDENTS_BY_CLASS, ACADEMIC_SUBJECTS, getTeacherForClass } from "@/data/schoolData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Student {
  grNo: string;
  name: string;
  rollNo: string;
  marks: Record<string, number>;
}

interface MarksheetEntryProps {
  selectedClass: string;
  selectedTerm: string;
  userMobile?: string;
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

const MarksheetEntry = ({ selectedClass, selectedTerm, userMobile }: MarksheetEntryProps) => {
  const subjects = ACADEMIC_SUBJECTS[selectedClass] || ACADEMIC_SUBJECTS["Class 1"];
  const maxMarks = 100;
  const classTeacher = getTeacherForClass(selectedClass);

  const baseStudents = useMemo<Student[]>(() => {
    const csvStudents = STUDENTS_BY_CLASS[selectedClass] || [];
    return csvStudents.map((s, idx) => ({
      grNo: s.grNo,
      name: s.name,
      rollNo: s.rollNo || String(idx + 1),
      marks: Object.fromEntries(subjects.map((sub) => [sub, 0])) as Record<string, number>,
    }));
  }, [selectedClass]);

  const [students, setStudents] = useState<Student[]>(baseStudents);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string>("");
  const [savedAt, setSavedAt] = useState<string>("");

  // Load existing marks from Cloud whenever class/term changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setStudents(baseStudents);
      const { data, error } = await supabase
        .from("marks")
        .select("gr_no, subject, marks")
        .eq("class_name", selectedClass)
        .eq("term", selectedTerm);

      if (cancelled) return;
      if (error) {
        toast.error("Could not load saved marks.");
        console.error(error);
      } else if (data) {
        const map: Record<string, Record<string, number>> = {};
        data.forEach((row) => {
          map[row.gr_no] ||= {};
          map[row.gr_no][row.subject] = row.marks;
        });
        setStudents((prev) =>
          prev.map((s) => ({ ...s, marks: { ...s.marks, ...(map[s.grNo] || {}) } }))
        );
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedTerm, baseStudents]);

  const persistMark = async (
    student: Student,
    subject: string,
    value: number
  ) => {
    const key = `${student.grNo}-${subject}`;
    setSavingKey(key);
    const { error } = await supabase.from("marks").upsert(
      {
        class_name: selectedClass,
        term: selectedTerm,
        gr_no: student.grNo,
        student_name: student.name,
        subject,
        marks: value,
        entered_by_mobile: userMobile || null,
      },
      { onConflict: "class_name,term,gr_no,subject" }
    );
    setSavingKey("");
    if (error) {
      console.error(error);
      toast.error(`Save failed for ${student.name} – ${subject}`);
    } else {
      setSavedAt(new Date().toLocaleTimeString());
    }
  };

  const updateMark = (grNo: string, subject: string, value: number) => {
    const clamped = Math.min(maxMarks, Math.max(0, value));
    setStudents((prev) =>
      prev.map((s) =>
        s.grNo === grNo ? { ...s, marks: { ...s.marks, [subject]: clamped } } : s
      )
    );
    const student = students.find((s) => s.grNo === grNo);
    if (student) persistMark({ ...student, marks: { ...student.marks, [subject]: clamped } }, subject, clamped);
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
        <div className="mb-4 text-xs text-muted-foreground flex justify-between">
          <span>Class Teacher: <strong>{classTeacher}</strong></span>
          <span className="text-primary font-semibold">
            {loading
              ? "Loading from cloud…"
              : savingKey
              ? "Saving…"
              : savedAt
              ? `✓ Cloud-saved at ${savedAt}`
              : "✓ Loaded from cloud"}
          </span>
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
                        disabled={loading}
                        className="w-10 text-center outline-none bg-transparent font-medium text-[11px] disabled:opacity-50"
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
