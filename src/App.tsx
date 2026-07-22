import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { DeveloperBanner } from './components/common/DeveloperBanner';
import { Dashboard } from './components/dashboard/Dashboard';
import { PetProfileView } from './components/pet/PetProfileView';
import { PetFormModal } from './components/pet/PetFormModal';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { Pet } from './types';
import { fetchUserPets, addPet, updatePet, deletePet } from './services/petService';

const PetCareApp: React.FC = () => {
  const { activeUser, isGuest, effectiveUserId, loginAsGuest } = useAuth();

  // Selected Pet for profile view
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // User pets list
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);

  // Modals state
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [petToEdit, setPetToEdit] = useState<Pet | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Delete pet confirmation
  const [petToDeleteId, setPetToDeleteId] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Ensure default guest mode if neither user nor guest exists on launch
  useEffect(() => {
    if (!activeUser && !isGuest) {
      loginAsGuest();
    }
  }, [activeUser, isGuest]);

  // Fetch pets whenever effectiveUserId changes
  const loadPets = async () => {
    if (!effectiveUserId) return;
    setLoadingPets(true);
    try {
      const pList = await fetchUserPets(effectiveUserId);
      setPets(pList);

      // If selectedPet was updated, keep selectedPet reference fresh
      if (selectedPet) {
        const fresh = pList.find(p => p.id === selectedPet.id);
        if (fresh) {
          setSelectedPet(fresh);
        } else {
          setSelectedPet(null);
        }
      }
    } catch (err) {
      console.error('Error fetching pets:', err);
    } finally {
      setLoadingPets(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, [effectiveUserId]);

  // Pet Form Save
  const handleSavePet = async (petData: Omit<Pet, 'id'>, petId?: string) => {
    if (!effectiveUserId) return;

    if (petId) {
      await updatePet(effectiveUserId, petId, petData);
      addToast('Pet atualizado com sucesso!');
    } else {
      const newId = await addPet(effectiveUserId, petData);
      addToast('Pet cadastrado com sucesso!');
    }

    await loadPets();
  };

  // Pet Delete Confirm
  const handleConfirmDeletePet = async () => {
    if (!effectiveUserId || !petToDeleteId) return;
    await deletePet(effectiveUserId, petToDeleteId);
    addToast('Pet excluído com sucesso.');
    setPetToDeleteId(null);
    setIsPetModalOpen(false);
    setSelectedPet(null);
    await loadPets();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col">
      
      {/* Top Discreet Banner */}
      <DeveloperBanner />

      {/* Navbar */}
      <Header
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {selectedPet ? (
          <PetProfileView
            pet={selectedPet}
            userId={effectiveUserId || 'guest'}
            onBack={() => setSelectedPet(null)}
            onEditPet={() => {
              setPetToEdit(selectedPet);
              setIsPetModalOpen(true);
            }}
            onSuccessToast={addToast}
          />
        ) : (
          <Dashboard
            pets={pets}
            userId={effectiveUserId || 'guest'}
            loading={loadingPets}
            onSelectPet={pet => setSelectedPet(pet)}
            onAddPet={() => {
              setPetToEdit(null);
              setIsPetModalOpen(true);
            }}
            onReloadPets={loadPets}
            onSuccessToast={addToast}
          />
        )}
      </main>

      {/* Pet Create/Edit Modal */}
      <PetFormModal
        isOpen={isPetModalOpen}
        petToEdit={petToEdit}
        userId={effectiveUserId || 'guest'}
        onClose={() => {
          setIsPetModalOpen(false);
          setPetToEdit(null);
        }}
        onSave={handleSavePet}
        onDelete={petId => setPetToDeleteId(petId)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessToast={addToast}
      />

      {/* Pet Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(petToDeleteId)}
        title="Excluir Pet"
        message="Tem certeza de que deseja excluir este pet? Todos os registros de vacinas, consultas e lembretes serão permanentemente removidos."
        confirmLabel="Excluir Definitivamente"
        onConfirm={handleConfirmDeletePet}
        onCancel={() => setPetToDeleteId(null)}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PetCareApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
