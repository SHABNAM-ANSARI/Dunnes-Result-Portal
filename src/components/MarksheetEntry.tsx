import { useState, useEffect, useMemo } from "react";
import DunnesHeader from "./DunnesHeader";
import signature from "@/assets/principal-signature.png";
import { STUDENTS_BY_CLASS, getTeacherForClass } from "@/data/schoolData";
import {
  getSubjectsForClass,
  GRADE_OPTIONS,
  type GradeValue,
  type SubjectDef,
} from "@/data/subjectMapping";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ResultCard from "./ResultCard";

interface Student {
  grNo: string;
  name: string;
  rollNo: string;
  marks: Record<string, number>; // numeric for regular subjects
  grades: Record<string, GradeValue | "">; // grade for credit subjects
}

interface RemarksRow {
  remarks: string;
  teacherSignature: string;
  principalSignature: string;
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

const MAX_MARKS = 100;

const MarksheetEntry = ({ selectedClass, selectedTerm, userMobile }: MarksheetEntryProps) => {
  const subjects: SubjectDef[] = useMemo(() => getSubjectsForClass(selectedClass), [selectedClass]);
  const regularSubjects = useMemo(() => subjects.filter((s) => s.type === "regular"), [subjects]);
  const creditSubjects = useMemo(() => subjects.filter((s) => s.type === "credit"), [subjects]);
  const classTeacher = getTeacherForClass(selectedClass);

  const baseStudents = useMemo<Student[]>(() => {
    const csvStudents = STUDENTS_BY_CLASS[selectedClass] || [];
    return csvStudents.map((s, idx) => ({
      grNo: s.grNo,
      name: s.name,
      rollNo: s.rollNo || String(idx + 1),
      marks: Object.fromEntries(regularSubjects.map((sub) => [sub.name, 0])),
      grades: Object.fromEntries(creditSubjects.map((sub) => [sub.name, ""])) as Record<string, GradeValue | "">,
    }));
  }, [selectedClass, regularSubjects, creditSubjects]);

  const [students, setStudents] = useState<Student[]>(baseStudents);
  const [remarksByGr, setRemarksByGr] = useState<Record<string, RemarksRow>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string>("");
  const [savedAt, setSavedAt] = useState<string>("");
  const [previewGrNo, setPreviewGrNo] = useState<string>("");

  // Load saved marks + remarks
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setStudents(baseStudents);
      setRemarksByGr({});

      const [marksRes, remarksRes] = await Promise.all([
        supabase
          .from("marks")
          .select("gr_no, subject, marks, grade")
          .eq("class_name", selectedClass)
          .eq("term", selectedTerm),
        supabase
          .from("student_term_remarks")
          .select("gr_no, remarks, teacher_signature, principal_signature")
          .eq("class_name", selectedClass)
          .eq("term", selectedTerm),
      ]);

      if (cancelled) return;

      if (marksRes.error) {
        toast.error("Could not load saved marks.");
        console.error(marksRes.error);
      } else if (marksRes.data) {
        const marksMap: Record<string, Record<string, number>> = {};
        const gradeMap: Record<string, Record<string, GradeValue>> = {};
        marksRes.data.forEach((row: any) => {
          if (row.marks !== null && row.marks !== undefined) {
            marksMap[row.gr_no] ||= {};
            marksMap[row.gr_no][row.subject] = row.marks;
          }
          if (row.grade) {
            gradeMap[row.gr_no] ||= {};
            gradeMap[row.gr_no][row.subject] = row.grade;
          }
        });
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            marks: { ...s.marks, ...(marksMap[s.grNo] || {}) },
            grades: { ...s.grades, ...(gradeMap[s.grNo] || {}) },
          })),
        );
      }

      if (!remarksRes.error && remarksRes.data) {
        const map: Record<string, RemarksRow> = {};
        remarksRes.data.forEach((row: any) => {
          map[row.gr_no] = {
            remarks: row.remarks || "",
            teacherSignature: row.teacher_signature || "",
            principalSignature: row.principal_signature || "",
          };
        });
        setRemarksByGr(map);
      }

      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedTerm, baseStudents]);

  const persistEntry = async (
    student: Student,
    subject: SubjectDef,
    numericValue: number | null,
    gradeValue: GradeValue | "" | null,
  ) => {
    const key = `${student.grNo}-${subject.name}`;
    setSavingKey(key);
    const { error } = await supabase.from("marks").upsert(
      {
        class_name: selectedClass,
        term: selectedTerm,
        gr_no: student.grNo,
        student_name: student.name,
        subject: subject.name,
        marks: subject.type === "regular" ? numericValue ?? 0 : null,
        grade: subject.type === "credit" ? (gradeValue || null) : null,
        entered_by_mobile: userMobile || null,
      },
      { onConflict: "class_name,term,gr_no,subject" },
    );
    setSavingKey("");
    if (error) {
      console.error(error);
      toast.error(`Save failed for ${student.name} – ${subject.name}`);
    } else {
      setSavedAt(new Date().toLocaleTimeString());
    }
  };

  const updateMark = (grNo: string, subject: SubjectDef, value: number) => {
    const clamped = Math.min(MAX_MARKS, Math.max(0, value));
    let updated: Student | undefined;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.grNo !== grNo) return s;
        updated = { ...s, marks: { ...s.marks, [subject.name]: clamped } };
        return updated;
      }),
    );
    if (updated) persistEntry(updated, subject, clamped, null);
  };

  const updateGrade = (grNo: string, subject: SubjectDef, value: GradeValue | "") => {
    let updated: Student | undefined;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.grNo !== grNo) return s;
        updated = { ...s, grades: { ...s.grades, [subject.name]: value } };
        return updated;
      }),
    );
    if (updated) persistEntry(updated, subject, null, value);
  };

  const persistRemarks = async (student: Student, row: RemarksRow) => {
    const { error } = await supabase.from("student_term_remarks").upsert(
      {
        class_name: selectedClass,
        term: selectedTerm,
        gr_no: student.grNo,
        student_name: student.name,
        remarks: row.remarks,
        teacher_signature: row.teacherSignature,
        principal_signature: row.principalSignature,
        entered_by_mobile: userMobile || null,
      },
      { onConflict: "class_name,term,gr_no" },
    );
    if (error) {
      console.error(error);
      toast.error(`Could not save remarks for ${student.name}`);
    } else {
      setSavedAt(new Date().toLocaleTimeString());
    }
  };

  const updateRemark = (student: Student, field: keyof RemarksRow, value: string) => {
    const current = remarksByGr[student.grNo] || { remarks: "", teacherSignature: "", principalSignature: "" };
    const next = { ...current, [field]: value };
    setRemarksByGr((prev) => ({ ...prev, [student.grNo]: next }));
  };

  const blurSaveRemark = (student: Student) => {
    const row = remarksByGr[student.grNo];
    if (row) persistRemarks(student, row);
  };

  const getNumericTotal = (m: Record<string, number>) =>
    regularSubjects.reduce((sum, sub) => sum + (m[sub.name] || 0), 0);
  const getNumericPct = (m: Record<string, number>) =>
    regularSubjects.length === 0 ? 0 : (getNumericTotal(m) / (regularSubjects.length * MAX_MARKS)) * 100;

  const previewStudent = students.find((s) => s.grNo === previewGrNo);

  return (
    <div className="mt-10 report-card p-6 shadow-2xl rounded-xl print:shadow-none">
      <DunnesHeader />
      <div className="flex flex-wrap gap-4 justify-between mb-4 font-bold text-sm text-primary">
        <span>CLASS: {selectedClass}</span>
        <span>TERM: {selectedTerm}</span>
        <span>STUDENTS: {students.length}</span>
        <span>MAX MARKS: {MAX_MARKS}/subject</span>
      </div>
      {classTeacher && (
        <div className="mb-4 text-xs text-muted-foreground flex justify-between">
          <span>
            Class Teacher: <strong>{classTeacher}</strong>
          </span>
          <span className="text-primary font-semibold">
            {loading
              ? "Loading from cloud…"
              : savingKey
                ? "Saving…"
                : savedAt
                  ? `✓ Saved at ${savedAt}`
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
              {regularSubjects.map((sub) => (
                <th key={sub.name} className="border border-primary/50 p-2 uppercase text-[9px]" title="Numeric / 100">
                  {sub.name}
                </th>
              ))}
              {creditSubjects.map((sub) => (
                <th
                  key={sub.name}
                  className="border border-primary/50 p-2 uppercase text-[9px] bg-accent/40"
                  title="Credit subject – grade only"
                >
                  {sub.name}
                </th>
              ))}
              <th className="border border-primary/50 p-2">TOTAL</th>
              <th className="border border-primary/50 p-2">%</th>
              <th className="border border-primary/50 p-2">GRADE</th>
              <th className="border border-primary/50 p-2 min-w-[12rem]">REMARKS</th>
              <th className="border border-primary/50 p-2">PREVIEW</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => {
              const total = getNumericTotal(student.marks);
              const pct = getNumericPct(student.marks);
              const remarkRow = remarksByGr[student.grNo] || {
                remarks: "",
                teacherSignature: "",
                principalSignature: "",
              };
              return (
                <tr key={student.grNo} className="hover:bg-primary/5 transition">
                  <td className="border border-primary/30 p-1 text-center text-[10px]">{idx + 1}</td>
                  <td className="border border-primary/30 p-1 text-center font-bold text-[10px]">{student.grNo}</td>
                  <td className="border border-primary/30 p-2 uppercase font-semibold text-[10px] whitespace-nowrap">
                    {student.name}
                  </td>

                  {regularSubjects.map((sub) => (
                    <td key={sub.name} className="border border-primary/30 p-1 text-center">
                      <input
                        type="number"
                        min={0}
                        max={MAX_MARKS}
                        value={student.marks[sub.name] || ""}
                        onChange={(e) => updateMark(student.grNo, sub, Number(e.target.value))}
                        disabled={loading}
                        className="w-12 text-center outline-none bg-transparent font-medium text-[11px] disabled:opacity-50"
                      />
                    </td>
                  ))}

                  {creditSubjects.map((sub) => (
                    <td key={sub.name} className="border border-primary/30 p-1 text-center bg-accent/10">
                      <select
                        value={student.grades[sub.name] || ""}
                        onChange={(e) => updateGrade(student.grNo, sub, e.target.value as GradeValue | "")}
                        disabled={loading}
                        className="bg-transparent text-[11px] font-bold outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">—</option>
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}

                  <td className="border border-primary/30 p-2 text-center font-bold">{total}</td>
                  <td className="border border-primary/30 p-2 text-center font-semibold">{pct.toFixed(1)}</td>
                  <td className="border border-primary/30 p-2 text-center font-black text-primary">
                    {getGrade(pct)}
                  </td>

                  <td className="border border-primary/30 p-1">
                    <textarea
                      value={remarkRow.remarks}
                      onChange={(e) => updateRemark(student, "remarks", e.target.value)}
                      onBlur={() => blurSaveRemark(student)}
                      placeholder="Teacher's remarks…"
                      rows={2}
                      className="w-full text-[10px] p-1 outline-none bg-transparent border border-primary/20 rounded resize-y min-h-[2.5rem]"
                    />
                    <div className="flex gap-1 mt-1">
                      <input
                        type="text"
                        value={remarkRow.teacherSignature}
                        onChange={(e) => updateRemark(student, "teacherSignature", e.target.value)}
                        onBlur={() => blurSaveRemark(student)}
                        placeholder="Teacher sign"
                        className="w-1/2 text-[9px] p-1 outline-none bg-transparent border border-primary/20 rounded"
                      />
                      <input
                        type="text"
                        value={remarkRow.principalSignature}
                        onChange={(e) => updateRemark(student, "principalSignature", e.target.value)}
                        onBlur={() => blurSaveRemark(student)}
                        placeholder="Principal sign"
                        className="w-1/2 text-[9px] p-1 outline-none bg-transparent border border-primary/20 rounded"
                      />
                    </div>
                  </td>

                  <td className="border border-primary/30 p-1 text-center">
                    <button
                      onClick={() => setPreviewGrNo(previewGrNo === student.grNo ? "" : student.grNo)}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      {previewGrNo === student.grNo ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-[10px] text-muted-foreground italic">
        Tip: Numeric marks are out of {MAX_MARKS}. Credit subjects (highlighted) accept a grade only. Changes auto-save
        as you type / select.
      </div>

      <div className="mt-10 flex justify-between px-4 print:hidden">
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

      {previewStudent && (
        <div className="mt-10">
          <ResultCard
            student={previewStudent}
            className={selectedClass}
            term={selectedTerm}
            classTeacher={classTeacher}
            regularSubjects={regularSubjects}
            creditSubjects={creditSubjects}
            remarks={remarksByGr[previewStudent.grNo]?.remarks || ""}
            teacherSignature={remarksByGr[previewStudent.grNo]?.teacherSignature || ""}
            principalSignature={remarksByGr[previewStudent.grNo]?.principalSignature || ""}
          />
        </div>
      )}
    </div>
  );
};

export default MarksheetEntry;
