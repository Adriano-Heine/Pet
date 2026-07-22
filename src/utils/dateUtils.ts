export function calculateAge(birthDateStr: string): string {
  if (!birthDateStr) return 'Idade não informada';
  
  const birthDate = new Date(birthDateStr + 'T00:00:00');
  if (isNaN(birthDate.getTime())) return 'Data inválida';

  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) {
    if (months > 0) {
      return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }

  if (months > 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  if (days >= 0) {
    return `${Math.max(1, days)} ${days === 1 ? 'dia' : 'dias'}`;
  }

  return 'Recém-nascido';
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getDaysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getVacinaStatus(proximaDoseStr?: string): {
  label: string;
  badgeClass: string;
  statusKey: 'ok' | 'warning' | 'overdue' | 'none';
} {
  if (!proximaDoseStr) {
    return { label: 'Sem dose futura', badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', statusKey: 'none' };
  }

  const days = getDaysUntil(proximaDoseStr);
  if (days === null) {
    return { label: 'Sem dose futura', badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', statusKey: 'none' };
  }

  if (days < 0) {
    return { label: `Atrasada (${Math.abs(days)}d)`, badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900', statusKey: 'overdue' };
  }

  if (days <= 30) {
    return { label: `Próxima em ${days}d`, badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900', statusKey: 'warning' };
  }

  return { label: 'Em dia', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900', statusKey: 'ok' };
}

export const COMMON_MEDICAL_TAGS = [
  'Alergia à Dipirona',
  'Alergia à Penicilina',
  'Intolerância Alimentar',
  'Dieta Especial',
  'Uso Contínuo de Medicamentos',
  'Doença Cardíaca',
  'Diabetes',
  'Histórico Cirúrgico',
  'Convulsões',
  'Cuidados Especiais'
];
