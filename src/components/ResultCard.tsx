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
}

const getOverallGrade = (pct: number): string => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "E";
};

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
  const total = computeTotal(student.marks, regularSubjects);
  const max = computeMaxTotal(regularSubjects);
  const pct = computePercentage(student.marks, regularSubjects);
  const overall = getOverallGrade(pct);
  const result = getOverallResult(student.marks, regularSubjects);

  return (
    <>
      {/* Force ONE A4 landscape page on print + scale to fit */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          html, body { width: 297mm; height: 210mm; }
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
        }
      `}</style>

      <div
        className="result-card-print border-2 border-primary rounded-xl p-4 shadow-xl bg-card print:shadow-none print:border-primary text-[11px] leading-tight"
        style={{ minHeight: "194mm" }}
      >
        <div className="scale-90 origin-top">
          <DunnesHeader />
        </div>

        <div className="text-center -mt-2 mb-2">
          <div className="inline-block px-3 py-0.5 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded">
            Result Card – {term} • {className}
          </div>
        </div>

        {/* Student info bar — compact */}
        <div className="grid grid-cols-5 gap-2 text-[10px] border border-primary/40 rounded p-1.5 mb-2 bg-primary/5">
          <div><span className="text-muted-foreground">Name: </span><span className="font-bold uppercase">{student.name}</span></div>
          <div><span className="text-muted-foreground">GR: </span><span className="font-bold">{student.grNo}</span></div>
          <div><span className="text-muted-foreground">Roll: </span><span className="font-bold">{student.rollNo}</span></div>
          <div><span className="text-muted-foreground">Class Teacher: </span><span className="font-bold uppercase">{classTeacher || "—"}</span></div>
          <div><span className="text-muted-foreground">Result: </span><span className={`font-black ${result === "PASS" ? "text-primary" : "text-destructive"}`}>{result}</span></div>
        </div>

        {/* Two-column subjects layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Scholastic */}
          <div>
            <h3 className="font-bold text-primary text-[11px] mb-1 uppercase">Scholastic Areas (Pass = {PASSING_MARKS}/100)</h3>
            <table className="w-full border border-primary/50 text-[10px]">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-primary/40 px-1 py-0.5 text-left">Subject</th>
                  <th className="border border-primary/40 px-1 py-0.5 w-12">Marks</th>
                  <th className="border border-primary/40 px-1 py-0.5 w-10">Max</th>
                  <th className="border border-primary/40 px-1 py-0.5 w-10">P/F</th>
                </tr>
              </thead>
              <tbody>
                {regularSubjects.map((sub) => {
                  const m = Number(student.marks[sub.name]) || 0;
                  const pass = m >= PASSING_MARKS;
                  return (
                    <tr key={sub.name}>
                      <td className="border border-primary/30 px-1 py-0.5 uppercase">{sub.name}</td>
                      <td className="border border-primary/30 px-1 py-0.5 text-center font-semibold">{m}</td>
                      <td className="border border-primary/30 px-1 py-0.5 text-center text-muted-foreground">{MAX_MARKS}</td>
                      <td className={`border border-primary/30 px-1 py-0.5 text-center font-bold ${pass ? "text-primary" : "text-destructive"}`}>{pass ? "P" : "F"}</td>
                    </tr>
                  );
                })}
                <tr className="bg-primary/10 font-black">
                  <td className="border border-primary/40 px-1 py-0.5">TOTAL</td>
                  <td className="border border-primary/40 px-1 py-0.5 text-center">{total}</td>
                  <td className="border border-primary/40 px-1 py-0.5 text-center">{max}</td>
                  <td className="border border-primary/40 px-1 py-0.5 text-center">—</td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-3 gap-1 mt-1 text-[10px]">
              <div className="border border-primary/40 rounded px-1 py-0.5 text-center bg-primary/5">
                <div className="text-muted-foreground text-[9px]">Total</div>
                <div className="font-black text-primary">{total}/{max}</div>
              </div>
              <div className="border border-primary/40 rounded px-1 py-0.5 text-center bg-primary/5">
                <div className="text-muted-foreground text-[9px]">Percentage</div>
                <div className="font-black text-primary">{pct.toFixed(1)}%</div>
              </div>
              <div className="border border-primary/40 rounded px-1 py-0.5 text-center bg-primary/5">
                <div className="text-muted-foreground text-[9px]">Grade</div>
                <div className="font-black text-primary">{overall}</div>
              </div>
            </div>
          </div>

          {/* Co-Scholastic */}
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
                {creditSubjects.map((sub) => (
                  <tr key={sub.name}>
                    <td className="border border-primary/30 px-1 py-0.5 uppercase">{sub.name}</td>
                    <td className="border border-primary/30 px-1 py-0.5 text-center font-bold">{student.grades[sub.name] || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Remarks block */}
            <div className="mt-2 border border-primary/40 rounded px-1.5 py-1 bg-card text-[10px]" style={{ minHeight: "3.2rem" }}>
              <div className="font-bold text-primary text-[9px] uppercase mb-0.5">Teacher's Remarks</div>
              <div className="whitespace-pre-wrap text-foreground leading-snug">
                {remarks || <em className="text-muted-foreground">—</em>}
              </div>
            </div>
          </div>
        </div>

        {/* Signatures — three columns at bottom */}
        <div className="mt-3 grid grid-cols-3 gap-4 text-center text-[10px]">
          <div>
            <div className="h-10 flex items-end justify-center italic text-foreground">
              {teacherSignature || classTeacher || ""}
            </div>
            <div className="border-t border-foreground pt-0.5 font-bold uppercase">Teacher's Signature</div>
          </div>
          <div>
            <div className="h-10" />
            <div className="border-t border-foreground pt-0.5 font-bold uppercase">Parent's Signature</div>
          </div>
          <div>
            <img src={signature} alt="Principal" className="h-10 mx-auto opacity-70" />
            <div className="border-t border-foreground pt-0.5 font-bold uppercase">
              {principalSignature || "Principal's Signature"}
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
