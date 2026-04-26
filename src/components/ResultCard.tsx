import signature from "@/assets/principal-signature.png";
import DunnesHeader from "./DunnesHeader";
import type { GradeValue, SubjectDef } from "@/data/subjectMapping";

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

const MAX_MARKS = 100;

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
 * Landscape (horizontal) Result Card.
 * Optimised for A4 landscape printing — when printed, the page is rotated.
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
  const total = regularSubjects.reduce((sum, s) => sum + (student.marks[s.name] || 0), 0);
  const max = regularSubjects.length * MAX_MARKS;
  const pct = max ? (total / max) * 100 : 0;
  const overall = getOverallGrade(pct);

  return (
    <>
      {/* Force landscape on print */}
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } }`}</style>

      <div className="report-card border-2 border-primary rounded-xl p-6 shadow-xl bg-card print:shadow-none print:border-primary">
        <DunnesHeader />

        <div className="text-center mb-4">
          <div className="inline-block px-4 py-1 bg-primary text-primary-foreground text-sm font-black uppercase tracking-wider rounded">
            Result Card – {term}
          </div>
        </div>

        {/* Student info bar */}
        <div className="grid grid-cols-4 gap-3 text-xs border border-primary/40 rounded-lg p-3 mb-4 bg-primary/5">
          <div>
            <div className="text-muted-foreground">Name</div>
            <div className="font-bold uppercase">{student.name}</div>
          </div>
          <div>
            <div className="text-muted-foreground">GR No</div>
            <div className="font-bold">{student.grNo}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Class</div>
            <div className="font-bold">{className}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Roll No</div>
            <div className="font-bold">{student.rollNo}</div>
          </div>
        </div>

        {/* Two-column layout: regular subjects left, credit subjects right */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-primary text-sm mb-2 uppercase">Scholastic Areas</h3>
            <table className="w-full border border-primary/50 text-xs">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-primary/40 p-2 text-left">Subject</th>
                  <th className="border border-primary/40 p-2 w-20">Marks</th>
                  <th className="border border-primary/40 p-2 w-16">Max</th>
                </tr>
              </thead>
              <tbody>
                {regularSubjects.map((sub) => (
                  <tr key={sub.name} className="hover:bg-primary/5">
                    <td className="border border-primary/30 p-2 uppercase">{sub.name}</td>
                    <td className="border border-primary/30 p-2 text-center font-semibold">
                      {student.marks[sub.name] || 0}
                    </td>
                    <td className="border border-primary/30 p-2 text-center text-muted-foreground">{MAX_MARKS}</td>
                  </tr>
                ))}
                <tr className="bg-primary/10 font-black">
                  <td className="border border-primary/40 p-2">TOTAL</td>
                  <td className="border border-primary/40 p-2 text-center">{total}</td>
                  <td className="border border-primary/40 p-2 text-center">{max}</td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div className="border border-primary/40 rounded p-2 text-center bg-primary/5">
                <div className="text-muted-foreground">Percentage</div>
                <div className="font-black text-primary text-lg">{pct.toFixed(1)}%</div>
              </div>
              <div className="border border-primary/40 rounded p-2 text-center bg-primary/5">
                <div className="text-muted-foreground">Overall Grade</div>
                <div className="font-black text-primary text-lg">{overall}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-primary text-sm mb-2 uppercase">Co-Scholastic Areas (Credit)</h3>
            <table className="w-full border border-primary/50 text-xs">
              <thead>
                <tr className="bg-accent text-accent-foreground">
                  <th className="border border-primary/40 p-2 text-left">Subject</th>
                  <th className="border border-primary/40 p-2 w-20">Grade</th>
                </tr>
              </thead>
              <tbody>
                {creditSubjects.map((sub) => (
                  <tr key={sub.name} className="hover:bg-accent/10">
                    <td className="border border-primary/30 p-2 uppercase">{sub.name}</td>
                    <td className="border border-primary/30 p-2 text-center font-bold">
                      {student.grades[sub.name] || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 border border-primary/40 rounded p-2 bg-card text-xs min-h-[6rem]">
              <div className="font-bold text-primary text-[11px] uppercase mb-1">Teacher's Remarks</div>
              <div className="whitespace-pre-wrap text-foreground">{remarks || <em className="text-muted-foreground">No remarks recorded.</em>}</div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-6 grid grid-cols-3 gap-6 text-center text-[11px]">
          <div>
            <div className="h-12 flex items-end justify-center font-handwriting italic text-foreground">
              {teacherSignature || classTeacher}
            </div>
            <div className="border-t border-foreground pt-1 font-bold uppercase">Class Teacher</div>
          </div>
          <div>
            <div className="h-12" />
            <div className="border-t border-foreground pt-1 font-bold uppercase">Parent's Signature</div>
          </div>
          <div>
            <img src={signature} alt="Principal" className="h-12 mx-auto opacity-70" />
            <div className="border-t border-foreground pt-1 font-bold uppercase">
              {principalSignature || "Principal"}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition"
          >
            🖨️ Print Result Card (Landscape)
          </button>
        </div>
      </div>
    </>
  );
};

export default ResultCard;
