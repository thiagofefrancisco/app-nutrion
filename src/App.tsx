import React, { useEffect, useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { getActiveSession } from '@/lib/neon-auth';
import type { NutricionistaUser } from '@/types/auth';
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [user, setUser] = useState<NutricionistaUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Regra: Manter a sessão ativa para que ele não precise fazer login toda vez que abrir o sistema
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const session = await getActiveSession();
        if (isMounted) {
          if (session && session.user) {
            setUser(session.user);
            setCurrentView('dashboard');
          } else {
            setUser(null);
            setCurrentView('login');
          }
        }
      } catch (err) {
        console.error('[NutriOn] Erro ao verificar sessão inicial:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Regra: Se já estiver logado e tentar acessar a tela de login, redirecionar direto para o dashboard
  useEffect(() => {
    if (user && (currentView === 'login' || currentView === 'register')) {
      setCurrentView('dashboard');
    }
  }, [user, currentView]);

  const handleAuthSuccess = (authenticatedUser: NutricionistaUser) => {
    setUser(authenticatedUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  // Tela de carregamento suave inicial
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#FFF1E4] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D7A49A] to-[#B97F74] text-white flex items-center justify-center shadow-lg shadow-[#D7A49A]/30">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg text-[#2C211E] font-['Outfit']">
              Nutri<span className="text-[#D7A49A]">On</span>
            </h3>
            <p className="text-xs text-[#7A6963] mt-0.5">
              Verificando autenticação no Neon...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard do nutricionista autenticado
  if (user && currentView === 'dashboard') {
    return <DashboardView user={user} onLogout={handleLogout} />;
  }

  // Telas de Autenticação (Login ou Cadastro)
  return (
    <div className="relative min-h-screen w-full bg-[#FFF1E4] flex flex-col justify-between overflow-x-hidden">
      {/* Decorative Warm Ambient Elements */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#D7A49A]/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#D7A49A]/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] rounded-full bg-white/40 blur-2xl"
        aria-hidden="true"
      />

      {/* Main Authentication Flow Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        {currentView === 'login' ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onNavigateToRegister={() => setCurrentView('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        )}
      </div>

      {/* Subtle Bottom Credit */}
      <footer className="relative z-10 py-5 text-center text-xs text-[#7A6963]">
        <p>
          NutriOn &copy; 2026 &bull; Conectado ao Neon Auth &bull; Thiago Nutri
        </p>
      </footer>
    </div>
  );
}

export default App;
