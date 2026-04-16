import { useState } from "react";
import MarksheetEntry from "./MarksheetEntry";

interface DashboardProps {
  onLogout: () => void;
}

const CLASSES = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [showEntry, setShowEntry] = useState(false);

  return (
    <div className="min-h-screen p-6 bg-background">
      <nav className="flex justify-between items-center mb-8 bg-card p-4 rounded-xl shadow-sm">
        <span className="font-black text-primary text-lg">DUNNE'S PORTAL</span>
        <button onClick={onLogout} className="text-destructive font-bold text-sm hover:underline">
          Logout
        </button>
      </nav>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card p-8 rounded-xl shadow-md border border-primary/10">
          <h2 className="text-xl font-bold text-primary mb-6">Portal Setup (From CSV Files)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="font-bold text-primary mb-1">1. Student Master Data</p>
              <p className="text-xs text-muted-foreground">Connected: Students_Master.csv</p>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
              <p className="font-bold text-accent-foreground mb-1">2. Subject Mapping</p>
              <p className="text-xs text-muted-foreground">Connected: Subject_Mapping.csv</p>
            </div>
          </div>

          <div className="mt-8">
            <label className="block mb-2 font-bold text-foreground text-sm">Select Class for Result Entry:</label>
            <select
              className="input-field"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setShowEntry(false);
              }}
            >
              <option value="">Choose Class...</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={() => selectedClass && setShowEntry(true)}
              disabled={!selectedClass}
              className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Marksheet Based on Mapping
            </button>
          </div>
        </div>

        {showEntry && <MarksheetEntry selectedClass={selectedClass} />}
      </div>
    </div>
  );
};

export default Dashboard;
