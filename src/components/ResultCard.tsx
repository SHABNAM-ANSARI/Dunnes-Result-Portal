import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import signature from "@/assets/principal-signature.png";
import { useEffect, useState } from "react";
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

const getIcsGrade = (mark: number): string => getOverallGrade(mark);

/**
 * Single-page A4 LANDSCAPE result card.
 * Tight spacing + small fonts so it never spills onto a second page.
 */
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
}: ResultCardProps) => {
  const [activeTerm, setActiveTerm] = useState(term);
  const [summaryMarks, setSummaryMarks] = useState<Record<string, Record<string, number>>>({});
  const [summaryGrades, setSummaryGrades] = useState<Record<string, Record<string, string>>>({});

  const total = computeTotal(student.marks, regularSubjects);
  const max = computeMaxTotal(regularSubjects);

  const getTermMark = (subjectName: string, termNo?: 1 | 2 | 3): string | null => {
    const normalizeKey = (key: string) =>
      key
        .trim()
        .toUpperCase()
        .replace(/[\s_-]+/g, "")
        .replace(/[^A-Z0-9]/g, "");

    const subjectKey = normalizeKey(subjectName);
    const marksEntries = Object.entries(student.marks ?? {});
    const marksMap = new Map(marksEntries.map(([k, v]) => [normalizeKey(k), String(v)]));

    if (!termNo) {
      return marksMap.get(subjectKey) ?? null;
    }

    const roman = termNo === 1 ? "I" : termNo === 2 ? "II" : "III";
    const candidateKeys = [
      `${subjectName} TERM ${termNo}`,
      `${subjectName} TERM${termNo}`,
      `${subjectName} T${termNo}`,
      `${subjectName} ${termNo}`,
      `TERM ${termNo} ${subjectName}`,
      `T${termNo} ${subjectName}`,
      `${subjectName} TERM ${roman}`,
      `${subjectName} TERM${roman}`,
      `TERM ${roman} ${subjectName}`,
    ].map(normalizeKey);

    for (const key of candidateKeys) {
      const val = marksMap.get(key);
      if (val != null) return val;
    }

    const termPatterns = [
      `TERM${termNo}`,
      `T${termNo}`,
      `${termNo}TERM`,
      `${termNo}STTERM`,
      `${termNo}NDTERM`,
      `${termNo}RDTERM`,
      `TERM${roman}`,
      `${roman}TERM`,
    ];

    for (const [key, value] of marksEntries) {
      const normalizedKey = normalizeKey(key);
      const matchesSubject = normalizedKey.includes(subjectKey);
      const matchesTerm = termPatterns.some((pattern) => normalizedKey.includes(pattern));
      if (matchesSubject && matchesTerm) {
        return String(value);
      }
    }

    return null;
  };

  const renderTermMark = (subjectName: string, termNo?: 1 | 2 | 3): string => {
    return getTermMark(subjectName, termNo) ?? "-";
  };

  const getNumericTermMark = (subjectName: string, termNo: 1 | 2 | 3): number => {
    return Number(getTermMark(subjectName, termNo) ?? 0);
  };

  const term1Total = (regularSubjects ?? []).reduce((sum, sub) => sum + getNumericTermMark(sub.name, 1), 0);
  const term2Total = (regularSubjects ?? []).reduce((sum, sub) => sum + getNumericTermMark(sub.name, 2), 0);
  const term3Total = (regularSubjects ?? []).reduce((sum, sub) => sum + getNumericTermMark(sub.name, 3), 0);
  const threeTermTotal = (regularSubjects ?? []).reduce((sum, sub) => {
    const t1 = getNumericTermMark(sub.name, 1);
    const t2 = getNumericTermMark(sub.name, 2);
    const t3 = getNumericTermMark(sub.name, 3);
    return sum + (Number(t1) + Number(t2) + Number(t3));
  }, 0);
  const subjectThreeTermMax = MAX_MARKS * 3;
  const allSubjectsThreeTermMax = subjectThreeTermMax * regularSubjects.length;
  const selectedTermNo: 1 | 2 | 3 = activeView === "term1" ? 1 : activeView === "term2" ? 2 : 3;
  const selectedTermTotal = selectedTermNo === 1 ? term1Total : selectedTermNo === 2 ? term2Total : term3Total;
  const selectedTermMax = MAX_MARKS * regularSubjects.length;
  const selectedTermPct = selectedTermMax ? (selectedTermTotal / selectedTermMax) * 100 : 0;
  const selectedTermResult = regularSubjects.some((s) => getNumericTermMark(s.name, selectedTermNo) < PASSING_MARKS)
    ? "FAIL"
    : "PASS";
  const cardTitle =
    activeView === "final"
      ? "Final Result"
      : activeView === "term1"
      ? "Term 1"
      : activeView === "term2"
      ? "Term 2"
      : "Term 3";
  const attendance =
    student.marks?.attendance ??
    student.marks?.ATTENDANCE ??
    student.marks?.Attendance ??
    student.marks?.["Total Attendance"] ??
    student.marks?.["TOTAL ATTENDANCE"] ??
    "—";
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
        .select("term, subject, marks, grade")
        .eq("class_name", className)
        .eq("gr_no", student.grNo);
      if (cancelled || error || !data) return;
      const map: Record<string, Record<string, number>> = {
        "Term 1": {}, "Term 2": {}, "Term 3": {},
      };
      const gmap: Record<string, Record<string, string>> = {
        "Term 1": {}, "Term 2": {}, "Term 3": {},
      };
      data.forEach((row: any) => {
        if (!map[row.term]) map[row.term] = {};
        if (!gmap[row.term]) gmap[row.term] = {};
        if (row.marks != null) map[row.term][row.subject] = row.marks;
        if (row.grade) gmap[row.term][row.subject] = row.grade;
      });
      setSummaryMarks(map);
      setSummaryGrades(gmap);
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
          .result-card-print-shell {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .result-card-print, .result-card-print * { visibility: visible; }
          .result-card-print {
            position: relative;
            width: 281mm;
            height: 194mm;
            padding: 0;
            margin: 0;
            page-break-after: avoid;
            page-break-inside: avoid;
            overflow: hidden;
            transform: scale(0.97);
            transform-origin: center center;
          }
        }
      `}</style>

      <div className="result-card-print-shell w-full min-h-screen flex items-center justify-center px-3 print:px-0 overflow-hidden">
        <div
          className="result-card-print w-full max-w-[281mm] border-2 border-primary rounded-xl p-4 shadow-xl bg-card print:shadow-none print:border-primary text-[11px] leading-tight mx-auto"
          style={{ minHeight: "194mm" }}
        >
          <div className="relative border-b-2 border-slate-800 pb-2 mb-2">
            <div className="text-center px-16">
              <img src="/logo.png" onError={(e) => { e.currentTarget.src = 'https://lovable.dev/placeholder.svg'; }} className="h-20 w-20 mx-auto mb-2" />
              <div className="text-[16px] font-black tracking-wide text-slate-900">
                DUNNE'S INSTITUTE
              </div>
              <div className="text-[11px] font-bold text-slate-700 -mt-0.5">
                (Behramgore Anklesaria Education Foundation)
              </div>
              <div className="text-[9px] text-slate-600 mt-0.5">
                Admiralty House, Wodehouse Road, Colaba, Mumbai - 400005
              </div>
              <div className="text-[9px] text-slate-600 flex justify-center gap-3 mt-0.5">
                <span>Contact: 7020981168</span>
                <span>|</span>
                <span className="font-bold">RECOGNISED I.C.S.E. SCHOOL</span>
              </div>
            </div>
          </div>

          <div className="text-center -mt-2 mb-2">
            <div className="inline-block px-3 py-0.5 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded">
              Result Card – {cardTitle} • {className}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 mb-2 print:hidden">
            {[
              { key: "term1", label: "Term 1" },
              { key: "term2", label: "Term 2" },
              { key: "term3", label: "Term 3" },
              { key: "final", label: "Final Result" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key as TermView)}
                className={`px-2.5 py-0.5 rounded border text-[10px] font-bold transition ${
                  activeView === tab.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-primary/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

      <div
        className="result-card-print border-2 border-primary rounded-xl p-4 shadow-xl bg-white print:shadow-none text-[11px] leading-tight text-primary flex flex-col"
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

            {/* Co-Scholastic subjects across all terms */}
            <h3 className="font-bold text-primary text-[11px] mt-3 mb-1 uppercase">
              Co-Scholastic Areas (All Terms)
            </h3>
            <table className="w-full border border-primary text-[10px]">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-primary px-1 py-0.5 text-left">Subject Name</th>
                  <th className="border border-primary px-1 py-0.5 w-16">Term 1</th>
                  <th className="border border-primary px-1 py-0.5 w-16">Term 2</th>
                  <th className="border border-primary px-1 py-0.5 w-16">Term 3</th>
                  <th className="border border-primary px-1 py-0.5 w-20">Annual Grade</th>
                </tr>
              </thead>
              <tbody>
                {creditSubjects.map((sub) => {
                  const g1 = summaryGrades["Term 1"]?.[sub.name] || student.grades[sub.name] || "—";
                  const g2 = summaryGrades["Term 2"]?.[sub.name] || "—";
                  const g3 = summaryGrades["Term 3"]?.[sub.name] || "—";
                  // Annual grade = best (most recent non-empty) or last term if available
                  const annual = [g3, g2, g1].find((g) => g && g !== "—") || "—";
                  return (
                    <tr key={sub.name}>
                      <td className="border border-primary px-1 py-0.5 uppercase">{sub.name}</td>
                      <td className="border border-primary px-1 py-0.5 text-center font-bold">{g1}</td>
                      <td className="border border-primary px-1 py-0.5 text-center font-bold">{g2}</td>
                      <td className="border border-primary px-1 py-0.5 text-center font-bold">{g3}</td>
                      <td className="border border-primary px-1 py-0.5 text-center font-black">{annual}</td>
                    </tr>
                  );
                })}
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

              <div className="grid grid-cols-3 gap-1 mt-1 text-[10px]">
                <div className="border border-primary/40 rounded px-1 py-0.5 text-center bg-primary/5">
                  <div className="text-muted-foreground text-[9px]">Total</div>
                  <div className="font-black text-primary">
                    {activeView === "final" ? `${threeTermTotal}/${allSubjectsThreeTermMax}` : `${selectedTermTotal}/${selectedTermMax}`}
                  </div>
                </div>
                <div className="border border-primary/40 rounded px-1 py-0.5 text-center bg-primary/5">
                  <div className="text-muted-foreground text-[9px]">Percentage</div>
                  <div className="font-black text-primary">
                    {activeView === "final" ? ((threeTermTotal / (allSubjectsThreeTermMax || 1)) * 100).toFixed(1) : selectedTermPct.toFixed(1)}%
                  </div>
                </div>
                <div className="border border-primary/40 rounded px-1 py-0.5 text-center bg-primary/5">
                  <div className="text-muted-foreground text-[9px]">{activeView === "final" ? "Grade" : "Result"}</div>
                  <div className="font-black text-primary">
                    {activeView === "final" ? getOverallGrade((threeTermTotal / (allSubjectsThreeTermMax || 1)) * 100) : selectedTermResult}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-primary text-[11px] mb-1 uppercase">Co-Scholastic Areas (Grade)</h3>
              <table className="w-full border border-primary/50 text-[10px]">
                <thead>
                  <tr className="bg-accent text-accent-foreground">
                    <th className="border border-primary/40 px-1 py-0.5 text-left">Subject</th>
                    <th className="border border-primary/40 px-1 py-0.5 w-14">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {creditSubjects?.map((sub) => (
                    <tr key={sub.name}>
                      <td className="border border-primary/30 px-1 py-0.5 uppercase">{sub.name}</td>
                      <td className="border border-primary/30 px-1 py-0.5 text-center font-bold">
                        {student.grades[sub.name] || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-2 border border-primary/40 rounded px-1.5 py-1 bg-card text-[10px]" style={{ minHeight: "3.2rem" }}>
                <div className="font-bold text-primary text-[9px] uppercase mb-0.5">Teacher's Remarks</div>
                <div className="whitespace-pre-wrap text-foreground leading-snug">
                  {remarks || <em className="text-muted-foreground">—</em>}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Footer pinned to bottom: Attendance / Promoted / Signatures */}
        <div className="mt-auto pt-6">
          {/* Attendance / Promoted To / Reopens On */}
          <div className="grid grid-cols-3 gap-4 text-[10px] border-t border-b border-primary py-3">
            <DottedField label="Attendance" width="w-28" />
            <DottedField label="Promoted To" width="w-28" />
            <DottedField label="School Reopens On" width="w-28" />
          </div>

          {/* Signatures */}
          <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[10px] items-end">
            <div>
              <div className="h-14 flex items-end justify-center italic">
                {teacherSignature || classTeacher || ""}
              </div>
              <div className="border-t border-primary pt-1 font-bold uppercase">Teacher's Signature</div>
            </div>
            <div>
              <div className="h-14" />
              <div className="border-t border-primary pt-1 font-bold uppercase">Parent's Signature</div>
            </div>
            <div>
              <img src={signature} alt="Principal" className="h-14 mx-auto object-contain" />
              <div className="border-t border-primary pt-1 font-bold uppercase">
                {principalSignature || "Principal's Signature"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center print:hidden">
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
