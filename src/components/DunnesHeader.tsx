import logo from "@/assets/dunnes-logo.jpeg";

const DunnesHeader = () => (
  <div className="text-center border-b-2 border-black pb-4 mb-6 print:border-black">
    <img src={logo} alt="Dunne's Institute Logo" className="w-16 h-16 mx-auto mb-2 rounded print:opacity-100" />
    <h1 className="text-3xl font-black uppercase text-black print:text-black tracking-wide">
      DUNNE'S INSTITUTE
    </h1>
    <p className="text-[11px] font-bold text-black print:text-black mt-0.5">
      (Behramgore Anklesaria Education Foundation)
    </p>
    <p className="text-[11px] font-bold text-black print:text-black tracking-tight mt-1">
      Admiralty House, Wodehouse Road, Colaba, Mumbai - 400 005
    </p>
    <p className="text-[10px] font-bold text-black print:text-black tracking-tight">
      Recognised I.C.S.E. School
    </p>
    <div className="mt-3 bg-black text-white py-1 px-6 inline-block rounded-full text-xs font-bold uppercase print:bg-black print:text-white">
      Academic Management System 2025-26
    </div>
  </div>
);

export default DunnesHeader;
