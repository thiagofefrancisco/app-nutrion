import React, { useEffect, useState, useCallback } from 'react';
import { PacientesListView } from './PacientesListView';
import { PacienteCreateView } from './PacienteCreateView';
import { PacienteProfileView } from './PacienteProfileView';
import { getPacientes } from '@/lib/dashboard-service';
import type { Paciente } from '@/types/dashboard';

interface PacientesViewProps {
  nutricionistaId: string;
  onSelectPaciente?: (pacienteId: string) => void;
  onDataChanged?: () => void;
  initialPacienteId?: string | null;
}

export type PacientesViewMode = 'list' | 'create' | 'profile';

export const PacientesView: React.FC<PacientesViewProps> = ({
  nutricionistaId,
  onSelectPaciente,
  onDataChanged,
  initialPacienteId = null,
}) => {
  const [viewMode, setViewMode] = useState<PacientesViewMode>(
    initialPacienteId ? 'profile' : 'list'
  );
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(initialPacienteId);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Carrega lista de pacientes da nutricionista logada no Neon
  const loadPacientesList = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPacientes(nutricionistaId);
      setPacientes(data);
    } catch (err) {
      console.error('[NutriOn] Erro ao carregar pacientes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [nutricionistaId]);

  useEffect(() => {
    loadPacientesList();
  }, [loadPacientesList]);

  // Se o initialPacienteId mudar externamente (ex: vindo do dashboard card 3)
  useEffect(() => {
    if (initialPacienteId) {
      setSelectedPacienteId(initialPacienteId);
      setViewMode('profile');
    }
  }, [initialPacienteId]);

  // Redireciona para o formulário de cadastro (página nova)
  const handleGoToCreate = () => {
    setSuccessToast(null);
    setViewMode('create');
  };

  // Redireciona para o perfil do paciente
  const handleSelectPaciente = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setViewMode('profile');
    onSelectPaciente?.(pacienteId);
  };

  // Voltar para a listagem de pacientes
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPacienteId(null);
    setSuccessToast(null);
    loadPacientesList();
  };

  // Callback de sucesso ao salvar novo paciente:
  // Regras:
  // - Vincular à nutricionista logada
  // - Após salvar, redirecionar para o perfil do paciente recém cadastrado
  // - Exibir mensagem de sucesso ao salvar
  const handleCreateSuccess = (novoPaciente: Paciente) => {
    setSuccessToast(`Paciente "${novoPaciente.nome}" foi cadastrado com sucesso no sistema!`);
    setSelectedPacienteId(novoPaciente.id);
    setViewMode('profile');
    loadPacientesList();
    onDataChanged?.();
  };

  return (
    <div className="w-full">
      {viewMode === 'list' && (
        <PacientesListView
          pacientes={pacientes}
          isLoading={isLoading}
          onNovoPaciente={handleGoToCreate}
          onSelectPaciente={handleSelectPaciente}
        />
      )}

      {viewMode === 'create' && (
        <PacienteCreateView
          nutricionistaId={nutricionistaId}
          onCancel={handleBackToList}
          onSuccess={handleCreateSuccess}
        />
      )}

      {viewMode === 'profile' && selectedPacienteId && (
        <PacienteProfileView
          pacienteId={selectedPacienteId}
          nutricionistaId={nutricionistaId}
          onBackToList={handleBackToList}
          onDataChanged={() => {
            loadPacientesList();
            onDataChanged?.();
          }}
          successMessage={successToast}
          onClearSuccessMessage={() => setSuccessToast(null)}
        />
      )}
    </div>
  );
};
