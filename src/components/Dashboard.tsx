import { useState } from "react";
import MarksheetEntry from "./MarksheetEntry";
import { CLASS_OPTIONS, TERM_OPTIONS, STUDENTS_BY_CLASS, getTeacherForClass } from "@/data/schoolData";

interface DashboardProps {
  onLogout: () => void;
  userEmail: string;
  isAdmin: boolean;
}

const Dashboard = ({ onLogout, userEmail, isAdmin }: DashboardProps) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [showEntry, setShowEntry] = useState(false);

  const studentCount = selectedClass ? (STUDENTS_BY_CLASS[selectedClass]?.length || 0) : 0;
  const classTeacher = selectedClass ? getTeacherForClass(selectedClass) : "";

  return (
    <div className="min-h-screen p-6 bg-background">
      <nav className="flex justify-between items-center mb-8 bg-card p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-black text-primary text-lg">DUNNE'S PORTAL</span>
          <span className={`text-xs font-bold px-2 py-1 rounded ${isAdmin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {isAdmin ? "ADMIN" : "TEACHER"}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{userEmail}</span>
        </div>
        <button onClick={onLogout} className="text-destructive font-bold text-sm hover:underline">
          Logout
        </button>
      </nav>

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-card p-8 rounded-xl shadow-md border border-primary/10">
          <h2 className="text-xl font-bold text-primary mb-6">
            {isAdmin ? "Portal Setup (From CSV Files)" : "Marksheet Entry"}
          </h2>

          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="font-bold text-primary mb-1">1. Student Master Data</p>
                <p className="text-xs text-muted-foreground">Connected: Students_Master.csv</p>
                <p className="text-xs text-primary font-semibold mt-1">291 students loaded</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
                <p className="font-bold text-accent-foreground mb-1">2. Subject Mapping</p>
                <p className="text-xs text-muted-foreground">Connected: Subject_Maping.csv</p>
                <p className="text-xs text-primary font-semibold mt-1">10 classes mapped</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="font-bold text-accent-foreground mb-1">3. Teacher Database</p>
                <p className="text-xs text-muted-foreground">Connected: Teacher_Database.csv</p>
                <p className="text-xs text-primary font-semibold mt-1">15 teachers loaded</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-bold text-foreground text-sm">Select Class:</label>
              <select
                className="input-field"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setShowEntry(false);
                }}
              >
                <option value="">Choose Class...</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 font-bold text-foreground text-sm">Select Term:</label>
              <select
                className="input-field"
                value={selectedTerm}
                onChange={(e) => {
                  setSelectedTerm(e.target.value);
                  setShowEntry(false);
                }}
              >
                <option value="">Choose Term...</option>
                {TERM_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedClass && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg text-sm">
              <span className="font-bold text-primary">Students: {studentCount}</span>
              {classTeacher && <span className="ml-4 text-muted-foreground">Class Teacher: <strong>{classTeacher}</strong></span>}
            </div>
          )}

          <button
            onClick={() => selectedClass && selectedTerm && setShowEntry(true)}
            disabled={!selectedClass || !selectedTerm}
            className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Marksheet Based on Mapping
          </button>
        </div>

        {showEntry && <MarksheetEntry selectedClass={selectedClass} selectedTerm={selectedTerm} />}
      </div>
    </div>
  );
};

export default Dashboard;
