import React, { useEffect, useState, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar, type NavTab } from '@/components/layout/Sidebar';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { PacientesView } from '@/components/pacientes/PacientesView';
import { Logo } from '@/components/Logo';
import { logoutNutricionista, getNutricionistaProfile } from '@/lib/neon-auth';
import { getDashboardStats, seedDemoData } from '@/lib/dashboard-service';
import type { NutricionistaUser, NutricionistaProfile } from '@/types/auth';
import type { DashboardStats } from '@/types/dashboard';

interface DashboardViewProps {
  user: NutricionistaUser;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onLogout }) => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [profile, setProfile] = useState<NutricionistaProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPacientesAtivos: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  // Perfil do paciente selecionado para abrir o modal de detalhes
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);

  // Controle de menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ID do nutricionista no banco de dados Neon (chave estrangeira em pacientes)
  const activeNutricionistaId = profile?.id || user.id;

  // Carrega estatísticas do dashboard em tempo real do Neon
  const loadStats = useCallback(async (nutriId: string) => {
    setIsLoadingStats(true);
    try {
      const data = await getDashboardStats(nutriId);
      setStats(data);
    } catch (err) {
      console.error('[NutriOn] Erro ao carregar estatísticas do Neon:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Busca perfil e dados iniciais
  useEffect(() => {
    let isMounted = true;

    async function initDashboard() {
      try {
        const dbProfile = await getNutricionistaProfile(user.email);
        if (isMounted && dbProfile) {
          setProfile(dbProfile);
          await loadStats(dbProfile.id);
        } else if (isMounted) {
          await loadStats(user.id);
        }
      } catch (err) {
        console.error('[NutriOn] Erro na inicialização do dashboard:', err);
      }
    }

    initDashboard();

    return () => {
      isMounted = false;
    };
  }, [user.email, user.id, loadStats]);

  const handleRefresh = async () => {
    if (activeNutricionistaId) {
      await loadStats(activeNutricionistaId);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutNutricionista();
      onLogout();
    } catch (err) {
      console.error('[NutriOn] Erro ao deslogar:', err);
      onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSeedDemoData = async () => {
    if (!activeNutricionistaId) return;
    setIsSeedingDemo(true);
    try {
      await seedDemoData(activeNutricionistaId);
      await loadStats(activeNutricionistaId);
    } catch (err) {
      console.error('[NutriOn] Erro ao criar dados de demonstração:', err);
    } finally {
      setIsSeedingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF1E4] text-[#2C211E] flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header (Visível apenas em telas pequenas) */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EBDAD2] px-4 py-3 flex items-center justify-between shadow-sm">
        <Logo size="sm" showSubtitle={false} />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-[#FFF1E4] text-[#2C211E] hover:bg-[#F0DFC0] transition-colors"
          aria-label="Abrir menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu Lateral Fixo (Desktop) */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setSelectedPacienteId(null);
          }}
          user={user}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          totalPacientes={stats.totalPacientesAtivos}
        />
      </div>

      {/* Menu Lateral Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-4/5 max-w-xs h-full bg-white shadow-2xl">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setSelectedPacienteId(null);
                setIsMobileMenuOpen(false);
              }}
              user={user}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
              totalPacientes={stats.totalPacientesAtivos}
            />
          </div>
        </div>
      )}

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-y-auto">
        {currentTab === 'dashboard' ? (
          <DashboardOverview
            user={user}
            stats={stats}
            isLoading={isLoadingStats}
            onRefresh={handleRefresh}
            onSelectPaciente={(pacienteId) => {
              setSelectedPacienteId(pacienteId);
              setCurrentTab('pacientes');
            }}
            onNavigateToPacientes={() => {
              setSelectedPacienteId(null);
              setCurrentTab('pacientes');
            }}
            onSeedDemoData={handleSeedDemoData}
            isSeeding={isSeedingDemo}
          />
        ) : (
          <PacientesView
            nutricionistaId={activeNutricionistaId}
            initialPacienteId={selectedPacienteId}
            onSelectPaciente={(pacienteId) => setSelectedPacienteId(pacienteId)}
            onDataChanged={() => handleRefresh()}
          />
        )}
      </main>
    </div>
  );
};
