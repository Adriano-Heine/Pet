import React, { useState, useEffect } from 'react';
import {
  PawPrint,
  Plus,
  Syringe,
  Stethoscope,
  Bell,
  Search,
  Sparkles,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Pet, PetSummaryStats, Vacina, Consulta, Lembrete } from '../../types';
import { fetchVacinas, fetchConsultas, fetchLembretes, seedDemoPets } from '../../services/petService';
import { calculateAge, formatDateBR, getVacinaStatus } from '../../utils/dateUtils';

interface DashboardProps {
  pets: Pet[];
  userId: string;
  loading: boolean;
  onSelectPet: (pet: Pet) => void;
  onAddPet: () => void;
  onReloadPets: () => void;
  onSuccessToast: (msg: string) => void;
}

interface PetWithSubDetails {
  pet: Pet;
  nextVacina?: Vacina;
  nextConsulta?: Consulta;
  nextLembrete?: Lembrete;
  hasMedicalNotes: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  pets,
  userId,
  loading,
  onSelectPet,
  onAddPet,
  onReloadPets,
  onSuccessToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState<string>('Todas');
  const [petsDetailed, setPetsDetailed] = useState<PetWithSubDetails[]>([]);
  const [summaryStats, setSummaryStats] = useState<PetSummaryStats>({
    totalPets: 0,
    pendingVaccines: 0,
    upcomingConsultas: 0,
    activeLembretes: 0,
  });
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Load sub-item summaries for stats & cards
  useEffect(() => {
    let isMounted = true;

    async function loadStatsAndDetails() {
      if (!pets || pets.length === 0) {
        setPetsDetailed([]);
        setSummaryStats({
          totalPets: 0,
          pendingVaccines: 0,
          upcomingConsultas: 0,
          activeLembretes: 0,
        });
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      let pendingVacCount = 0;
      let upcomingConsCount = 0;
      let activeLembCount = 0;

      const detailedList: PetWithSubDetails[] = [];

      for (const pet of pets) {
        try {
          const [vList, cList, lList] = await Promise.all([
            fetchVacinas(userId, pet.id),
            fetchConsultas(userId, pet.id),
            fetchLembretes(userId, pet.id),
          ]);

          // Pending or upcoming vaccines
          const upcomingVacs = vList.filter(v => v.proximaDose);
          upcomingVacs.forEach(v => {
            const st = getVacinaStatus(v.proximaDose);
            if (st.statusKey === 'warning' || st.statusKey === 'overdue') {
              pendingVacCount++;
            }
          });

          // Next vaccine for card
          const sortedVacs = [...vList].sort((a, b) => {
            if (!a.proximaDose) return 1;
            if (!b.proximaDose) return -1;
            return new Date(a.proximaDose).getTime() - new Date(b.proximaDose).getTime();
          });
          const nextVac = sortedVacs.find(v => v.proximaDose);

          // Upcoming consultas
          const upcomingCons = cList.filter(c => new Date(c.data).getTime() >= new Date().setHours(0,0,0,0));
          upcomingConsCount += upcomingCons.length;
          const nextCon = upcomingCons[0] || cList[0];

          // Active lembretes
          const activeLembs = lList.filter(l => !l.concluido);
          activeLembCount += activeLembs.length;
          const nextLemb = activeLembs[0];

          detailedList.push({
            pet,
            nextVacina: nextVac,
            nextConsulta: nextCon,
            nextLembrete: nextLemb,
            hasMedicalNotes: Boolean(pet.observacoesMedicas && pet.observacoesMedicas.trim().length > 0)
          });
        } catch (err) {
          detailedList.push({
            pet,
            hasMedicalNotes: Boolean(pet.observacoesMedicas && pet.observacoesMedicas.trim().length > 0)
          });
        }
      }

      if (isMounted) {
        setPetsDetailed(detailedList);
        setSummaryStats({
          totalPets: pets.length,
          pendingVaccines: pendingVacCount,
          upcomingConsultas: upcomingConsCount,
          activeLembretes: activeLembCount,
        });
        setLoadingDetails(false);
      }
    }

    loadStatsAndDetails();

    return () => { isMounted = false; };
  }, [pets, userId]);

  // Seed sample pets handler
  const handleSeedDemo = async () => {
    try {
      await seedDemoPets(userId);
      onSuccessToast('Pets de exemplo adicionados com sucesso!');
      onReloadPets();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Pets
  const filteredPetCards = petsDetailed.filter(item => {
    const p = item.pet;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.breed.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecies =
      selectedSpeciesFilter === 'Todas' || p.species === selectedSpeciesFilter;

    return matchesSearch && matchesSpecies;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-in fade-in duration-300 relative pb-24">
      
      {/* Resumo no topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F4EF] dark:bg-slate-800 text-[#7D9B76] dark:text-sage-300 flex items-center justify-center shrink-0">
            <PawPrint className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#A19E95] font-bold">
              Total de Pets
            </span>
            <p className="text-2xl font-bold text-[#2D2B26] dark:text-white">
              {summaryStats.totalPets}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-[#F9F1EB] dark:bg-slate-900 border border-[#EFDED0] dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-[#D4A373] flex items-center justify-center shrink-0 shadow-xs">
            <Syringe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#D4A373] font-bold">
              Vacinas
            </span>
            <p className="text-2xl font-bold text-[#D4A373]">
              {summaryStats.pendingVaccines}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F4EF] dark:bg-slate-800 text-[#7D9B76] dark:text-sage-300 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#A19E95] font-bold">
              Consultas
            </span>
            <p className="text-2xl font-bold text-[#2D2B26] dark:text-white">
              {summaryStats.upcomingConsultas}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-[#F0F4EF] dark:bg-slate-900 border border-[#DCE6DA] dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-[#7D9B76] dark:text-sage-300 flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#7D9B76] font-bold">
              Lembretes
            </span>
            <p className="text-2xl font-bold text-[#7D9B76]">
              {summaryStats.activeLembretes}
            </p>
          </div>
        </div>
      </div>

      {/* Header Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-xl font-extrabold text-[#2D2B26] dark:text-white tracking-tight">
            Meus Animais de Estimação
          </h2>
          <p className="text-xs text-[#7A776D] dark:text-slate-400 mt-0.5">
            Selecione um pet para ver a ficha de saúde completa, vacinas e consultas
          </p>
        </div>

        {/* Search Input & Species Filters */}
        {pets.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#A19E95]" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou raça..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl text-xs bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 text-[#2D2B26] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D9B76]"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {['Todas', 'Cão', 'Gato', 'Outro'].map(sp => (
                <button
                  key={sp}
                  onClick={() => setSelectedSpeciesFilter(sp)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedSpeciesFilter === sp
                      ? 'bg-[#7D9B76] text-white dark:bg-sage-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-[#7A776D] dark:text-slate-400 border border-[#E8E6DF] dark:border-slate-800 hover:bg-[#F3F1ED]'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => (
            <div key={n} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#F3F1ED] dark:bg-slate-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#F3F1ED] dark:bg-slate-800 rounded-md w-3/4" />
                  <div className="h-3 bg-[#F3F1ED] dark:bg-slate-800 rounded-md w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : pets.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 shadow-sm space-y-6 max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-[#F0F4EF] dark:bg-slate-800 text-[#7D9B76] dark:text-sage-300 mx-auto flex items-center justify-center ring-8 ring-[#F0F4EF]/50">
            <PawPrint className="w-10 h-10 stroke-[1.8]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-[#2D2B26] dark:text-white">
              Nenhum pet cadastrado ainda
            </h3>
            <p className="text-xs text-[#7A776D] dark:text-slate-400 leading-relaxed">
              Comece cadastrando seu primeiro animal de estimação para controlar vacinas, exames, consultas e lembretes com facilidade.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onAddPet}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#7D9B76] hover:bg-[#6b8664] text-white text-xs font-bold shadow-lg shadow-[#7d9b7644] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar meu primeiro Pet</span>
            </button>

            <button
              onClick={handleSeedDemo}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#F3F1ED] dark:bg-slate-800 hover:bg-[#E8E6DF] dark:hover:bg-slate-700 text-[#3D3B36] dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#D4A373]" />
              <span>Carregar Pets de Exemplo</span>
            </button>
          </div>
        </div>
      ) : filteredPetCards.length === 0 ? (
        /* No Search Match */
        <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#E8E6DF] dark:border-slate-800 space-y-3">
          <p className="text-sm font-bold text-[#3D3B36] dark:text-slate-300">
            Nenhum pet encontrado para "{searchTerm}"
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSpeciesFilter('Todas');
            }}
            className="text-xs font-semibold text-[#7D9B76] dark:text-sage-300 hover:underline"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        /* Pets Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPetCards.map(({ pet, nextVacina, nextConsulta, nextLembrete, hasMedicalNotes }) => {
            const ageText = calculateAge(pet.birthDate);
            const vacStatus = nextVacina?.proximaDose ? getVacinaStatus(nextVacina.proximaDose) : null;

            return (
              <div
                key={pet.id}
                onClick={() => onSelectPet(pet)}
                className="group bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-[#E8E6DF] dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[#7D9B76] transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Top Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={pet.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80'}
                      alt={pet.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#F3F1ED] dark:ring-slate-800 group-hover:scale-105 transition-transform"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-lg font-extrabold text-[#2D2B26] dark:text-white truncate">
                          {pet.name}
                        </h3>
                        <div className="w-8 h-8 rounded-full bg-[#F3F1ED] dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <ChevronRight className="w-4 h-4 text-[#7A776D] dark:text-slate-400 group-hover:text-[#7D9B76] transition-colors" />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#7A776D] dark:text-slate-400 font-medium mt-0.5">
                        <span className="font-semibold text-[#7D9B76] dark:text-sage-300">{pet.species}</span>
                        <span>•</span>
                        <span className="truncate">{pet.breed}</span>
                      </div>

                      <div className="text-[11px] font-semibold text-[#A19E95] dark:text-slate-500 mt-1">
                        {ageText}
                      </div>
                    </div>
                  </div>

                  {/* Medical Notes Banner Alert if present */}
                  {hasMedicalNotes && (
                    <div className="p-3 rounded-2xl bg-[#FFF9F5] dark:bg-slate-800 border border-[#EFDED0] text-[#5C5952] dark:text-slate-300 text-[11px] font-medium flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
                      <span className="truncate">
                        {pet.observacoesMedicas}
                      </span>
                    </div>
                  )}

                  {/* Health Cards Summary */}
                  <div className="space-y-2 pt-2 border-t border-[#F3F1ED] dark:border-slate-800 text-xs">
                    {/* Próxima Vacina */}
                    {nextVacina?.proximaDose ? (
                      <div className="flex items-center justify-between text-[#3D3B36] dark:text-slate-300">
                        <span className="flex items-center gap-1.5 font-medium text-[#7A776D] dark:text-slate-400">
                          <Syringe className="w-3.5 h-3.5 text-[#7D9B76]" />
                          <span>Vacina: {nextVacina.nome}</span>
                        </span>
                        {vacStatus && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F0F4EF] text-[#7D9B76] border border-[#DCE6DA]">
                            {formatDateBR(nextVacina.proximaDose)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[#A19E95] text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Syringe className="w-3.5 h-3.5 text-[#A19E95]" />
                          <span>Próxima vacina</span>
                        </span>
                        <span>Não agendada</span>
                      </div>
                    )}

                    {/* Próxima Consulta ou Lembrete */}
                    {nextConsulta ? (
                      <div className="flex items-center justify-between text-[#3D3B36] dark:text-slate-300">
                        <span className="flex items-center gap-1.5 font-medium text-[#7A776D] dark:text-slate-400">
                          <Stethoscope className="w-3.5 h-3.5 text-[#7D9B76]" />
                          <span>Consulta</span>
                        </span>
                        <span className="font-bold text-[#7D9B76]">
                          {formatDateBR(nextConsulta.data)}
                        </span>
                      </div>
                    ) : nextLembrete ? (
                      <div className="flex items-center justify-between text-[#3D3B36] dark:text-slate-300">
                        <span className="flex items-center gap-1.5 font-medium text-[#7A776D] dark:text-slate-400">
                          <Bell className="w-3.5 h-3.5 text-[#D4A373]" />
                          <span className="truncate max-w-[120px]">{nextLembrete.titulo}</span>
                        </span>
                        <span className="font-bold text-[#D4A373]">
                          {formatDateBR(nextLembrete.data)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[#A19E95] text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#A19E95]" />
                          <span>Próximo compromisso</span>
                        </span>
                        <span>Sem pendências</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-2 text-right">
                  <span className="text-xs font-bold text-[#7D9B76] dark:text-sage-300 group-hover:underline inline-flex items-center gap-1">
                    Ver ficha do pet
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (+ Adicionar Pet) */}
      <button
        onClick={onAddPet}
        className="fixed bottom-6 right-6 z-40 bg-[#7D9B76] hover:bg-[#6b8664] active:scale-95 text-white font-extrabold px-5 py-3.5 rounded-3xl shadow-lg shadow-[#7d9b7644] flex items-center gap-2.5 transition-all text-xs sm:text-sm border-2 border-white dark:border-slate-900"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Adicionar Pet</span>
      </button>

    </div>
  );
};
