import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Utensils,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Edit3,
  Coffee,
  Apple,
  Salad,
  Sandwich,
  Soup,
  ChevronRight,
  ArrowLeft,
  Trash2,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PlanoAlimentarModal } from './PlanoAlimentarModal';
import {
  gerarPlanoComIAApi,
  buildDefaultPlanoSemanal,
} from '@/lib/plano-alimentar-service';
import { savePlanoAlimentar, getPlanosAlimentares, deletePlanoAlimentar } from '@/lib/dashboard-service';
import { formatDateBR } from '@/lib/formatters';
import { baixarPlanoAlimentarPDF } from '@/lib/pdf-export';
import type { Paciente, PlanoAlimentar, PlanoSemanalConteudo, DiaPlano } from '@/types/dashboard';

interface PlanoAlimentarSectionProps {
  paciente: Paciente;
  initialPlanos: PlanoAlimentar[];
  onDataChanged?: () => void;
}

const REFEICOES_CONFIG = [
  {
    key: 'cafe_da_manha' as const,
    label: 'Café da Manhã',
    icon: Coffee,
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
    description: 'Primeira refeição matinal para quebra do jejum',
  },
  {
    key: 'lanche_manha' as const,
    label: 'Lanche da Manhã',
    icon: Apple,
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    description: 'Lanche intermediário leve entre o café e o almoço',
  },
  {
    key: 'almoco' as const,
    label: 'Almoço',
    icon: Salad,
    badgeColor: 'bg-orange-50 text-orange-900 border-orange-200',
    description: 'Refeição principal rica em proteínas, fibras e carboidratos',
  },
  {
    key: 'lanche_tarde' as const,
    label: 'Lanche da Tarde',
    icon: Sandwich,
    badgeColor: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    description: 'Lanche nutritivo para manter a energia vespertina',
  },
  {
    key: 'jantar' as const,
    label: 'Jantar',
    icon: Soup,
    badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    description: 'Refeição noturna balanceada e de fácil digestão',
  },
];

const LOADING_MESSAGES = [
  'Buscando dados e histórico clínico do paciente no Neon...',
  'Analisando objetivos, patologias, alergias e restrições alimentares...',
  'IA calculando cardápio semanal completo com o Gemini...',
  'Adaptando opções de alimentos à culinária e rotina brasileira...',
  'Estruturando 5 opções balanceadas para cada uma das 5 refeições...',
  'Finalizando o plano semanal personalizado...',
];

