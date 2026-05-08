import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import signature from "@/assets/principal-signature.png";
import DunnesHeader from "./DunnesHeader";
import {
  type GradeValue,
  type SubjectDef,
  MAX_MARKS,
  PASSING_MARKS,
  computeTotal,
  computeMaxTotal,
  computePercentage,
  getOverallResult,
} from "@/data/subjectMapping";

interface ResultCardStudent {
  grNo: string;
  name: string;
  rollNo: string;
  marks: Record<string, number>;
  grades: Record<string, GradeValue | "">;
}

interface ResultCardProps {
  student: ResultCardStudent;
  className: string;
  term: string;
  classTeacher: string;
  regularSubjects: SubjectDef[];
  creditSubjects: SubjectDef[];
  remarks: string;
  teacherSignature: string;
  principalSignature: string;
  onTermChange?: (term: string) => void;
}

const TERMS = ["Term 1", "Term 2", "Term 3", "Result Summary"];

const getOverallGrade = (pct: number): string => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "E";
};

const DottedField = ({ label, width = "w-32" }: { label: string; width?: string }) => (
  <div className="flex items-end gap-1">
    <span className="font-bold text-primary whitespace-nowrap">{label}:</span>
    <span
      className={`${width} inline-block border-b border-dotted border-primary h-4`}
    />
  </div>
);

