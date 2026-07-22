import React, { useState, useEffect } from 'react';
import { X, Check, Syringe } from 'lucide-react';
import { Vacina } from '../../../types';

interface VacinaModalProps {
  isOpen: boolean;
  vacinaToEdit?: Vacina | null;
  onClose: () => void;
  onSave: (data: Omit<Vacina, 'id'>) => Promise<void>;
}

export const VacinaModal: React.FC<VacinaModalProps> = ({
  isOpen,
  vacinaToEdit,
  onClose,
  onSave,
}) => {
  const [nome, setNome] = useState('');
  const [dataAplicacao, setDataAplicacao] = useState('');
  const [proximaDose, setProximaDose] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vacinaToEdit) {
      setNome(vacinaToEdit.nome || '');
      setDataAplicacao(vacinaToEdit.dataAplicacao || '');
      setProximaDose(vacinaToEdit.proximaDose || '');
      setObservacoes(vacinaToEdit.observacoes || '');
    } else {
      setNome('');
      setDataAplicacao(new Date().toISOString().split('T')[0]);
      setProximaDose('');
      setObservacoes('');
    }
  }, [vacinaToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !dataAplicacao) return;

    setLoading(true);
    try {
      await onSave({
        nome: nome.trim(),
        dataAplicacao,
        proximaDose: proximaDose || undefined,
        observacoes: observacoes.trim() || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Syringe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {vacinaToEdit ? 'Editar Vacina' : 'Adicionar Vacina'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Vacina *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: V10, Antirrábica, Giárdia..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data Aplicação *
              </label>
              <input
                type="date"
                required
                value={dataAplicacao}
                onChange={e => setDataAplicacao(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Próxima Dose
              </label>
              <input
                type="date"
                value={proximaDose}
                onChange={e => setProximaDose(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observações
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Ex: Lote do frasco, veterinário responsável..."
              className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Vacina'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