export const PlanoAlimentarSection: React.FC<PlanoAlimentarSectionProps> = ({
  paciente,
  initialPlanos,
  onDataChanged,
}) => {
  const [planos, setPlanos] = useState<PlanoAlimentar[]>(initialPlanos);
  const [currentMode, setCurrentMode] = useState<'history' | 'editor'>('history');

  // Estado do plano em edição (7 dias x 5 refeições x 5 opções)
  const [planoEmEdicao, setPlanoEmEdicao] = useState<PlanoSemanalConteudo | null>(null);
  const [activeDiaIndex, setActiveDiaIndex] = useState(0);

  // Estados de IA e Carregamento
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Estados de Salvamento
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Estados de Erro e Contingência
  const [errorToast, setErrorToast] = useState<{
    message: string;
    showRetryAndManual: boolean;
  } | null>(null);

  // Modal para visualização completa de um plano do histórico
  const [selectedPlanoModal, setSelectedPlanoModal] = useState<PlanoAlimentar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sincroniza planos caso initialPlanos mude externamente
  useEffect(() => {
    setPlanos(initialPlanos);
  }, [initialPlanos]);

  // Mensagens rotativas durante o loading da IA
  useEffect(() => {
    if (!isGeneratingIA) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isGeneratingIA]);

  // Recarregar histórico do Neon
  const reloadPlanos = async () => {
    try {
      const data = await getPlanosAlimentares(paciente.id);
      setPlanos(data);
    } catch (err) {
      console.error('[NutriOn] Erro ao recarregar planos:', err);
    }
  };

  // Disparo da geração com IA (Serverless Function /api/gerar-plano)
  const handleGerarComIA = async () => {
    setIsGeneratingIA(true);
    setErrorToast(null);
    setSaveSuccessMsg(null);
    setLoadingMsgIndex(0);

    try {
      const resultado = await gerarPlanoComIAApi(paciente);
      setPlanoEmEdicao(resultado);
      setActiveDiaIndex(0);
      setCurrentMode('editor');
    } catch (err: any) {
      console.error('[NutriOn] Erro na geração com IA:', err);
      setErrorToast({
        message:
          'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        showRetryAndManual: true,
      });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  // Criação de Plano Manual
  const handleCriarPlanoManual = () => {
    setErrorToast(null);
    const template = buildDefaultPlanoSemanal(paciente);
    setPlanoEmEdicao(template);
    setActiveDiaIndex(0);
    setCurrentMode('editor');
  };

  // Alteração de um input específico da refeição
  const handleInputChange = (
    refeicaoKey: keyof DiaPlano['refeicoes'],
    opcaoIndex: number,
    newValue: string
  ) => {
    if (!planoEmEdicao) return;

    const updatedPlanoSemanal = [...planoEmEdicao.plano_semanal];
    const diaAtual = { ...updatedPlanoSemanal[activeDiaIndex] };
    const refeicoesAtual = { ...diaAtual.refeicoes };
    const opcoesAtual = [...(refeicoesAtual[refeicaoKey] || [])];

    // Garante que o array tenha pelo menos 5 posições
    while (opcoesAtual.length <= opcaoIndex) {
      opcoesAtual.push('');
    }
    opcoesAtual[opcaoIndex] = newValue;
    refeicoesAtual[refeicaoKey] = opcoesAtual;
    diaAtual.refeicoes = refeicoesAtual;
    updatedPlanoSemanal[activeDiaIndex] = diaAtual;

    setPlanoEmEdicao({
      ...planoEmEdicao,
      plano_semanal: updatedPlanoSemanal,
    });
  };

  // Salvar no Neon
  const handleSalvarPlano = async () => {
    if (!planoEmEdicao) return;
    setIsSaving(true);
    setErrorToast(null);

    try {
      await savePlanoAlimentar(paciente.id, planoEmEdicao);
      await reloadPlanos();
      onDataChanged?.();
      setSaveSuccessMsg('Plano alimentar salvo com sucesso no banco de dados Neon!');
      setCurrentMode('history');
      setPlanoEmEdicao(null);
    } catch (err: any) {
      console.error('[NutriOn] Erro ao salvar plano alimentar:', err);
      setErrorToast({
        message: err.message || 'Erro ao persistir o plano alimentar no Neon. Tente novamente.',
        showRetryAndManual: false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir plano
  const handleExcluirPlano = async (planoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este plano alimentar do histórico?')) {
      return;
    }
    try {
      await deletePlanoAlimentar(planoId);
      await reloadPlanos();
      onDataChanged?.();
    } catch (err) {
      console.error('[NutriOn] Erro ao excluir plano:', err);
    }
  };

  // Carregar plano antigo no editor
  const handleEditarPlanoHistorico = (plano: PlanoAlimentar) => {
    try {
      let conteudo = plano.conteudo;
      if (typeof conteudo === 'string') {
        conteudo = JSON.parse(conteudo);
      }
      if (conteudo && Array.isArray(conteudo.plano_semanal)) {
        setPlanoEmEdicao(conteudo);
        setActiveDiaIndex(0);
        setCurrentMode('editor');
      } else {
        setSelectedPlanoModal(plano);
        setIsModalOpen(true);
      }
    } catch {
      setSelectedPlanoModal(plano);
      setIsModalOpen(true);
    }
  };

  const dias = planoEmEdicao?.plano_semanal || [];
  const diaAtivo = dias[activeDiaIndex] || null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast / Alerta de Sucesso */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-slide-up">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 rounded"
          >
            &times;
          </button>
        </div>
      )}

      {/* Toast / Alerta Amigável de Erro com Ações de Resiliência (Prompt 6) */}
      {errorToast && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 text-xs shadow-md space-y-3 animate-slide-up">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold text-sm text-amber-900">Atenção</p>
              <p className="text-xs text-amber-800 leading-relaxed">{errorToast.message}</p>
            </div>
            <button
              onClick={() => setErrorToast(null)}
              className="text-amber-800 hover:text-amber-950 font-bold text-sm px-1.5"
            >
              &times;
            </button>
          </div>

          {errorToast.showRetryAndManual && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200">
              <Button
                type="button"
                size="sm"
                onClick={handleGerarComIA}
                disabled={isGeneratingIA}
                className="bg-amber-700 hover:bg-amber-800 text-white"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Tentar novamente com IA
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCriarPlanoManual}
                className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Criar Plano Manual
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Banner de Carregamento da IA com Mensagens Dinâmicas */}
      {isGeneratingIA && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FFF1E4] to-white border border-[#D7A49A]/50 shadow-md text-center space-y-4 animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-[#999B84] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#999B84]/20">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h4 className="font-bold text-base text-[#2C211E] font-['Outfit'] flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D7A49A] animate-pulse" />
              Inteligência Artificial em Execução
            </h4>
            <p className="text-xs font-semibold text-[#555E47] transition-all min-h-[1.25rem]">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
            <p className="text-[11px] text-[#7A6963] pt-1">
              Consumindo a API Gemini de forma segura via backend serverless.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 1: HISTÓRICO DE PLANOS ALIMENTARES                        */}
      {/* ============================================================== */}
      {currentMode === 'history' && !isGeneratingIA && (
        <div className="space-y-6">
          {/* Top Card com Ações */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EBDAD2] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-[#2C211E] font-['Outfit'] flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#999B84]" />
                Planos Alimentares de {paciente.nome}
              </h3>
              <p className="text-xs text-[#7A6963] mt-0.5">
                Gere cardápios semanais com IA ou elabore um plano manual editável.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={handleCriarPlanoManual}
                variant="outline"
                className="border-[#EBDAD2] text-xs font-bold"
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Criar Plano Manual
              </Button>
              <Button
                onClick={handleGerarComIA}
                disabled={isGeneratingIA}
                className="bg-gradient-to-r from-[#D7A49A] to-[#B97F74] hover:from-[#c8948a] hover:to-[#a76f64] text-white shadow-md shadow-[#D7A49A]/30 px-5 text-xs font-bold"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                ✨ Gerar Plano com IA
              </Button>
            </div>
          </div>

          {/* Histórico em Ordem Cronológica Decrescente */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDAD2] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4DC]">
              <h4 className="font-bold text-sm text-[#2C211E] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#999B84]" />
                Histórico de Planos Salvos
              </h4>
              <span className="text-xs text-[#7A6963]">
                {planos.length} {planos.length === 1 ? 'plano salvo' : 'planos salvos'}
              </span>
            </div>

            {planos.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#FFFDFB] border border-dashed border-[#EBDAD2] text-center text-xs text-[#7A6963] space-y-2">
                <Utensils className="w-8 h-8 text-[#999B84]/60 mx-auto" />
                <p className="font-bold text-sm text-[#2C211E]">
                  Nenhum plano alimentar gerado ainda
                </p>
                <p className="text-xs text-[#7A6963] max-w-md mx-auto">
                  Clique no botão &quot;✨ Gerar Plano com IA&quot; acima para que a inteligência artificial leia as metas, restrições e alergias do paciente e elabore o cardápio semanal completo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {planos.map((plano, index) => (
                  <div
                    key={plano.id}
                    onClick={() => handleEditarPlanoHistorico(plano)}
                    className="p-4 sm:p-5 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2] hover:border-[#999B84] transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF1E4] text-[#999B84] group-hover:bg-[#999B84] group-hover:text-white transition-colors flex items-center justify-center font-bold text-sm shrink-0">
                        #{planos.length - index}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-[#2C211E] group-hover:text-[#999B84] transition-colors">
                            Plano Alimentar Semanal
                          </h5>
                          {plano.conteudo?.gerado_por_ia && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              IA
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#7A6963] mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Gerado em {formatDateBR(plano.created_at)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          baixarPlanoAlimentarPDF(paciente, plano);
                        }}
                        className="p-2 rounded-xl text-[#555E47] bg-[#999B84]/10 hover:bg-[#999B84]/20 transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Baixar Plano em PDF"
                      >
                        <FileDown className="w-4 h-4 text-[#555E47]" />
                        <span className="hidden md:inline">PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleExcluirPlano(plano.id, e)}
                        className="p-2 rounded-xl text-[#7A6963] hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir plano"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#999B84] group-hover:translate-x-1 transition-transform ml-1">
                        <span className="hidden sm:inline">Abrir no editor</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 2: INTERFACE DE EDIÇÃO EM ABAS (7 Dias x 5 Refeições)    */}
      {/* ============================================================== */}
      {currentMode === 'editor' && planoEmEdicao && (
        <div className="space-y-6">
          {/* Header da Edição com Botão de Persistência */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EBDAD2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Deseja sair do editor? As alterações não salvas serão descartadas.')) {
                    setCurrentMode('history');
                    setPlanoEmEdicao(null);
                  }
                }}
                className="w-10 h-10 rounded-2xl bg-[#FFF1E4] hover:bg-[#F0DFC0] text-[#2C211E] flex items-center justify-center transition-colors shadow-sm shrink-0"
                title="Voltar ao histórico"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-[#2C211E] font-['Outfit']">
                    Edição do Plano Alimentar
                  </h3>
                  {planoEmEdicao.gerado_por_ia ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      Gerado por IA
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF1E4] text-[#555E47] border border-[#EBDAD2]">
                      Plano Manual
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7A6963] mt-0.5">
                  Paciente: <span className="font-semibold text-[#2C211E]">{paciente.nome}</span> &bull; Revise e edite as opções de cada dia antes de salvar no Neon.
                </p>
              </div>
            </div>

            {/* Ações da Edição */}
            <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => baixarPlanoAlimentarPDF(paciente, planoEmEdicao)}
                className="border-[#999B84] text-[#555E47] hover:bg-[#999B84]/10 font-bold text-xs"
                leftIcon={<FileDown className="w-3.5 h-3.5 text-[#555E47]" />}
              >
                Baixar PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Deseja descartar este plano?')) {
                    setCurrentMode('history');
                    setPlanoEmEdicao(null);
                  }
                }}
                className="border-[#EBDAD2] text-xs"
              >
                Descartar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSalvarPlano}
                isLoading={isSaving}
                className="bg-[#999B84] hover:bg-[#858771] text-white px-6 shadow-md shadow-[#999B84]/20 font-bold"
                leftIcon={<Save className="w-4 h-4" />}
              >
                Salvar Plano Alimentar
              </Button>
            </div>
          </div>

          {/* Abas (Tabs) dos Dias da Semana */}
          <div className="bg-white p-2 rounded-2xl border border-[#EBDAD2] shadow-sm flex gap-1.5 overflow-x-auto">
            {dias.map((d, index) => {
              const isActive = index === activeDiaIndex;
              return (
                <button
                  key={d.dia || index}
                  type="button"
                  onClick={() => setActiveDiaIndex(index)}
                  className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
                    isActive
                      ? 'bg-[#999B84] text-white shadow-sm'
                      : 'text-[#5C4D47] hover:bg-[#FFF1E4]'
                  }`}
                >
                  {d.dia}
                </button>
              );
            })}
          </div>

          {/* Formulário do Dia Ativo com as 5 Refeições (5 Inputs por refeição) */}
          {diaAtivo && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-extrabold text-base text-[#2C211E] font-['Outfit']">
                  Cardápio de {diaAtivo.dia}
                </h4>
                <span className="text-xs text-[#7A6963]">
                  5 refeições &bull; 5 opções sugeridas por refeição
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {REFEICOES_CONFIG.map((refConfig) => {
                  const Icon = refConfig.icon;
                  const opcoes = diaAtivo.refeicoes?.[refConfig.key] || ['', '', '', '', ''];

                  return (
                    <div
                      key={refConfig.key}
                      className="bg-white rounded-3xl p-6 border border-[#EBDAD2] shadow-sm space-y-4 hover:border-[#999B84]/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0E4DC]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#FFF1E4] text-[#999B84] flex items-center justify-center font-bold">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[#2C211E] block">
                              {refConfig.label}
                            </span>
                            <span className="text-[11px] text-[#7A6963]">
                              {refConfig.description}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${refConfig.badgeColor}`}
                        >
                          5 Opções
                        </span>
                      </div>

                      {/* 5 Inputs de Texto Editáveis */}
                      <div className="space-y-2.5">
                        {[0, 1, 2, 3, 4].map((optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="w-18 shrink-0 text-[11px] font-bold text-[#7A6963] uppercase">
                              Opção {optIdx + 1}:
                            </span>
                            <input
                              type="text"
                              value={opcoes[optIdx] || ''}
                              onChange={(e) =>
                                handleInputChange(refConfig.key, optIdx, e.target.value)
                              }
                              placeholder={`Sugestão de alimento para ${refConfig.label.toLowerCase()}...`}
                              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84] transition-all"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão Salvar Fixo no Rodapé */}
              <div className="bg-white p-4 rounded-3xl border border-[#EBDAD2] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-4 z-20">
                <span className="text-xs text-[#7A6963]">
                  Todas as 5 opções de cada refeição são salvas diretamente no Neon.
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => baixarPlanoAlimentarPDF(paciente, planoEmEdicao)}
                    className="border-[#999B84] text-[#555E47] hover:bg-[#999B84]/10 font-bold"
                    leftIcon={<FileDown className="w-4 h-4 text-[#555E47]" />}
                  >
                    Baixar PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Descartar alterações?')) {
                        setCurrentMode('history');
                        setPlanoEmEdicao(null);
                      }
                    }}
                    className="border-[#EBDAD2]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSalvarPlano}
                    isLoading={isSaving}
                    className="bg-[#999B84] hover:bg-[#858771] text-white px-7 shadow-md shadow-[#999B84]/20 font-bold"
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Salvar Plano Alimentar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal para Visualização Completa de Planos Antigos */}
      <PlanoAlimentarModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlanoModal(null);
        }}
        plano={selectedPlanoModal}
        pacienteNome={paciente.nome}
        paciente={paciente}
      />
    </div>
  );
};

