import Sidebar from "@/components/layout/Sidebar";

export default function RecepcionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-neutral-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white rounded-2xl mt-2 mr-2 mb-2">
        {children}
      </main>
    </div>
  );
}
