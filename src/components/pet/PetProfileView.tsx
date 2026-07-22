import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit3,
  Plus,
  Syringe,
  Stethoscope,
  Bell,
  Info,
  Calendar,
  Sparkles,
  Weight,
  Tag,
  QrCode,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Building,
  UserCheck,
  Pill,
  FileText
} from 'lucide-react';
import { Pet, Vacina, Consulta, Lembrete } from '../../types';
import {
  fetchVacinas,
  addVacina,
  updateVacina,
  deleteVacina,
  fetchConsultas,
  addConsulta,
  updateConsulta,
  deleteConsulta,
  fetchLembretes,
  addLembrete,
  updateLembrete,
  deleteLembrete
} from '../../services/petService';
import { calculateAge, formatDateBR, getVacinaStatus } from '../../utils/dateUtils';
import { VacinaModal } from './modals/VacinaModal';
import { ConsultaModal } from './modals/ConsultaModal';
import { LembreteModal } from './modals/LembreteModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface PetProfileViewProps {
  pet: Pet;
  userId: string;
  onBack: () => void;
  onEditPet: () => void;
  onSuccessToast: (msg: string) => void;
}

type ProfileTab = 'info' | 'vacinas' | 'consultas' | 'lembretes';

export const PetProfileView: React.FC<PetProfileViewProps> = ({
  pet,
  userId,
  onBack,
  onEditPet,
  onSuccessToast,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  // Sub-items states
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Modals state
  const [isVacinaModalOpen, setIsVacinaModalOpen] = useState(false);
  const [editingVacina, setEditingVacina] = useState<Vacina | null>(null);

  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);

  const [isLembreteModalOpen, setIsLembreteModalOpen] = useState(false);
  const [editingLembrete, setEditingLembrete] = useState<Lembrete | null>(null);

  // Delete Confirmation Modal state
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load sub-items
  const loadSubItems = async () => {
    setLoadingItems(true);
    try {
      const [vList, cList, lList] = await Promise.all([
        fetchVacinas(userId, pet.id),
        fetchConsultas(userId, pet.id),
        fetchLembretes(userId, pet.id),
      ]);
      setVacinas(vList);
      setConsultas(cList);
      setLembretes(lList);
    } catch (err) {
      console.error('Error loading sub-items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadSubItems();
  }, [pet.id, userId]);

  // --- VACINAS HANDLERS ---
  const handleSaveVacina = async (data: Omit<Vacina, 'id'>) => {
    if (editingVacina) {
      await updateVacina(userId, pet.id, editingVacina.id, data);
      onSuccessToast('Vacina atualizada com sucesso!');
    } else {
      await addVacina(userId, pet.id, data);
      onSuccessToast('Vacina registrada com sucesso!');
    }
    setEditingVacina(null);
    loadSubItems();
  };

  const handleDeleteVacinaConfirm = (vacinaId: string) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Excluir Vacina',
      message: 'Tem certeza que deseja excluir o registro desta vacina?',
      onConfirm: async () => {
        await deleteVacina(userId, pet.id, vacinaId);
        onSuccessToast('Vacina excluída.');
        setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
        loadSubItems();
      },
    });
  };

  // --- CONSULTAS HANDLERS ---
  const handleSaveConsulta = async (data: Omit<Consulta, 'id'>) => {
    if (editingConsulta) {
      await updateConsulta(userId, pet.id, editingConsulta.id, data);
      onSuccessToast('Consulta atualizada com sucesso!');
    } else {
      await addConsulta(userId, pet.id, data);
      onSuccessToast('Nova consulta cadastrada!');
    }
    setEditingConsulta(null);
    loadSubItems();
  };

  const handleDeleteConsultaConfirm = (consultaId: string) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Excluir Consulta',
      message: 'Tem certeza que deseja remover este registro de consulta?',
      onConfirm: async () => {
        await deleteConsulta(userId, pet.id, consultaId);
        onSuccessToast('Consulta excluída.');
        setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
        loadSubItems();
      },
    });
  };

  // --- LEMBRETES HANDLERS ---
  const handleSaveLembrete = async (data: Omit<Lembrete, 'id'>) => {
    if (editingLembrete) {
      await updateLembrete(userId, pet.id, editingLembrete.id, data);
      onSuccessToast('Lembrete atualizado!');
    } else {
      await addLembrete(userId, pet.id, data);
      onSuccessToast('Lembrete adicionado!');
    }
    setEditingLembrete(null);
    loadSubItems();
  };

  const handleToggleLembreteDone = async (lembrete: Lembrete) => {
    const updated = !lembrete.concluido;
    await updateLembrete(userId, pet.id, lembrete.id, { concluido: updated });
    onSuccessToast(updated ? 'Lembrete concluído!' : 'Lembrete reaberto.');
    loadSubItems();
  };

  const handleDeleteLembreteConfirm = (lembreteId: string) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Excluir Lembrete',
      message: 'Tem certeza que deseja excluir este lembrete?',
      onConfirm: async () => {
        await deleteLembrete(userId, pet.id, lembreteId);
        onSuccessToast('Lembrete excluído.');
        setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
        loadSubItems();
      },
    });
  };

  const ageText = calculateAge(pet.birthDate);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-[#3D3B36] dark:text-slate-300 border border-[#E8E6DF] dark:border-slate-800 text-xs font-bold hover:bg-[#F3F1ED] dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#7A776D]" />
          <span>Voltar para meus Pets</span>
        </button>

        <button
          onClick={onEditPet}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F0F4EF] dark:bg-slate-800 text-[#7D9B76] dark:text-sage-300 border border-[#DCE6DA] dark:border-slate-700 text-xs font-bold hover:bg-[#E2EBE0] transition-colors shadow-xs"
        >
          <Edit3 className="w-4 h-4" />
          <span>Editar Pet</span>
        </button>
      </div>

      {/* Hero Pet Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-[#E8E6DF] dark:border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="shrink-0 relative">
            <img
              src={pet.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80'}
              alt={pet.name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] object-cover ring-4 ring-[#E9EDC9] dark:ring-slate-800 shadow-md"
            />
            <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#7D9B76] text-white shadow-md">
              {pet.species}
            </span>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2B26] dark:text-white tracking-tight">
                  {pet.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#F3F1ED] dark:bg-slate-800 text-[#7A776D] dark:text-slate-300">
                  {pet.sex}
                </span>
              </div>
              <p className="text-sm font-medium text-[#7A776D] dark:text-slate-400 mt-1">
                {pet.breed}
              </p>
            </div>

            {/* Quick Metrics Pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF9F6] dark:bg-slate-800 text-xs font-medium text-[#3D3B36] dark:text-slate-300 border border-[#E8E6DF] dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-[#7D9B76]" />
                <span>{ageText}</span>
              </div>

              {pet.weight && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF9F6] dark:bg-slate-800 text-xs font-medium text-[#3D3B36] dark:text-slate-300 border border-[#E8E6DF] dark:border-slate-700">
                  <Weight className="w-3.5 h-3.5 text-[#7D9B76]" />
                  <span>{pet.weight} kg</span>
                </div>
              )}

              {pet.color && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF9F6] dark:bg-slate-800 text-xs font-medium text-[#3D3B36] dark:text-slate-300 border border-[#E8E6DF] dark:border-slate-700">
                  <Tag className="w-3.5 h-3.5 text-[#D4A373]" />
                  <span>{pet.color}</span>
                </div>
              )}

              {pet.microchip && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF9F6] dark:bg-slate-800 text-xs font-medium text-[#3D3B36] dark:text-slate-300 border border-[#E8E6DF] dark:border-slate-700">
                  <QrCode className="w-3.5 h-3.5 text-[#7A776D]" />
                  <span>Chip: {pet.microchip}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Observações Médicas Highlight Box */}
        <div className="mt-6 pt-5 border-t border-[#F3F1ED] dark:border-slate-800">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#FFF9F5] dark:bg-slate-800 border border-[#EFDED0] dark:border-slate-700 text-[#5C5952] dark:text-slate-200 flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-[#D4A373] text-white shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4A373] flex items-center justify-between">
                <span>Observações Médicas & Cuidados Importantes</span>
                <span className="text-[10px] font-bold bg-[#F9F1EB] text-[#D4A373] px-2.5 py-0.5 rounded-full border border-[#EFDED0]">
                  Alerta
                </span>
              </h4>
              {pet.observacoesMedicas ? (
                <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line text-[#3D3B36] dark:text-slate-200">
                  {pet.observacoesMedicas}
                </p>
              ) : (
                <p className="text-xs italic text-[#A19E95] dark:text-slate-400">
                  Nenhuma observação médica de risco ou alergia informada. Clique em "Editar Pet" para adicionar.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-2 rounded-3xl bg-[#F3F1ED] dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'info'
              ? 'bg-white dark:bg-slate-800 text-[#2D2B26] dark:text-white shadow-xs border border-[#E8E6DF]'
              : 'text-[#A19E95] dark:text-slate-400 hover:text-[#7A776D]'
          }`}
        >
          <Info className="w-4 h-4 text-[#7D9B76]" />
          <span>Informações</span>
        </button>

        <button
          onClick={() => setActiveTab('vacinas')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'vacinas'
              ? 'bg-white dark:bg-slate-800 text-[#2D2B26] dark:text-white shadow-xs border border-[#E8E6DF]'
              : 'text-[#A19E95] dark:text-slate-400 hover:text-[#7A776D]'
          }`}
        >
          <Syringe className="w-4 h-4 text-[#7D9B76]" />
          <span>Vacinação</span>
          {vacinas.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F0F4EF] text-[#7D9B76] border border-[#DCE6DA]">
              {vacinas.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('consultas')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'consultas'
              ? 'bg-white dark:bg-slate-800 text-[#2D2B26] dark:text-white shadow-xs border border-[#E8E6DF]'
              : 'text-[#A19E95] dark:text-slate-400 hover:text-[#7A776D]'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-[#7D9B76]" />
          <span>Consultas</span>
          {consultas.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F0F4EF] text-[#7D9B76] border border-[#DCE6DA]">
              {consultas.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lembretes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'lembretes'
              ? 'bg-white dark:bg-slate-800 text-[#2D2B26] dark:text-white shadow-xs border border-[#E8E6DF]'
              : 'text-[#A19E95] dark:text-slate-400 hover:text-[#7A776D]'
          }`}
        >
          <Bell className="w-4 h-4 text-[#D4A373]" />
          <span>Lembretes</span>
          {lembretes.filter(l => !l.concluido).length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F9F1EB] text-[#D4A373] border border-[#EFDED0]">
              {lembretes.filter(l => !l.concluido).length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[300px]">
        {/* 1. INFORMACÕES TAB */}
        {activeTab === 'info' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-[#E8E6DF] dark:border-slate-800 space-y-6">
            <h3 className="text-base font-bold text-[#2D2B26] dark:text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-[#7D9B76]" />
              <span>Dados Cadastrais Completos</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-[#A19E95] font-medium">Nome</span>
                <p className="text-sm font-bold text-[#2D2B26] dark:text-white">{pet.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#A19E95] font-medium">Espécie</span>
                <p className="text-sm font-bold text-[#2D2B26] dark:text-white">{pet.species}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#A19E95] font-medium">Raça</span>
                <p className="text-sm font-bold text-[#2D2B26] dark:text-white">{pet.breed}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#A19E95] font-medium">Sexo</span>
                <p className="text-sm font-bold text-[#2D2B26] dark:text-white">{pet.sex}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#A19E95] font-medium">Data de Nascimento</span>
                <p className="text-sm font-bold text-[#2D2B26] dark:text-white">
                  {formatDateBR(pet.birthDate)} ({ageText})
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#A19E95] font-medium">Peso</span>
                <p className="text-sm font-bold text-[#2D2B26] dark:text-white">
                  {pet.weight ? `${pet.weight} kg` : 'Não informado'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#A19E95] font-medium">Cor</span>
                <p className="text-sm font-bold text-[#2D2B26] dark:text-white">
                  {pet.color || 'Não informada'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#A19E95] font-medium">Microchip</span>
                <p className="text-sm font-bold text-[#2D2B26] dark:text-white">
                  {pet.microchip || 'Sem microchip'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. VACINAÇÃO TAB */}
        {activeTab === 'vacinas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2D2B26] dark:text-white">
                Carteira de Vacinação
              </h3>
              <button
                onClick={() => {
                  setEditingVacina(null);
                  setIsVacinaModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#7D9B76] hover:bg-[#6b8664] text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Vacina</span>
              </button>
            </div>

            {vacinas.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F4EF] dark:bg-slate-800 text-[#7D9B76] mx-auto flex items-center justify-center">
                  <Syringe className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#2D2B26] dark:text-slate-200">
                  Nenhuma vacina cadastrada
                </h4>
                <p className="text-xs text-[#7A776D] max-w-sm mx-auto">
                  Mantenha a saúde do seu pet em dia registrando as doses aplicadas e agendando as próximas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vacinas.map(vacina => {
                  const status = getVacinaStatus(vacina.proximaDose);
                  return (
                    <div
                      key={vacina.id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 shadow-xs space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#2D2B26] dark:text-white">
                            {vacina.nome}
                          </h4>
                          <p className="text-xs text-[#7A776D] dark:text-slate-400 mt-0.5">
                            Aplicada em: {formatDateBR(vacina.dataAplicacao)}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F0F4EF] text-[#7D9B76] border border-[#DCE6DA]">
                          {status.label}
                        </span>
                      </div>

                      {vacina.proximaDose && (
                        <div className="text-xs font-semibold text-[#3D3B36] dark:text-slate-300 flex items-center gap-1.5 pt-1">
                          <Calendar className="w-3.5 h-3.5 text-[#7D9B76]" />
                          <span>Próxima dose: {formatDateBR(vacina.proximaDose)}</span>
                        </div>
                      )}

                      {vacina.observacoes && (
                        <p className="text-xs text-[#7A776D] dark:text-slate-400 bg-[#FAF9F6] dark:bg-slate-800/50 p-2.5 rounded-2xl border border-[#E8E6DF] dark:border-slate-800">
                          {vacina.observacoes}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F3F1ED] dark:border-slate-800">
                        <button
                          onClick={() => {
                            setEditingVacina(vacina);
                            setIsVacinaModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#7A776D] dark:text-slate-300 hover:bg-[#F3F1ED] dark:hover:bg-slate-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteVacinaConfirm(vacina.id)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Excluir vacina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. CONSULTAS TAB */}
        {activeTab === 'consultas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2D2B26] dark:text-white">
                Histórico de Consultas Veterinárias
              </h3>
              <button
                onClick={() => {
                  setEditingConsulta(null);
                  setIsConsultaModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#7D9B76] hover:bg-[#6b8664] text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Consulta</span>
              </button>
            </div>

            {consultas.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F4EF] dark:bg-slate-800 text-[#7D9B76] mx-auto flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#2D2B26] dark:text-slate-200">
                  Nenhuma consulta registrada
                </h4>
                <p className="text-xs text-[#7A776D] max-w-sm mx-auto">
                  Cadastre check-ups, atendimentos de emergência, diagnósticos e receitas médicas do seu pet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultas.map(consulta => (
                  <div
                    key={consulta.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F3F1ED] dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F0F4EF] text-[#7D9B76] border border-[#DCE6DA]">
                            {formatDateBR(consulta.data)}
                          </span>
                          <h4 className="text-base font-extrabold text-[#2D2B26] dark:text-white">
                            {consulta.motivo}
                          </h4>
                        </div>
                        {(consulta.veterinario || consulta.clinica) && (
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A776D] dark:text-slate-400 mt-1">
                            {consulta.veterinario && (
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-[#A19E95]" />
                                {consulta.veterinario}
                              </span>
                            )}
                            {consulta.clinica && (
                              <span className="flex items-center gap-1">
                                <Building className="w-3.5 h-3.5 text-[#A19E95]" />
                                {consulta.clinica}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingConsulta(consulta);
                            setIsConsultaModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#7A776D] dark:text-slate-300 hover:bg-[#F3F1ED] dark:hover:bg-slate-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteConsultaConfirm(consulta.id)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {consulta.diagnostico && (
                        <div className="space-y-1 bg-[#FAF9F6] dark:bg-slate-800/50 p-3.5 rounded-2xl border border-[#E8E6DF] dark:border-slate-800">
                          <span className="font-bold text-[#2D2B26] dark:text-slate-300 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-[#7D9B76]" /> Diagnóstico
                          </span>
                          <p className="text-[#7A776D] dark:text-slate-400">{consulta.diagnostico}</p>
                        </div>
                      )}

                      {consulta.tratamento && (
                        <div className="space-y-1 bg-[#FAF9F6] dark:bg-slate-800/50 p-3.5 rounded-2xl border border-[#E8E6DF] dark:border-slate-800">
                          <span className="font-bold text-[#2D2B26] dark:text-slate-300 flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-[#7D9B76]" /> Tratamento
                          </span>
                          <p className="text-[#7A776D] dark:text-slate-400">{consulta.tratamento}</p>
                        </div>
                      )}

                      {consulta.medicamentos && (
                        <div className="space-y-1 bg-[#FAF9F6] dark:bg-slate-800/50 p-3.5 rounded-2xl border border-[#E8E6DF] dark:border-slate-800">
                          <span className="font-bold text-[#2D2B26] dark:text-slate-300 flex items-center gap-1">
                            <Pill className="w-3.5 h-3.5 text-[#D4A373]" /> Medicamentos
                          </span>
                          <p className="text-[#7A776D] dark:text-slate-400">{consulta.medicamentos}</p>
                        </div>
                      )}

                      {consulta.observacoes && (
                        <div className="space-y-1 bg-[#FAF9F6] dark:bg-slate-800/50 p-3.5 rounded-2xl border border-[#E8E6DF] dark:border-slate-800">
                          <span className="font-bold text-[#2D2B26] dark:text-slate-300 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-[#A19E95]" /> Observações
                          </span>
                          <p className="text-[#7A776D] dark:text-slate-400">{consulta.observacoes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. LEMBRETES TAB */}
        {activeTab === 'lembretes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2D2B26] dark:text-white">
                Lembretes & Tarefas de Cuidados
              </h3>
              <button
                onClick={() => {
                  setEditingLembrete(null);
                  setIsLembreteModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#D4A373] hover:bg-[#c29364] text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Lembrete</span>
              </button>
            </div>

            {lembretes.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F9F1EB] dark:bg-slate-800 text-[#D4A373] mx-auto flex items-center justify-center">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#2D2B26] dark:text-slate-200">
                  Nenhum lembrete cadastrado
                </h4>
                <p className="text-xs text-[#7A776D] max-w-sm mx-auto">
                  Programe alertas para vermífugo, antipulgas, banho, tosa, remédios ou retornos veterinários.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lembretes.map(lembrete => (
                  <div
                    key={lembrete.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 overflow-hidden ${
                      lembrete.concluido
                        ? 'bg-[#FAF9F6] dark:bg-slate-900/40 border-[#E8E6DF] dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-900 border-[#E8E6DF] dark:border-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleLembreteDone(lembrete)}
                        className="mt-0.5 text-[#A19E95] hover:text-[#7D9B76] transition-colors shrink-0"
                      >
                        {lembrete.concluido ? (
                          <CheckCircle2 className="w-5 h-5 text-[#7D9B76] fill-[#F0F4EF]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#A19E95] dark:text-slate-700" />
                        )}
                      </button>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F9F1EB] text-[#D4A373] border border-[#EFDED0] shrink-0">
                            {lembrete.categoria}
                          </span>
                          <h4 className={`text-sm font-bold break-words ${lembrete.concluido ? 'line-through text-[#A19E95]' : 'text-[#2D2B26] dark:text-white'}`}>
                            {lembrete.titulo}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#7A776D] dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#7D9B76]" />
                            {formatDateBR(lembrete.data)}
                          </span>
                          {lembrete.hora && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#D4A373]" />
                              {lembrete.hora}
                            </span>
                          )}
                          {lembrete.notificacaoAtiva && (
                            <span className="flex items-center gap-1 text-[#7D9B76] dark:text-sage-300 font-semibold text-[10px]">
                              <Bell className="w-3 h-3" /> Notificação Ativa
                            </span>
                          )}
                        </div>

                        {lembrete.descricao && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 pt-0.5 break-words">
                            {lembrete.descricao}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F3F1ED] dark:border-slate-800/80 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setEditingLembrete(lembrete);
                          setIsLembreteModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteLembreteConfirm(lembrete.id)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Excluir lembrete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-item Modals */}
      <VacinaModal
        isOpen={isVacinaModalOpen}
        vacinaToEdit={editingVacina}
        onClose={() => {
          setIsVacinaModalOpen(false);
          setEditingVacina(null);
        }}
        onSave={handleSaveVacina}
      />

      <ConsultaModal
        isOpen={isConsultaModalOpen}
        consultaToEdit={editingConsulta}
        onClose={() => {
          setIsConsultaModalOpen(false);
          setEditingConsulta(null);
        }}
        onSave={handleSaveConsulta}
      />

      <LembreteModal
        isOpen={isLembreteModalOpen}
        lembreteToEdit={editingLembrete}
        onClose={() => {
          setIsLembreteModalOpen(false);
          setEditingLembrete(null);
        }}
        onSave={handleSaveLembrete}
      />

      <ConfirmationModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.title}
        message={deleteModalConfig.message}
        onConfirm={deleteModalConfig.onConfirm}
        onCancel={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};
