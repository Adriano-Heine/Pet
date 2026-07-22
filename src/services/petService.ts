import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Pet, Vacina, Consulta, Lembrete, Species } from '../types';

// Preset avatar photos for pets by species
export const SPECIES_AVATARS: Record<Species, string> = {
  'Cão': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
  'Gato': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80',
  'Pássaro': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&auto=format&fit=crop&q=80',
  'Coelho': 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500&auto=format&fit=crop&q=80',
  'Hamster': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=500&auto=format&fit=crop&q=80',
  'Réptil': 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=500&auto=format&fit=crop&q=80',
  'Outro': 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=500&auto=format&fit=crop&q=80'
};

// Helper: check if userId is guest
const isGuestId = (userId: string) => userId.startsWith('guest_');

// Helper: Local Storage for Guest Mode
const getGuestPets = (userId: string): Pet[] => {
  const data = localStorage.getItem(`petcare_pets_${userId}`);
  return data ? JSON.parse(data) : [];
};

const saveGuestPets = (userId: string, pets: Pet[]) => {
  localStorage.setItem(`petcare_pets_${userId}`, JSON.stringify(pets));
};

const getGuestSubItems = <T>(userId: string, petId: string, sub: string): T[] => {
  const data = localStorage.getItem(`petcare_${sub}_${userId}_${petId}`);
  return data ? JSON.parse(data) : [];
};

const saveGuestSubItems = <T>(userId: string, petId: string, sub: string, items: T[]) => {
  localStorage.setItem(`petcare_${sub}_${userId}_${petId}`, JSON.stringify(items));
};

// --- PET CRUD ---

