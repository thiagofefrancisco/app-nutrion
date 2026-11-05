import React, { useState } from 'react';
import {
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  RefreshCw,
  Sparkles,
  ChevronRight,
  UserCheck,
  CalendarDays,
  CheckCircle2,
  Phone,
  Mail,
  ArrowUpRight,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { DashboardStats, PacienteSemRetorno } from '@/types/dashboard';
import type { NutricionistaUser } from '@/types/auth';

interface DashboardOverviewProps {
  user: NutricionistaUser;
  stats: DashboardStats;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectPaciente: (pacienteId: string) => void;
  onNavigateToPacientes: () => void;
  onSeedDemoData: () => Promise<void>;
  isSeeding: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  stats,
  isLoading,
  onRefresh,
  onSelectPaciente,
  onNavigateToPacientes,
  onSeedDemoData,
  isSeeding,
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Top Welcome & Real-Time Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#EBDAD2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#999B84] uppercase tracking-wider capitalize">
              {currentDateFormatted}
            </span>
            <span className="text-xs text-[#7A6963]">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Neon Realtime
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2C211E] font-['Outfit'] tracking-tight">
            Dashboard Geral
          </h1>
          <p className="text-sm text-[#7A6963] mt-0.5">
            Visão consolidada da sua rotina clínica, consultas e acompanhamento de pacientes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]"
          >
            Atualizar Dados
          </Button>

          {stats.totalPacientesAtivos === 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSeedDemoData}
              isLoading={isSeeding}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
              className="text-xs bg-[#999B84] hover:bg-[#858771] text-white shadow-sm"
            >
              Criar Dados de Demonstração
            </Button>
          )}
        </div>
      </div>

      {/* Cards 1 e 2: Métricas Principais em Destaque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: Total de pacientes ativos */}
        <div
          onClick={onNavigateToPacientes}
          className="group relative overflow-hidden bg-white rounded-3xl p-7 border border-[#EBDAD2] shadow-sm hover:shadow-md hover:border-[#999B84]/50 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#999B84]/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#7A6963] uppercase tracking-wider block mb-1">
                Card 1 &bull; Pacientes
              </span>
              <h3 className="text-lg font-bold text-[#2C211E] font-['Outfit']">
                Total de Pacientes Ativos
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#999B84]/15 text-[#656E52] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-5xl font-black text-[#2C211E] font-['Outfit'] tracking-tight">
              {isLoading ? (
                <span className="text-3xl text-[#999B84] animate-pulse">...</span>
              ) : (
                stats.totalPacientesAtivos
              )}
            </span>
            <span className="text-sm font-semibold text-[#7A6963]">
              {stats.totalPacientesAtivos === 1 ? 'paciente sob cuidados' : 'pacientes cadastrados'}
            </span>
          </div>

          <div className="mt-6 pt-4 border-t border-[#F2E8E2] flex items-center justify-between text-xs text-[#999B84] font-semibold group-hover:text-[#2C211E] transition-colors">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#999B84]" />
              Exclusivos da sua conta no Neon
            </span>
            <div className="flex items-center gap-1">
              <span>Ver todos</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* CARD 2: Consultas da semana */}
        <div className="group relative overflow-hidden bg-white rounded-3xl p-7 border border-[#EBDAD2] shadow-sm hover:shadow-md hover:border-[#D7A49A]/60 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFF1E4] rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#7A6963] uppercase tracking-wider block mb-1">
                Card 2 &bull; Agenda
              </span>
              <h3 className="text-lg font-bold text-[#2C211E] font-['Outfit']">
                Consultas da Semana
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1E4] text-[#B97F74] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#D7A49A]/30">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-5xl font-black text-[#2C211E] font-['Outfit'] tracking-tight">
              {isLoading ? (
                <span className="text-3xl text-[#D7A49A] animate-pulse">...</span>
              ) : (
                stats.consultasSemana
              )}
            </span>
            <span className="text-sm font-semibold text-[#7A6963]">
              {stats.consultasSemana === 1 ? 'atendimento registrado' : 'atendimentos nesta semana'}
            </span>
          </div>

          <div className="mt-6 pt-4 border-t border-[#F2E8E2] flex items-center justify-between text-xs text-[#7A6963]">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#D7A49A]" />
              Semana atual (Segunda a Domingo)
            </span>
            <span className="text-[11px] font-medium text-[#7A6963] bg-[#FFF1E4] px-2 py-0.5 rounded-md">
              Sincronizado
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: Pacientes sem retorno */}
      <div className="bg-white rounded-3xl border border-[#EBDAD2] shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-6 sm:p-7 border-b border-[#EBDAD2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFDFB]">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#2C211E] font-['Outfit']">
                  Card 3 &bull; Pacientes sem Retorno
                </h3>
                {stats.pacientesSemRetorno.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {stats.pacientesSemRetorno.length}{' '}
                    {stats.pacientesSemRetorno.length === 1 ? 'pendente' : 'pendentes'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7A6963] mt-0.5">
                Pacientes cuja última consulta foi realizada há mais de 30 dias e que não possuem
                próximo retorno agendado.
              </p>
            </div>
          </div>
        </div>

        {/* Card Content: List or Empty Message */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#7A6963]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#999B84]" />
              <p className="text-xs">Consultando dados no Neon...</p>
            </div>
          ) : stats.pacientesSemRetorno.length === 0 ? (
            /* Regra do Prompt: Se não houver pacientes sem retorno, exibir a mensagem "Nenhum paciente sem retorno no momento" */
            <div className="py-12 px-4 rounded-2xl bg-[#FFFDF9] border border-dashed border-[#EBDAD2] flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-[#2C211E] font-['Outfit']">
                Nenhum paciente sem retorno no momento
              </h4>
              <p className="text-xs text-[#7A6963] max-w-sm mt-1">
                Excelente! Todos os seus pacientes consultados possuem retornos futuros agendados
                ou estão dentro do prazo de 30 dias.
              </p>
            </div>
          ) : (
            /* Lista de Pacientes Sem Retorno (Clicáveis para abrir perfil do paciente) */
            <div className="divide-y divide-[#F2E8E2]">
              {stats.pacientesSemRetorno.map((item) => {
                const dataUltimaFormatada = item.ultima_consulta
                  ? new Date(item.ultima_consulta).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Data não registrada';

                return (
                  <div
                    key={item.paciente_id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF1E4] text-[#935A50] font-bold text-sm flex items-center justify-center shrink-0 border border-[#D7A49A]/30">
                        {item.paciente_nome.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        {/* Nome do paciente clicável que redireciona/abre o perfil */}
                        <button
                          onClick={() => onSelectPaciente(item.paciente_id)}
                          className="text-left font-bold text-sm text-[#2C211E] hover:text-[#999B84] transition-colors flex items-center gap-1.5 group-hover:underline underline-offset-2"
                        >
                          <span>{item.paciente_nome}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#999B84] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A6963] mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Última consulta:{' '}
                            <strong className="text-[#2C211E]">{dataUltimaFormatada}</strong>
                          </span>

                          <span className="text-[#D7A49A]">&bull;</span>

                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                            {item.dias_sem_consulta} dias sem retorno
                          </span>

                          {item.paciente_telefone && (
                            <>
                              <span className="text-[#D7A49A]">&bull;</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#7A6963]" />
                                {item.paciente_telefone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => onSelectPaciente(item.paciente_id)}
                        className="text-xs bg-[#FFF1E4] text-[#935A50] hover:bg-[#F8E1CF] border border-[#D7A49A]/30"
                      >
                        Ver Perfil / Agendar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
