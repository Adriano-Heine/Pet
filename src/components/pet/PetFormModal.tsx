import React, { useState, useEffect } from 'react';
import { X, Upload, Camera, AlertCircle, Trash2, Check, Sparkles } from 'lucide-react';
import { Pet, Species, Sex } from '../../types';
import { SPECIES_AVATARS, uploadPetPhoto } from '../../services/petService';
import { COMMON_MEDICAL_TAGS } from '../../utils/dateUtils';

interface PetFormModalProps {
  isOpen: boolean;
  petToEdit?: Pet | null;
  userId: string;
  onClose: () => void;
  onSave: (petData: Omit<Pet, 'id'>, petId?: string) => Promise<void>;
  onDelete?: (petId: string) => void;
}

export const PetFormModal: React.FC<PetFormModalProps> = ({
  isOpen,
  petToEdit,
  userId,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('Cão');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<Sex>('Macho');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState<string>('');
  const [color, setColor] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [observacoesMedicas, setObservacoesMedicas] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (petToEdit) {
      setName(petToEdit.name || '');
      setSpecies(petToEdit.species || 'Cão');
      setBreed(petToEdit.breed || '');
      setSex(petToEdit.sex || 'Macho');
      setBirthDate(petToEdit.birthDate || '');
      setWeight(petToEdit.weight !== undefined ? String(petToEdit.weight) : '');
      setColor(petToEdit.color || '');
      setMicrochip(petToEdit.microchip || '');
      setObservacoesMedicas(petToEdit.observacoesMedicas || '');
      setPhotoUrl(petToEdit.photoUrl || '');
      setPhotoPreview(petToEdit.photoUrl || SPECIES_AVATARS[petToEdit.species || 'Cão']);
    } else {
      setName('');
      setSpecies('Cão');
      setBreed('');
      setSex('Macho');
      setBirthDate('');
      setWeight('');
      setColor('');
      setMicrochip('');
      setObservacoesMedicas('');
      setPhotoUrl('');
      setPhotoPreview(SPECIES_AVATARS['Cão']);
    }
    setSelectedFile(null);
    setError(null);
  }, [petToEdit, isOpen]);

  // When species changes and no custom photo file/URL was selected, update preset photo
  const handleSpeciesChange = (newSpecies: Species) => {
    setSpecies(newSpecies);
    if (!selectedFile && (!photoUrl || photoUrl.includes('unsplash.com'))) {
      setPhotoPreview(SPECIES_AVATARS[newSpecies]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleTagClick = (tag: string) => {
    if (observacoesMedicas.includes(tag)) return;
    setObservacoesMedicas(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n- ${tag}` : `- ${tag}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do pet.');
      return;
    }
    if (!birthDate) {
      setError('Por favor, informe a data de nascimento do pet.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalPhotoUrl = photoUrl;

      // Handle image upload if a file was selected
      if (selectedFile) {
        const petIdForPhoto = petToEdit?.id || 'temp_' + Date.now();
        finalPhotoUrl = await uploadPetPhoto(userId, petIdForPhoto, selectedFile);
      } else if (!finalPhotoUrl) {
        finalPhotoUrl = SPECIES_AVATARS[species];
      }

      const petData: Omit<Pet, 'id'> = {
        name: name.trim(),
        species,
        breed: breed.trim() || 'Sem raça definida (SRD)',
        sex,
        birthDate,
        weight: weight ? parseFloat(weight) : undefined,
        color: color.trim() || undefined,
        microchip: microchip.trim() || undefined,
        observacoesMedicas: observacoesMedicas.trim() || undefined,
        photoUrl: finalPhotoUrl,
      };

      await onSave(petData, petToEdit?.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao salvar informações do pet. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {petToEdit ? 'Editar Pet' : 'Cadastrar Pet'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form id="petForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Photo Picker */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div className="relative group shrink-0">
                <img
                  src={photoPreview || SPECIES_AVATARS[species]}
                  alt="Foto do Pet"
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-800 shadow-md"
                />
                <label className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Foto do Pet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Envie uma foto do seu dispositivo ou use o avatar da espécie.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Escolher imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {selectedFile && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Imagem selecionada!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Pet *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Rex, Mia, Bob..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Espécie *
                </label>
                <select
                  value={species}
                  onChange={e => handleSpeciesChange(e.target.value as Species)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Cão">Cão (Cachorro)</option>
                  <option value="Gato">Gato</option>
                  <option value="Pássaro">Pássaro</option>
                  <option value="Coelho">Coelho</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Réptil">Réptil</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Raça
                </label>
                <input
                  type="text"
                  value={breed}
                  onChange={e => setBreed(e.target.value)}
                  placeholder="Ex: Golden, Poodle, SRD..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sexo *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSex('Macho')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      sex === 'Macho'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Macho
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex('Fêmea')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      sex === 'Fêmea'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Fêmea
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Peso em kg (opcional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="Ex: 12.5"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cor
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  placeholder="Ex: Caramel, Preto e Branco..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Microchip (opcional)
                </label>
                <input
                  type="text"
                  value={microchip}
                  onChange={e => setMicrochip(e.target.value)}
                  placeholder="Número do microchip"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Observações Médicas Field (Prominent) */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Observações Médicas & Alertas Importantes</span>
                </label>
                <span className="text-[11px] text-slate-400">Sempre visível no perfil</span>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alergias, doenças contínuas, dieta especial ou cuidados para atendimentos veterinários.
              </p>

              {/* Quick Tag Chips */}
              <div className="flex flex-wrap gap-1.5 py-1">
                {COMMON_MEDICAL_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={observacoesMedicas}
                onChange={e => setObservacoesMedicas(e.target.value)}
                placeholder="Digite detalhes médicos importantes. Ex: Alergia à Dipirona, usa medicação contínua para coração, comida hipoalergênica..."
                className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          {petToEdit && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(petToEdit.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Pet</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="petForm"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Pet'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
