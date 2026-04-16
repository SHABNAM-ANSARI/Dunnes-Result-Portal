import logo from "@/assets/dunnes-logo.jpeg";

const DunnesHeader = () => (
  <div className="text-center border-b-2 border-primary pb-4 mb-6">
    <img src={logo} alt="Dunne's Institute Logo" className="w-16 h-16 mx-auto mb-2 rounded" />
    <h1 className="text-3xl font-black text-primary uppercase">DUNNE'S INSTITUTE</h1>
    <p className="text-[10px] font-bold text-primary/80 tracking-tight">
      Recognised I.C.S.E. School | Mumbai - 400 005
    </p>
    <div className="mt-3 bg-primary text-primary-foreground py-1 px-6 inline-block rounded-full text-xs font-bold uppercase">
      Academic Management System 2025-26
    </div>
  </div>
);

export default DunnesHeader;
