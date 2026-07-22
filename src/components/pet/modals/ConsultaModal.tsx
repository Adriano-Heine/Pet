import React, { useState, useEffect } from 'react';
import { X, Check, Stethoscope } from 'lucide-react';
import { Consulta } from '../../../types';

interface ConsultaModalProps {
  isOpen: boolean;
  consultaToEdit?: Consulta | null;
  onClose: () => void;
  onSave: (data: Omit<Consulta, 'id'>) => Promise<void>;
}

export const ConsultaModal: React.FC<ConsultaModalProps> = ({
  isOpen,
  consultaToEdit,
  onClose,
  onSave,
}) => {
  const [data, setData] = useState('');
  const [veterinario, setVeterinario] = useState('');
  const [clinica, setClinica] = useState('');
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamento, setTratamento] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (consultaToEdit) {
      setData(consultaToEdit.data || '');
      setVeterinario(consultaToEdit.veterinario || '');
      setClinica(consultaToEdit.clinica || '');
      setMotivo(consultaToEdit.motivo || '');
      setDiagnostico(consultaToEdit.diagnostico || '');
      setTratamento(consultaToEdit.tratamento || '');
      setMedicamentos(consultaToEdit.medicamentos || '');
      setObservacoes(consultaToEdit.observacoes || '');
    } else {
      setData(new Date().toISOString().split('T')[0]);
      setVeterinario('');
      setClinica('');
      setMotivo('');
      setDiagnostico('');
      setTratamento('');
      setMedicamentos('');
      setObservacoes('');
    }
  }, [consultaToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !motivo.trim()) return;

    setLoading(true);
    try {
      await onSave({
        data,
        veterinario: veterinario.trim() || undefined,
        clinica: clinica.trim() || undefined,
        motivo: motivo.trim(),
        diagnostico: diagnostico.trim() || undefined,
        tratamento: tratamento.trim() || undefined,
        medicamentos: medicamentos.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {consultaToEdit ? 'Editar Consulta' : 'Nova Consulta Veterinária'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <form id="consultaForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data da Consulta *
                </label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={e => setData(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo da Consulta *
                </label>
                <input
                  type="text"
                  required
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Ex: Check-up, Vacinação, Coceira, Exame..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Veterinário(a)
                </label>
                <input
                  type="text"
                  value={veterinario}
                  onChange={e => setVeterinario(e.target.value)}
                  placeholder="Nome do profissional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Clínica / Hospital
                </label>
                <input
                  type="text"
                  value={clinica}
                  onChange={e => setClinica(e.target.value)}
                  placeholder="Nome da clínica"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Diagnóstico
              </label>
              <textarea
                rows={2}
                value={diagnostico}
                onChange={e => setDiagnostico(e.target.value)}
                placeholder="Diagnóstico informado pelo veterinário..."
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tratamento Indicado
                </label>
                <textarea
                  rows={2}
                  value={tratamento}
                  onChange={e => setTratamento(e.target.value)}
                  placeholder="Tratamento, repouso ou condutas..."
                  className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Medicamentos Receitados
                </label>
                <textarea
                  rows={2}
                  value={medicamentos}
                  onChange={e => setMedicamentos(e.target.value)}
                  placeholder="Ex: Anti-inflamatório 12/12h por 5 dias..."
                  className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Observações Gerais
              </label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Outras notas do atendimento..."
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="consultaForm"
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Salvando...' : 'Salvar Consulta'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
