export const statuses = ['nouvelle', 'en_cours', 'a_valider', 'cloturee'] as const;
export type Status = typeof statuses[number];
export type Role = 'lecteur' | 'redacteur' | 'superviseur';
export type Kind = 'demande' | 'recommandation';
export const labels: Record<Status, string> = { nouvelle: 'Nouvelle', en_cours: 'En cours', a_valider: 'À valider', cloturee: 'Clôturée' };
export const roleLabels: Record<Role, string> = { lecteur: 'Lecteur', redacteur: 'Rédacteur', superviseur: 'Superviseur' };
export interface HistoryEvent { status: Status; at: string; actor: string; comment: string }
export interface RequestItem {
  id: string; reference: string; title: string; description: string; unit: string;
  kind: Kind; priority: 'normale' | 'haute'; status: Status; dueDate: string;
  createdAt: string; history: HistoryEvent[];
}
export type CreateInput = Pick<RequestItem, 'title' | 'description' | 'unit' | 'kind' | 'priority' | 'dueDate'>;
export const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export function transitions(status: Status, role: Role): Status[] {
  if (role === 'lecteur') return [];
  if (status === 'nouvelle') return ['en_cours'];
  if (status === 'en_cours') return ['a_valider'];
  if (status === 'a_valider' && role === 'superviseur') return ['en_cours', 'cloturee'];
  return [];
}
export function validate(input: CreateInput, date = today()): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, min, max, name] of [['title', 8, 120, 'Le titre'], ['description', 20, 2000, 'La description'], ['unit', 3, 80, 'La cellule']] as const) {
    const value = input[key].trim();
    if (value.length < min || value.length > max) errors[key] = `${name} doit contenir ${min} à ${max} caractères.`;
  }
  if (!['demande', 'recommandation'].includes(input.kind)) errors.kind = 'Choisir un type valide.';
  if (!['normale', 'haute'].includes(input.priority)) errors.priority = 'Choisir une priorité valide.';
  const parsed = new Date(input.dueDate + 'T00:00:00Z');
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === input.dueDate;
  if (!validDate || input.dueDate < date) errors.dueDate = 'Choisir une date valide, aujourd’hui ou après.';
  return errors;
}
export const overdue = (item: RequestItem, date = today()) => item.status !== 'cloturee' && item.dueDate < date;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function filterItems(items: RequestItem[], query: string, status = '', kind = '') {
  const q = normalize(query.trim());
  return items.filter(item => (!status || item.status === status) && (!kind || item.kind === kind) && normalize(`${item.title} ${item.reference} ${item.unit}`).includes(q));
}
export function summarize(items: RequestItem[], date = today()) {
  return { total: items.length, active: items.filter(i => i.status !== 'cloturee').length,
    overdue: items.filter(i => overdue(i, date)).length, pending: items.filter(i => i.status === 'a_valider').length,
    closed: items.filter(i => i.status === 'cloturee').length };
}
