import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Calendar,
  Phone,
  Mail,
  Scale,
  Ruler,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  Activity,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getPacienteProfile, createConsulta } from '@/lib/dashboard-service';
import type { Paciente, Consulta } from '@/types/dashboard';

interface PacienteProfileModalProps {
  pacienteId: string | null;
  nutricionistaId: string;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const PacienteProfileModal: React.FC<PacienteProfileModalProps> = ({
  pacienteId,
  nutricionistaId,
  onClose,
  onDataChanged,
}) => {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para cadastro de nova consulta rápida / agendamento de retorno
  const [isAddingConsulta, setIsAddingConsulta] = useState(false);
  const [formData, setFormData] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    proximo_retorno: '',
    observacoes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!pacienteId) return;

    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getPacienteProfile(pacienteId!, nutricionistaId);
        if (isMounted && data) {
          setPaciente(data.paciente);
          setConsultas(data.consultas);
        }
      } catch (err) {
        console.error('[NutriOn] Erro ao carregar perfil do paciente:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [pacienteId, nutricionistaId]);

  if (!pacienteId) return null;

  const handleCreateConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      await createConsulta(pacienteId, {
        data_consulta: formData.data_consulta,
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        cintura: formData.cintura ? parseFloat(formData.cintura) : undefined,
        quadril: formData.quadril ? parseFloat(formData.quadril) : undefined,
        percentual_gordura: formData.percentual_gordura ? parseFloat(formData.percentual_gordura) : undefined,
        proximo_retorno: formData.proximo_retorno || undefined,
        observacoes: formData.observacoes || undefined,
      });

      // Recarrega os dados
      const updated = await getPacienteProfile(pacienteId, nutricionistaId);
      if (updated) {
        setPaciente(updated.paciente);
        setConsultas(updated.consultas);
      }

      setFeedbackMsg({
        type: 'success',
        text: 'Consulta registrada com sucesso no Neon!',
      });
      setIsAddingConsulta(false);
      onDataChanged?.();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: 'Não foi possível registrar a consulta. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculo de IMC simples se houver peso e altura
  const latestWeight = consultas[0]?.peso || paciente?.peso_inicial;
  const imc =
    latestWeight && paciente?.altura
      ? (latestWeight / (paciente.altura * paciente.altura)).toFixed(1)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFFDFB] w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl border border-[#EBDAD2] flex flex-col overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#EBDAD2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#999B84]/20 text-[#555E47] flex items-center justify-center font-bold text-lg">
              {paciente?.nome?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2C211E] font-['Outfit']">
                {paciente?.nome || 'Carregando paciente...'}
              </h2>
              <p className="text-xs text-[#7A6963]">Perfil do Paciente & Histórico Clínico</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FFF1E4] hover:bg-[#F2DFCE] text-[#7A6963] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#7A6963]">
              <Loader2 className="w-8 h-8 animate-spin text-[#999B84]" />
              <p className="text-sm">Carregando dados do Neon...</p>
            </div>
          ) : paciente ? (
            <>
              {feedbackMsg && (
                <div
                  className={`p-3.5 rounded-2xl flex items-center gap-2 text-xs font-medium ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {feedbackMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              {/* Patient Quick Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-3.5 rounded-2xl bg-[#FFF1E4]/60 border border-[#EBDAD2]">
                  <span className="text-[11px] font-semibold text-[#7A6963] uppercase block">
                    Peso Atual
                  </span>
                  <p className="text-lg font-bold text-[#2C211E] mt-0.5">
                    {latestWeight ? `${latestWeight} kg` : 'Não inf.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFF1E4]/60 border border-[#EBDAD2]">
                  <span className="text-[11px] font-semibold text-[#7A6963] uppercase block">
                    Altura
                  </span>
                  <p className="text-lg font-bold text-[#2C211E] mt-0.5">
                    {paciente.altura ? `${paciente.altura} m` : 'Não inf.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFF1E4]/60 border border-[#EBDAD2]">
                  <span className="text-[11px] font-semibold text-[#7A6963] uppercase block">
                    IMC Estimado
                  </span>
                  <p className="text-lg font-bold text-[#2C211E] mt-0.5">
                    {imc ? `${imc} kg/m²` : '—'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFF1E4]/60 border border-[#EBDAD2]">
                  <span className="text-[11px] font-semibold text-[#7A6963] uppercase block">
                    Consultas
                  </span>
                  <p className="text-lg font-bold text-[#999B84] mt-0.5">
                    {consultas.length} realizadas
                  </p>
                </div>
              </div>

              {/* Contact and Details */}
              <div className="p-4 rounded-2xl bg-white border border-[#EBDAD2] space-y-2 text-sm text-left">
                <h4 className="font-bold text-[#2C211E] text-xs uppercase tracking-wider text-[#999B84]">
                  Dados de Contato & Clínicos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#5C4D47] pt-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#999B84]" />
                    <span>{paciente.email || 'E-mail não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#999B84]" />
                    <span>{paciente.telefone || paciente.whatsapp || 'Telefone não informado'}</span>
                  </div>
                  {paciente.objetivo_texto && (
                    <div className="col-span-1 sm:col-span-2 flex items-start gap-2 pt-1">
                      <Activity className="w-4 h-4 text-[#999B84] shrink-0 mt-0.5" />
                      <span>
                        <strong>Objetivo:</strong> {paciente.objetivo_texto}
                      </span>
                    </div>
                  )}
                  {paciente.observacoes && (
                    <div className="col-span-1 sm:col-span-2 flex items-start gap-2 pt-1">
                      <FileText className="w-4 h-4 text-[#999B84] shrink-0 mt-0.5" />
                      <span>
                        <strong>Observações:</strong> {paciente.observacoes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation History & Register New Consulta */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[#2C211E] font-['Outfit'] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#999B84]" />
                    Histórico de Consultas
                  </h3>

                  {!isAddingConsulta && (
                    <button
                      onClick={() => setIsAddingConsulta(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#999B84] hover:bg-[#858771] text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Registrar Consulta / Agendar Retorno
                    </button>
                  )}
                </div>

                {/* Form to add a new consultation */}
                {isAddingConsulta && (
                  <form
                    onSubmit={handleCreateConsulta}
                    className="p-4 rounded-2xl bg-[#FFF1E4]/50 border border-[#D7A49A]/40 space-y-3 animate-slide-up"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-[#935A50]">
                        Nova Consulta ou Retorno
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingConsulta(false)}
                        className="text-xs text-[#7A6963] hover:text-[#2C211E]"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C4D47] mb-1">
                          Data da Consulta *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.data_consulta}
                          onChange={(e) =>
                            setFormData({ ...formData, data_consulta: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#EBDAD2] bg-white text-xs text-[#2C211E] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C4D47] mb-1">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 70.5"
                          value={formData.peso}
                          onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#EBDAD2] bg-white text-xs text-[#2C211E] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C4D47] mb-1">
                          Próximo Retorno Agendado
                        </label>
                        <input
                          type="date"
                          value={formData.proximo_retorno}
                          onChange={(e) =>
                            setFormData({ ...formData, proximo_retorno: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#EBDAD2] bg-white text-xs text-[#2C211E] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C4D47] mb-1">
                        Observações da Consulta / Ajuste do Plano
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Paciente relatou melhora na digestão e perda de 1.2kg."
                        value={formData.observacoes}
                        onChange={(e) =>
                          setFormData({ ...formData, observacoes: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-[#EBDAD2] bg-white text-xs text-[#2C211E] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="submit"
                        size="sm"
                        isLoading={isSubmitting}
                        className="bg-[#999B84] hover:bg-[#858771] text-white"
                      >
                        Salvar no Neon
                      </Button>
                    </div>
                  </form>
                )}

                {/* Consultation List */}
                {consultas.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white border border-[#EBDAD2] text-center text-xs text-[#7A6963]">
                    Nenhuma consulta registrada ainda para este paciente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {consultas.map((cons) => (
                      <div
                        key={cons.id}
                        className="p-3.5 rounded-2xl bg-white border border-[#EBDAD2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#2C211E]">
                              {new Date(cons.data_consulta).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {cons.peso && (
                              <span className="px-2 py-0.5 rounded-md bg-[#FFF1E4] text-[#935A50] font-medium">
                                {cons.peso} kg
                              </span>
                            )}
                          </div>
                          {cons.observacoes && (
                            <p className="text-[#7A6963] mt-1">{cons.observacoes}</p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {cons.proximo_retorno ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                              <CalendarPlus className="w-3.5 h-3.5" />
                              Retorno:{' '}
                              {new Date(cons.proximo_retorno).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium border border-amber-200">
                              Sem retorno agendado
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-[#7A6963]">
              Paciente não encontrado.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#EBDAD2] bg-[#FFFBF8] flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