const ResultCard = ({
  student,
  className,
  term,
  classTeacher,
  regularSubjects,
  creditSubjects,
  remarks,
  teacherSignature,
  principalSignature,
  onTermChange,
}: ResultCardProps) => {
  const [activeTerm, setActiveTerm] = useState(term);
  const [summaryMarks, setSummaryMarks] = useState<Record<string, Record<string, number>>>({});

  const total = computeTotal(student.marks, regularSubjects);
  const max = computeMaxTotal(regularSubjects);
  const pct = computePercentage(student.marks, regularSubjects);
  const overall = getOverallGrade(pct);
  const result = getOverallResult(student.marks, regularSubjects);

  const handleTerm = (t: string) => {
    setActiveTerm(t);
    if (t !== "Result Summary") onTermChange?.(t);
  };

  // Fetch all 3 terms when Result Summary tab is opened
  useEffect(() => {
    if (activeTerm !== "Result Summary") return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("marks")
        .select("term, subject, marks")
        .eq("class_name", className)
        .eq("gr_no", student.grNo);
      if (cancelled || error || !data) return;
      const map: Record<string, Record<string, number>> = {
        "Term 1": {}, "Term 2": {}, "Term 3": {},
      };
      data.forEach((row: any) => {
        if (row.marks == null) return;
        if (!map[row.term]) map[row.term] = {};
        map[row.term][row.subject] = row.marks;
      });
      setSummaryMarks(map);
    })();
    return () => { cancelled = true; };
  }, [activeTerm, className, student.grNo]);

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          html, body { width: 297mm; height: 210mm; overflow: hidden; }
          body * { visibility: hidden; }
          .result-card-print, .result-card-print * { visibility: visible; }
          .result-card-print {
            position: absolute; left: 0; top: 0;
            width: 281mm; height: 194mm;
            padding: 0; margin: 0;
            page-break-after: avoid;
            page-break-inside: avoid;
            overflow: hidden;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Term navigation tabs */}
      <div className="no-print flex items-center justify-center gap-2 mb-3 print:hidden">
        {TERMS.map((t) => (
          <button
            key={t}
            onClick={() => handleTerm(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold border-2 transition ${
              activeTerm === t
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-primary border-primary/40 hover:bg-primary/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        className="result-card-print border-2 border-primary rounded-xl p-4 shadow-xl bg-white print:shadow-none text-[11px] leading-tight text-primary"
        style={{ minHeight: "194mm" }}
      >
        <div className="scale-90 origin-top">
          <DunnesHeader />
        </div>

        {/* Student info bar — single line, no wrap */}
        <div className="flex flex-nowrap items-center gap-3 text-[10px] border border-primary rounded p-1.5 mb-2 whitespace-nowrap overflow-hidden">
          <div className="flex-1 min-w-0 truncate"><span className="text-primary">Name: </span><span className="font-bold uppercase">{student.name}</span></div>
          <div className="shrink-0"><span className="text-primary">GR: </span><span className="font-bold">{student.grNo}</span></div>
          <div className="shrink-0"><span className="text-primary">Roll: </span><span className="font-bold">{student.rollNo}</span></div>
          <div className="flex-1 min-w-0 truncate"><span className="text-primary">Class Teacher: </span><span className="font-bold uppercase">{classTeacher || "—"}</span></div>
          <div className="shrink-0"><span className="text-primary">Term: </span><span className="font-black uppercase">{activeTerm}</span></div>
        </div>

        {activeTerm === "Result Summary" ? (
          <div>
            <h3 className="font-bold text-primary text-[11px] mb-1 uppercase">
              Annual Result Summary (All Terms Consolidated)
            </h3>
            <table className="w-full border border-primary text-[10px]">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-primary px-1 py-0.5 text-left">Subject Name</th>
                  <th className="border border-primary px-1 py-0.5 w-16">Term 1</th>
                  <th className="border border-primary px-1 py-0.5 w-16">Term 2</th>
                  <th className="border border-primary px-1 py-0.5 w-16">Term 3</th>
                  <th className="border border-primary px-1 py-0.5 w-20">Grand Total</th>
                  <th className="border border-primary px-1 py-0.5 w-20">Annual Grade</th>
                </tr>
              </thead>
              <tbody>
                {regularSubjects.map((sub) => {
                  const t1 = Number(summaryMarks["Term 1"]?.[sub.name]) || 0;
                  const t2 = Number(summaryMarks["Term 2"]?.[sub.name]) || 0;
                  const t3 = Number(summaryMarks["Term 3"]?.[sub.name]) || 0;
                  const grand = t1 + t2 + t3;
                  const subjPct = (grand / (MAX_MARKS * 3)) * 100;
                  return (
                    <tr key={sub.name}>
                      <td className="border border-primary px-1 py-0.5 uppercase">{sub.name}</td>
                      <td className="border border-primary px-1 py-0.5 text-center">{t1}</td>
                      <td className="border border-primary px-1 py-0.5 text-center">{t2}</td>
                      <td className="border border-primary px-1 py-0.5 text-center">{t3}</td>
                      <td className="border border-primary px-1 py-0.5 text-center font-bold">{grand}</td>
                      <td className="border border-primary px-1 py-0.5 text-center font-black">{getOverallGrade(subjPct)}</td>
                    </tr>
                  );
                })}
                {(() => {
                  const sum = (term: string) =>
                    regularSubjects.reduce((a, s) => a + (Number(summaryMarks[term]?.[s.name]) || 0), 0);
                  const t1 = sum("Term 1"), t2 = sum("Term 2"), t3 = sum("Term 3");
                  const grand = t1 + t2 + t3;
                  const maxAll = MAX_MARKS * regularSubjects.length * 3;
                  const annualPct = maxAll > 0 ? (grand / maxAll) * 100 : 0;
                  return (
                    <tr className="font-black bg-primary/10">
                      <td className="border border-primary px-1 py-0.5">GRAND TOTAL</td>
                      <td className="border border-primary px-1 py-0.5 text-center">{t1}</td>
                      <td className="border border-primary px-1 py-0.5 text-center">{t2}</td>
                      <td className="border border-primary px-1 py-0.5 text-center">{t3}</td>
                      <td className="border border-primary px-1 py-0.5 text-center">{grand}/{maxAll}</td>
                      <td className="border border-primary px-1 py-0.5 text-center">{getOverallGrade(annualPct)} ({annualPct.toFixed(1)}%)</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        ) : (
        /* Two-column subjects layout */
        <div className="grid grid-cols-2 gap-3">
          {/* Scholastic */}
          <div>
            <h3 className="font-bold text-primary text-[11px] mb-1 uppercase">
              Scholastic Areas (Pass = {PASSING_MARKS}/{MAX_MARKS})
            </h3>
            <table className="w-full border border-primary text-[10px]">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-primary px-1 py-0.5 text-left">Subject</th>
                  <th className="border border-primary px-1 py-0.5 w-12">Marks</th>
                  <th className="border border-primary px-1 py-0.5 w-10">Max</th>
                  <th className="border border-primary px-1 py-0.5 w-10">P/F</th>
                </tr>
              </thead>
              <tbody>
                {regularSubjects.map((sub) => {
                  const m = Number(student.marks[sub.name]) || 0;
                  const pass = m >= PASSING_MARKS;
                  return (
                    <tr key={sub.name}>
                      <td className="border border-primary px-1 py-0.5 uppercase">{sub.name}</td>
                      <td className="border border-primary px-1 py-0.5 text-center font-semibold">{m}</td>
                      <td className="border border-primary px-1 py-0.5 text-center">{MAX_MARKS}</td>
                      <td className="border border-primary px-1 py-0.5 text-center font-bold">{pass ? "P" : "F"}</td>
                    </tr>
                  );
                })}
                <tr className="font-black bg-primary/10">
                  <td className="border border-primary px-1 py-0.5">TOTAL</td>
                  <td className="border border-primary px-1 py-0.5 text-center">{total}</td>
                  <td className="border border-primary px-1 py-0.5 text-center">{max}</td>
                  <td className="border border-primary px-1 py-0.5 text-center">—</td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-4 gap-1 mt-1 text-[10px]">
              <div className="border border-primary rounded px-1 py-0.5 text-center">
                <div className="text-primary text-[9px]">Total</div>
                <div className="font-black">{total}/{max}</div>
              </div>
              <div className="border border-primary rounded px-1 py-0.5 text-center">
                <div className="text-primary text-[9px]">Percentage</div>
                <div className="font-black">{pct.toFixed(1)}%</div>
              </div>
              <div className="border border-primary rounded px-1 py-0.5 text-center">
                <div className="text-primary text-[9px]">Grade</div>
                <div className="font-black">{overall}</div>
              </div>
              <div className="border border-primary rounded px-1 py-0.5 text-center bg-primary text-primary-foreground">
                <div className="text-[9px]">Result</div>
                <div className="font-black">{result}</div>
              </div>
            </div>
          </div>

          {/* Co-Scholastic */}
          <div>
            <h3 className="font-bold text-primary text-[11px] mb-1 uppercase">Co-Scholastic Areas (Grade)</h3>
            <table className="w-full border border-primary text-[10px]">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-primary px-1 py-0.5 text-left">Subject</th>
                  <th className="border border-primary px-1 py-0.5 w-14">Grade</th>
                </tr>
              </thead>
              <tbody>
                {creditSubjects.map((sub) => (
                  <tr key={sub.name}>
                    <td className="border border-primary px-1 py-0.5 uppercase">{sub.name}</td>
                    <td className="border border-primary px-1 py-0.5 text-center font-bold">{student.grades[sub.name] || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Remarks block */}
            <div className="mt-2 border border-primary rounded px-1.5 py-1 text-[10px]" style={{ minHeight: "3.2rem" }}>
              <div className="font-bold text-primary text-[9px] uppercase mb-0.5">Teacher's Remarks</div>
              <div className="whitespace-pre-wrap leading-snug">
                {remarks || <em>—</em>}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance / Promoted To / Reopens On */}
        <div className="mt-3 grid grid-cols-3 gap-4 text-[10px] border-t border-b border-primary py-2">
          <DottedField label="Attendance" width="w-28" />
          <DottedField label="Promoted To" width="w-28" />
          <DottedField label="School Reopens On" width="w-28" />
        </div>

        {/* Signatures */}
        <div className="mt-3 grid grid-cols-3 gap-4 text-center text-[10px]">
          <div>
            <div className="h-10 flex items-end justify-center italic">
              {teacherSignature || classTeacher || ""}
            </div>
            <div className="border-t border-primary pt-0.5 font-bold uppercase">Teacher's Signature</div>
          </div>
          <div>
            <div className="h-10" />
            <div className="border-t border-primary pt-0.5 font-bold uppercase">Parent's Signature</div>
          </div>
          <div>
            <img src={signature} alt="Principal" className="h-10 mx-auto" />
            <div className="border-t border-primary pt-0.5 font-bold uppercase">
              {principalSignature || "Principal's Signature"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center print:hidden no-print">
        <button
          onClick={() => window.print()}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition"
        >
          🖨️ Print Result Card (A4 Landscape – 1 Page)
        </button>
      </div>
    </>
  );
};

export default ResultCard;
