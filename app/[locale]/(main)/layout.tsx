import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col overflow-x-hidden relative font-sans selection:bg-purple-500/30">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-blue-900/20 to-purple-900/10 blur-[100px] rounded-full pointer-events-none" />
      
      <Header />
      <div className="flex-1 pb-20 relative z-20">
        {children}
      </div>
      <Footer />
    </div>
  );
}
