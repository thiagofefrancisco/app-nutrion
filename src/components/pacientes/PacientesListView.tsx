import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Calendar,
  Target,
  ChevronRight,
  Clock,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDateBR } from '@/lib/formatters';
import type { Paciente } from '@/types/dashboard';

interface PacientesListViewProps {
  pacientes: Paciente[];
  isLoading: boolean;
  onNovoPaciente: () => void;
  onSelectPaciente: (pacienteId: string) => void;
}

export const PacientesListView: React.FC<PacientesListViewProps> = ({
  pacientes,
  isLoading,
  onNovoPaciente,
  onSelectPaciente,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtro de busca por nome (case insensitive)
  const filteredPacientes = pacientes.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.nome.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.telefone && p.telefone.includes(q))
    );
  });

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBDAD2]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#999B84]/15 text-[#555E47] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C211E] font-['Outfit']">
              Pacientes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#7A6963] mt-1">
            Consulte a listagem dos seus pacientes, histórico clínico e realize novos cadastros.
          </p>
        </div>

        {/* Botão Novo Paciente que redireciona para o formulário de cadastro */}
        <Button
          onClick={onNovoPaciente}
          className="bg-[#999B84] hover:bg-[#858771] text-white shadow-md shadow-[#999B84]/20 self-start sm:self-auto px-5 py-2.5 rounded-2xl font-semibold transition-all hover:scale-[1.02]"
          leftIcon={<Plus className="w-4 h-4 text-white" />}
        >
          Novo Paciente
        </Button>
      </div>

      {/* Campo de Busca por Nome no topo da listagem */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6963]" />
        <input
          type="text"
          placeholder="Buscar paciente por nome..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-[#EBDAD2] text-sm text-[#2C211E] placeholder:text-[#7A6963]/60 focus:outline-none focus:ring-2 focus:ring-[#999B84] shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#7A6963] hover:text-[#2C211E] rounded-full hover:bg-[#FFF1E4]"
            title="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Indicador de Contagem */}
      <div className="flex items-center justify-between text-xs text-[#7A6963] px-1">
        <span>
          {isLoading
            ? 'Carregando pacientes...'
            : `${filteredPacientes.length} ${
                filteredPacientes.length === 1 ? 'paciente encontrado' : 'pacientes cadastrados'
              }`}
        </span>
      </div>

      {/* Estado: Carregando */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#7A6963] bg-white rounded-3xl border border-[#EBDAD2]/80">
          <div className="w-10 h-10 rounded-2xl bg-[#999B84]/15 flex items-center justify-center">
            <Clock className="w-5 h-5 animate-spin text-[#999B84]" />
          </div>
          <p className="text-sm font-medium">Carregando lista de pacientes do Neon...</p>
        </div>
      ) : pacientes.length === 0 ? (
        /* Regra: Se não houver pacientes cadastrados, exibir "Nenhum paciente cadastrado ainda" */
        <div className="p-12 sm:p-16 rounded-3xl bg-white border border-[#EBDAD2] text-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#FFF1E4] border border-[#EBDAD2] text-[#999B84] flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Users className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="font-bold text-lg text-[#2C211E] font-['Outfit']">
            Nenhum paciente cadastrado ainda
          </h3>
          <p className="text-xs sm:text-sm text-[#7A6963] mt-1.5 max-w-md mx-auto leading-relaxed">
            Comece cadastrando seu primeiro paciente para registrar consultas, anamneses e planos
            alimentares personalizados.
          </p>
          <div className="mt-6">
            <Button
              onClick={onNovoPaciente}
              className="bg-[#999B84] hover:bg-[#858771] text-white px-6 py-2.5 rounded-2xl font-semibold shadow-md shadow-[#999B84]/20"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Cadastrar Primeiro Paciente
            </Button>
          </div>
        </div>
      ) : filteredPacientes.length === 0 ? (
        /* Caso a busca por nome não retorne resultados */
        <div className="p-12 rounded-3xl bg-white border border-[#EBDAD2] text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1E4] text-[#7A6963] flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 opacity-60" />
          </div>
          <h3 className="font-bold text-base text-[#2C211E]">Nenhum paciente encontrado</h3>
          <p className="text-xs text-[#7A6963] mt-1">
            Nenhum resultado corresponde à busca &quot;{searchQuery}&quot;.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs font-semibold text-[#999B84] hover:underline"
          >
            Limpar termo de busca
          </button>
        </div>
      ) : (
        /* Lista de Pacientes Cadastrados */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPacientes.map((paciente) => {
            // Montagem do objetivo: array de objetivos formatado ou texto livre
            const objetivosList = paciente.objetivos && paciente.objetivos.length > 0
              ? paciente.objetivos.join(', ')
              : null;
            const objetivoExibido =
              objetivosList || paciente.objetivo_texto || 'Objetivo não informado';

            // Data da última consulta
            const ultimaConsultaTexto = paciente.ultima_consulta
              ? formatDateBR(paciente.ultima_consulta)
              : 'Nenhuma consulta realizada';

            return (
              <div
                key={paciente.id}
                onClick={() => onSelectPaciente(paciente.id)}
                className="bg-white rounded-3xl p-5 border border-[#EBDAD2] hover:border-[#999B84] hover:shadow-lg hover:shadow-[#999B84]/10 transition-all duration-200 cursor-pointer flex flex-col justify-between group text-left"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#999B84]/15 text-[#555E47] font-bold text-base flex items-center justify-center shrink-0 group-hover:bg-[#999B84] group-hover:text-white transition-colors duration-200">
                      {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                    <span className="text-[11px] font-semibold text-[#7A6963] px-2.5 py-1 rounded-full bg-[#FFF1E4] border border-[#EBDAD2]">
                      {paciente.sexo || 'Geral'}
                    </span>
                  </div>

                  {/* Nome do Paciente */}
                  <h3 className="font-bold text-lg text-[#2C211E] font-['Outfit'] group-hover:text-[#555E47] transition-colors line-clamp-1">
                    {paciente.nome}
                  </h3>

                  {/* Campos Requeridos: Objetivo e Data da Última Consulta */}
                  <div className="mt-3.5 space-y-2.5 text-xs">
                    {/* Objetivo */}
                    <div className="flex items-start gap-2 text-[#5C4D47]">
                      <Target className="w-4 h-4 text-[#999B84] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-[#7A6963] block uppercase tracking-wider">
                          Objetivo:
                        </span>
                        <p className="text-xs font-medium text-[#2C211E] line-clamp-2">
                          {objetivoExibido}
                        </p>
                      </div>
                    </div>

                    {/* Data da Última Consulta */}
                    <div className="flex items-center gap-2 text-[#5C4D47] pt-1">
                      <Calendar className="w-4 h-4 text-[#999B84] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-[#7A6963] block uppercase tracking-wider">
                          Última Consulta:
                        </span>
                        <p
                          className={`text-xs font-semibold ${
                            paciente.ultima_consulta
                              ? 'text-[#2C211E]'
                              : 'text-[#7A6963]/80 italic'
                          }`}
                        >
                          {ultimaConsultaTexto}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card com CTA para o Perfil */}
                <div className="mt-5 pt-3.5 border-t border-[#F0E4DC] flex items-center justify-between text-xs font-bold text-[#999B84] group-hover:text-[#555E47] transition-colors">
                  <span>Ver perfil completo</span>
                  <div className="w-6 h-6 rounded-full bg-[#FFF1E4] group-hover:bg-[#999B84] group-hover:text-white flex items-center justify-center transition-all">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
