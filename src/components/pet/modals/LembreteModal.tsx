import React, { useState, useEffect } from 'react';
import { X, Check, Bell } from 'lucide-react';
import { Lembrete, ReminderCategory } from '../../../types';

interface LembreteModalProps {
  isOpen: boolean;
  lembreteToEdit?: Lembrete | null;
  onClose: () => void;
  onSave: (data: Omit<Lembrete, 'id'>) => Promise<void>;
}

const CATEGORIES: ReminderCategory[] = [
  'Vermífugo',
  'Antipulgas',
  'Banho',
  'Tosa',
  'Retorno veterinário',
  'Medicação',
  'Outro'
];

export const LembreteModal: React.FC<LembreteModalProps> = ({
  isOpen,
  lembreteToEdit,
  onClose,
  onSave,
}) => {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<ReminderCategory>('Vermífugo');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [descricao, setDescricao] = useState('');
  const [notificacaoAtiva, setNotificacaoAtiva] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lembreteToEdit) {
      setTitulo(lembreteToEdit.titulo || '');
      setCategoria(lembreteToEdit.categoria || 'Vermífugo');
      setData(lembreteToEdit.data || '');
      setHora(lembreteToEdit.hora || '');
      setDescricao(lembreteToEdit.descricao || '');
      setNotificacaoAtiva(lembreteToEdit.notificacaoAtiva ?? true);
    } else {
      setTitulo('');
      setCategoria('Vermífugo');
      setData(new Date().toISOString().split('T')[0]);
      setHora('09:00');
      setDescricao('');
      setNotificacaoAtiva(true);
    }
  }, [lembreteToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !data) return;

    setLoading(true);
    try {
      await onSave({
        titulo: titulo.trim(),
        categoria,
        data,
        hora: hora || undefined,
        descricao: descricao.trim() || undefined,
        notificacaoAtiva,
        concluido: lembreteToEdit?.concluido || false
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
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {lembreteToEdit ? 'Editar Lembrete' : 'Novo Lembrete'}
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
              Título do Lembrete *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Aplicar Drontal 10kg, Retorno na clínica..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Categoria *
            </label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value as ReminderCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data *
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
                Hora (opcional)
              </label>
              <input
                type="time"
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descrição ou Instruções
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Dar 1 comprimido pela manhã junto com a refeição..."
              className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Ativar Notificação
            </span>
            <button
              type="button"
              onClick={() => setNotificacaoAtiva(!notificacaoAtiva)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                notificacaoAtiva ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  notificacaoAtiva ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
              <span>{loading ? 'Salvando...' : 'Salvar Lembrete'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
