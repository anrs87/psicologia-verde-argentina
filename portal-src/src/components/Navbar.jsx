import React from 'react';
import { signOut, auth } from '../firebase';
import { LogOut, ArrowLeft, User, Library, Compass } from 'lucide-react';

export default function Navbar({ user, activeTab, setActiveTab, onOpenAuthModal }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <header className="border-b border-[#232f23] bg-[#0A0D0A]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo e Identidad */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            title="Volver al sitio principal"
            className="flex items-center gap-2 group text-xs text-[#8F9B8D] hover:text-[#8EB486] transition mr-3"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
            <span className="hidden sm:inline">Web Principal</span>
          </a>

          <div className="h-4 w-px bg-[#232f23] hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌿</span>
            <div>
              <span className="font-serif text-sm font-semibold text-[#E2E8F0] tracking-wide block leading-none">
                PSICOLOGÍA VEGANA
              </span>
              <span className="text-[10px] text-[#8EB486] font-mono tracking-wider">
                PORTAL TERAPÉUTICO
              </span>
            </div>
          </div>
        </div>

        {/* Tabs de Navegación (Visibles siempre para permitir explorar libremente) */}
        <div className="flex items-center bg-[#141a14] p-1 rounded-xl border border-[#232f23]">
          <button
            onClick={() => setActiveTab('biblioteca')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'biblioteca'
                ? 'bg-[#8EB486] text-[#0A0D0A] font-semibold shadow'
                : 'text-[#8F9B8D] hover:text-[#E2E8F0]'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Mi biblioteca</span>
          </button>
          <button
            onClick={() => setActiveTab('explorar')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'explorar'
                ? 'bg-[#8EB486] text-[#0A0D0A] font-semibold shadow'
                : 'text-[#8F9B8D] hover:text-[#E2E8F0]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explorar recursos</span>
          </button>
        </div>

        {/* Perfil & Logout o Iniciar Sesión */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-medium text-[#E2E8F0] truncate max-w-[150px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-[#8F9B8D] truncate max-w-[150px]">
                {user.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl bg-[#141a14] border border-[#232f23] text-[#8F9B8D] hover:text-red-400 hover:border-red-500/30 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="px-3.5 py-1.5 rounded-xl bg-[#8EB486]/15 hover:bg-[#8EB486]/25 border border-[#8EB486]/30 text-[#8EB486] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Iniciar sesión</span>
          </button>
        )}
      </div>
    </header>
  );
}
