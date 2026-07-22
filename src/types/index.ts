export type Species = 'Cão' | 'Gato' | 'Pássaro' | 'Coelho' | 'Hamster' | 'Réptil' | 'Outro';

export type Sex = 'Macho' | 'Fêmea';

export type ReminderCategory =
  | 'Vermífugo'
  | 'Antipulgas'
  | 'Banho'
  | 'Tosa'
  | 'Retorno veterinário'
  | 'Medicação'
  | 'Outro';

export interface Vacina {
  id: string;
  nome: string;
  dataAplicacao: string; // YYYY-MM-DD
  proximaDose?: string; // YYYY-MM-DD
  observacoes?: string;
  createdAt?: string;
}

export interface Consulta {
  id: string;
  data: string; // YYYY-MM-DD
  veterinario?: string;
  clinica?: string;
  motivo: string;
  diagnostico?: string;
  tratamento?: string;
  medicamentos?: string;
  observacoes?: string;
  createdAt?: string;
}

export interface Lembrete {
  id: string;
  titulo: string;
  categoria: ReminderCategory;
  data: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  descricao?: string;
  notificacaoAtiva: boolean;
  concluido: boolean;
  createdAt?: string;
}

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed: string;
  sex: Sex;
  birthDate: string; // YYYY-MM-DD
  weight?: number; // in kg
  color?: string;
  microchip?: string;
  photoUrl?: string;
  observacoesMedicas?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PetSummaryStats {
  totalPets: number;
  pendingVaccines: number;
  upcomingConsultas: number;
  activeLembretes: number;
}