export async function fetchUserPets(userId: string): Promise<Pet[]> {
  if (isGuestId(userId)) {
    return getGuestPets(userId);
  }

  try {
    const petsRef = collection(db, 'users', userId, 'pets');
    const q = query(petsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Pet[];
  } catch (err) {
    console.error('Error fetching pets from Firestore, using local fallback:', err);
    return getGuestPets(userId);
  }
}

export async function addPet(userId: string, petData: Omit<Pet, 'id'>): Promise<string> {
  if (isGuestId(userId)) {
    const pets = getGuestPets(userId);
    const newId = 'pet_' + Date.now();
    const newPet: Pet = {
      ...petData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    pets.unshift(newPet);
    saveGuestPets(userId, pets);
    return newId;
  }

  try {
    const petsRef = collection(db, 'users', userId, 'pets');
    const docRef = await addDoc(petsRef, {
      ...petData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.error('Error adding pet to Firestore, saving locally:', err);
    const pets = getGuestPets(userId);
    const newId = 'pet_' + Date.now();
    const newPet: Pet = { ...petData, id: newId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    pets.unshift(newPet);
    saveGuestPets(userId, pets);
    return newId;
  }
}

export async function updatePet(userId: string, petId: string, updates: Partial<Pet>): Promise<void> {
  if (isGuestId(userId)) {
    const pets = getGuestPets(userId);
    const index = pets.findIndex(p => p.id === petId);
    if (index !== -1) {
      pets[index] = { ...pets[index], ...updates, updatedAt: new Date().toISOString() };
      saveGuestPets(userId, pets);
    }
    return;
  }

  try {
    const petRef = doc(db, 'users', userId, 'pets', petId);
    await updateDoc(petRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error updating pet in Firestore:', err);
    const pets = getGuestPets(userId);
    const index = pets.findIndex(p => p.id === petId);
    if (index !== -1) {
      pets[index] = { ...pets[index], ...updates, updatedAt: new Date().toISOString() };
      saveGuestPets(userId, pets);
    }
  }
}

export async function deletePet(userId: string, petId: string): Promise<void> {
  if (isGuestId(userId)) {
    const pets = getGuestPets(userId).filter(p => p.id !== petId);
    saveGuestPets(userId, pets);
    localStorage.removeItem(`petcare_vacinas_${userId}_${petId}`);
    localStorage.removeItem(`petcare_consultas_${userId}_${petId}`);
    localStorage.removeItem(`petcare_lembretes_${userId}_${petId}`);
    return;
  }

  try {
    const petRef = doc(db, 'users', userId, 'pets', petId);
    await deleteDoc(petRef);
  } catch (err) {
    console.error('Error deleting pet from Firestore:', err);
    const pets = getGuestPets(userId).filter(p => p.id !== petId);
    saveGuestPets(userId, pets);
  }
}

// --- PHOTO UPLOAD SERVICE ---

export async function uploadPetPhoto(userId: string, petId: string, file: File): Promise<string> {
  // If user is guest or storage fails, compress to Data URL
  if (isGuestId(userId)) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  try {
    const storageRef = ref(storage, `users/${userId}/pets/${petId}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.warn('Firebase storage upload failed or not configured, using Data URL fallback:', err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}

// --- VACINAS CRUD ---

export async function fetchVacinas(userId: string, petId: string): Promise<Vacina[]> {
  if (isGuestId(userId)) {
    return getGuestSubItems<Vacina>(userId, petId, 'vacinas');
  }

  try {
    const vacinasRef = collection(db, 'users', userId, 'pets', petId, 'vacinas');
    const snapshot = await getDocs(vacinasRef);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Vacina[];
    return items.sort((a, b) => new Date(b.dataAplicacao).getTime() - new Date(a.dataAplicacao).getTime());
  } catch (err) {
    return getGuestSubItems<Vacina>(userId, petId, 'vacinas');
  }
}

export async function addVacina(userId: string, petId: string, data: Omit<Vacina, 'id'>): Promise<Vacina> {
  if (isGuestId(userId)) {
    const items = getGuestSubItems<Vacina>(userId, petId, 'vacinas');
    const newItem: Vacina = { ...data, id: 'vac_' + Date.now(), createdAt: new Date().toISOString() };
    items.unshift(newItem);
    saveGuestSubItems(userId, petId, 'vacinas', items);
    return newItem;
  }

  try {
    const vacinasRef = collection(db, 'users', userId, 'pets', petId, 'vacinas');
    const docRef = await addDoc(vacinasRef, { ...data, createdAt: new Date().toISOString() });
    return { ...data, id: docRef.id };
  } catch (err) {
    const items = getGuestSubItems<Vacina>(userId, petId, 'vacinas');
    const newItem: Vacina = { ...data, id: 'vac_' + Date.now(), createdAt: new Date().toISOString() };
    items.unshift(newItem);
    saveGuestSubItems(userId, petId, 'vacinas', items);
    return newItem;
  }
}

export async function updateVacina(userId: string, petId: string, vacinaId: string, updates: Partial<Vacina>): Promise<void> {
  if (isGuestId(userId)) {
    const items = getGuestSubItems<Vacina>(userId, petId, 'vacinas');
    const idx = items.findIndex(v => v.id === vacinaId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      saveGuestSubItems(userId, petId, 'vacinas', items);
    }
    return;
  }

  try {
    const vacRef = doc(db, 'users', userId, 'pets', petId, 'vacinas', vacinaId);
    await updateDoc(vacRef, updates);
  } catch (err) {
    const items = getGuestSubItems<Vacina>(userId, petId, 'vacinas');
    const idx = items.findIndex(v => v.id === vacinaId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      saveGuestSubItems(userId, petId, 'vacinas', items);
    }
  }
}

export async function deleteVacina(userId: string, petId: string, vacinaId: string): Promise<void> {
  if (isGuestId(userId)) {
    const items = getGuestSubItems<Vacina>(userId, petId, 'vacinas').filter(v => v.id !== vacinaId);
    saveGuestSubItems(userId, petId, 'vacinas', items);
    return;
  }

  try {
    const vacRef = doc(db, 'users', userId, 'pets', petId, 'vacinas', vacinaId);
    await deleteDoc(vacRef);
  } catch (err) {
    const items = getGuestSubItems<Vacina>(userId, petId, 'vacinas').filter(v => v.id !== vacinaId);
    saveGuestSubItems(userId, petId, 'vacinas', items);
  }
}

// --- CONSULTAS CRUD ---

export async function fetchConsultas(userId: string, petId: string): Promise<Consulta[]> {
  if (isGuestId(userId)) {
    return getGuestSubItems<Consulta>(userId, petId, 'consultas');
  }

  try {
    const refCol = collection(db, 'users', userId, 'pets', petId, 'consultas');
    const snapshot = await getDocs(refCol);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Consulta[];
    return items.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  } catch (err) {
    return getGuestSubItems<Consulta>(userId, petId, 'consultas');
  }
}

export async function addConsulta(userId: string, petId: string, data: Omit<Consulta, 'id'>): Promise<Consulta> {
  if (isGuestId(userId)) {
    const items = getGuestSubItems<Consulta>(userId, petId, 'consultas');
    const newItem: Consulta = { ...data, id: 'con_' + Date.now(), createdAt: new Date().toISOString() };
    items.unshift(newItem);
    saveGuestSubItems(userId, petId, 'consultas', items);
    return newItem;
  }

  try {
    const refCol = collection(db, 'users', userId, 'pets', petId, 'consultas');
    const docRef = await addDoc(refCol, { ...data, createdAt: new Date().toISOString() });
    return { ...data, id: docRef.id };
  } catch (err) {
    const items = getGuestSubItems<Consulta>(userId, petId, 'consultas');
    const newItem: Consulta = { ...data, id: 'con_' + Date.now(), createdAt: new Date().toISOString() };
    items.unshift(newItem);
    saveGuestSubItems(userId, petId, 'consultas', items);
    return newItem;
  }
}

export async function updateConsulta(userId: string, petId: string, consultaId: string, updates: Partial<Consulta>): Promise<void> {
  if (isGuestId(userId)) {
    const items = getGuestSubItems<Consulta>(userId, petId, 'consultas');
    const idx = items.findIndex(c => c.id === consultaId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      saveGuestSubItems(userId, petId, 'consultas', items);
    }
    return;
  }

  try {
    const refDoc = doc(db, 'users', userId, 'pets', petId, 'consultas', consultaId);
    await updateDoc(refDoc, updates);
  } catch (err) {
    const items = getGuestSubItems<Consulta>(userId, petId, 'consultas');
    const idx = items.findIndex(c => c.id === consultaId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      saveGuestSubItems(userId, petId, 'consultas', items);
    }
  }
}

export async function deleteConsulta(userId: string, petId: string, consultaId: string): Promise<void> {
  if (isGuestId(userId)) {
    const items = getGuestSubItems<Consulta>(userId, petId, 'consultas').filter(c => c.id !== consultaId);
    saveGuestSubItems(userId, petId, 'consultas', items);
    return;
  }

  try {
    const refDoc = doc(db, 'users', userId, 'pets', petId, 'consultas', consultaId);
    await deleteDoc(refDoc);
  } catch (err) {
    const items = getGuestSubItems<Consulta>(userId, petId, 'consultas').filter(c => c.id !== consultaId);
    saveGuestSubItems(userId, petId, 'consultas', items);
  }
}

// --- LEMBRETES CRUD ---

export async function fetchLembretes(userId: string, petId: string): Promise<Lembrete[]> {
  if (isGuestId(userId)) {
    return getGuestSubItems<Lembrete>(userId, petId, 'lembretes');
  }

  try {
    const refCol = collection(db, 'users', userId, 'pets', petId, 'lembretes');
    const snapshot = await getDocs(refCol);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Lembrete[];
    return items.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  } catch (err) {
    return getGuestSubItems<Lembrete>(userId, petId, 'lembretes');
  }
}

export async function addLembrete(userId: string, petId: string, data: Omit<Lembrete, 'id'>): Promise<Lembrete> {
  if (isGuestId(userId)) {
    const items = getGuestSubItems<Lembrete>(userId, petId, 'lembretes');
    const newItem: Lembrete = { ...data, id: 'lem_' + Date.now(), createdAt: new Date().toISOString() };
    items.push(newItem);
    saveGuestSubItems(userId, petId, 'lembretes', items);
    return newItem;
  }

  try {
    const refCol = collection(db, 'users', userId, 'pets', petId, 'lembretes');
    const docRef = await addDoc(refCol, { ...data, createdAt: new Date().toISOString() });
    return { ...data, id: docRef.id };
  } catch (err) {
    const items = getGuestSubItems<Lembrete>(userId, petId, 'lembretes');
    const newItem: Lembrete = { ...data, id: 'lem_' + Date.now(), createdAt: new Date().toISOString() };
    items.push(newItem);
    saveGuestSubItems(userId, petId, 'lembretes', items);
    return newItem;
  }
}

export async function updateLembrete(userId: string, petId: string, lembreteId: string, updates: Partial<Lembrete>): Promise<void> {
  if (isGuestId(userId)) {
    const items = getGuestSubItems<Lembrete>(userId, petId, 'lembretes');
    const idx = items.findIndex(l => l.id === lembreteId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      saveGuestSubItems(userId, petId, 'lembretes', items);
    }
    return;
  }

  try {
    const refDoc = doc(db, 'users', userId, 'pets', petId, 'lembretes', lembreteId);
    await updateDoc(refDoc, updates);
  } catch (err) {
    const items = getGuestSubItems<Lembrete>(userId, petId, 'lembretes');
    const idx = items.findIndex(l => l.id === lembreteId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      saveGuestSubItems(userId, petId, 'lembretes', items);
    }
  }
}

export async function deleteLembrete(userId: string, petId: string, lembreteId: string): Promise<void> {
  if (isGuestId(userId)) {
    const items = getGuestSubItems<Lembrete>(userId, petId, 'lembretes').filter(l => l.id !== lembreteId);
    saveGuestSubItems(userId, petId, 'lembretes', items);
    return;
  }

  try {
    const refDoc = doc(db, 'users', userId, 'pets', petId, 'lembretes', lembreteId);
    await deleteDoc(refDoc);
  } catch (err) {
    const items = getGuestSubItems<Lembrete>(userId, petId, 'lembretes').filter(l => l.id !== lembreteId);
    saveGuestSubItems(userId, petId, 'lembretes', items);
  }
}

// Seed sample pet for instant demo if user wants
export async function seedDemoPets(userId: string): Promise<void> {
  const samplePets: Omit<Pet, 'id'>[] = [
    {
      name: 'Thor',
      species: 'Cão',
      breed: 'Golden Retriever',
      sex: 'Macho',
      birthDate: '2022-04-12',
      weight: 28.5,
      color: 'Dourado',
      microchip: '982000394812304',
      photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
      observacoesMedicas: 'Alergia à Dipirona. Dieta especial com ração hipoalergênica.'
    },
    {
      name: 'Luna',
      species: 'Gato',
      breed: 'Siamês',
      sex: 'Fêmea',
      birthDate: '2023-01-20',
      weight: 4.2,
      color: 'Palha com pontas escuras',
      microchip: '982000881239120',
      photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
      observacoesMedicas: 'Sem alergias conhecidas. Castrada. Vermifugação em dia.'
    }
  ];

  for (const pet of samplePets) {
    const petId = await addPet(userId, pet);
    if (pet.name === 'Thor') {
      await addVacina(userId, petId, {
        nome: 'V10 (Múltipla Canina)',
        dataAplicacao: '2026-03-10',
        proximaDose: '2027-03-10',
        observacoes: 'Aplicada na clínica PetCare Centro'
      });
      await addVacina(userId, petId, {
        nome: 'Antirrábica',
        dataAplicacao: '2025-08-15',
        proximaDose: '2026-08-15',
        observacoes: 'Perto do vencimento'
      });
      await addConsulta(userId, petId, {
        data: '2026-05-18',
        veterinario: 'Dra. Camila Silva',
        clinica: 'VetSaúde 24h',
        motivo: 'Check-up anual e exame de sangue',
        diagnostico: 'Ótimo estado de saúde geral',
        tratamento: 'Manter ração hipoalergênica',
        medicamentos: 'Suplemento ômega 3',
        observacoes: 'Retorno em 6 meses'
      });
      await addLembrete(userId, petId, {
        titulo: 'Aplicar Antipulgas Simparic',
        categoria: 'Antipulgas',
        data: '2026-08-01',
        hora: '09:00',
        descricao: 'Comprimido mastigável de 40mg',
        notificacaoAtiva: true,
        concluido: false
      });
      await addLembrete(userId, petId, {
        titulo: 'Banho e Tosa de Verão',
        categoria: 'Banho',
        data: '2026-07-28',
        hora: '14:30',
        descricao: 'Na petshop Banho Cheiroso',
        notificacaoAtiva: true,
        concluido: false
      });
    }
  }
}
