import seed from '../../shared/seed.json';
import { labels, roleLabels, statuses, transitions, validate, type CreateInput, type RequestItem, type Role, type Status } from './domain';

export const mode = import.meta.env.VITE_DATA_MODE === 'api' ? 'api' : 'demo';
const apiBase = import.meta.env.VITE_API_URL || '';
const storageKey = 'repere-pedagogique-v1';
export const initialItems = () => structuredClone(seed) as RequestItem[];
function readLocal(): RequestItem[] {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return initialItems();
  try {
    const items: RequestItem[] = JSON.parse(stored);
    if (!Array.isArray(items) || !items.every(i => i && ['id', 'reference', 'title', 'description', 'unit', 'dueDate', 'createdAt'].every(k => typeof i[k as keyof RequestItem] === 'string') && statuses.includes(i.status) && ['demande', 'recommandation'].includes(i.kind) && ['normale', 'haute'].includes(i.priority) && Array.isArray(i.history) && i.history.every(h => h && statuses.includes(h.status) && ['at', 'actor', 'comment'].every(k => typeof h[k as keyof typeof h] === 'string')))) throw new Error();
    return items;
  } catch { throw new Error('Les données locales sont illisibles. Effacer uniquement la clé repere-pedagogique-v1 du stockage du navigateur pour reprendre les exemples.'); }
}
async function request<T>(path: string, role: Role, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBase}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Demo-Role': role },
    body: body ? JSON.stringify(body) : undefined
  }).catch(() => { throw new Error('API C# inaccessible. Démarrer le serveur sur le port 5050. Aucun basculement automatique vers le mode navigateur.'); });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    throw new Error(problem.detail || 'La requête a échoué. Vérifier les champs et le rôle simulé.');
  }
  return response.json() as Promise<T>;
}
export const loadItems = () => mode === 'api' ? request<RequestItem[]>('/requests', 'lecteur') : Promise.resolve().then(readLocal);
export async function createItem(input: CreateInput, role: Role) {
  if (role === 'lecteur') throw new Error('Le lecteur simulé ne peut pas créer de dossier.');
  if (Object.keys(validate(input)).length) throw new Error('Le formulaire contient des erreurs.');
  if (mode === 'api') return request<RequestItem>('/requests', role, input);
  const items = readLocal();
  const number = Math.max(0, ...items.map(i => Number(i.reference.slice(4)) || 0)) + 1;
  const at = new Date().toISOString();
  const item: RequestItem = { ...input, title: input.title.trim(), description: input.description.trim(), unit: input.unit.trim(), id: crypto.randomUUID(),
    reference: `DEM-${String(number).padStart(3, '0')}`, createdAt: at, status: 'nouvelle',
    history: [{ status: 'nouvelle', at, actor: `${roleLabels[role]} démo`, comment: 'Création du dossier fictif.' }] };
  localStorage.setItem(storageKey, JSON.stringify([item, ...items]));
  return item;
}
export async function transitionItem(item: RequestItem, status: Status, comment: string, role: Role) {
  if (!transitions(item.status, role).includes(status)) throw new Error('Cette transition est interdite pour le rôle simulé.');
  if (comment.trim().length < 8 || comment.trim().length > 500) throw new Error('Le commentaire doit contenir 8 à 500 caractères.');
  if (mode === 'api') return request<RequestItem>(`/requests/${item.id}/transitions`, role, { status, expectedStatus: item.status, comment });
  const items = readLocal();
  const current = items.find(i => i.id === item.id);
  if (!current || current.status !== item.status) throw new Error('Le dossier a changé. Actualiser la liste avant de réessayer.');
  const updated: RequestItem = { ...current, status, history: [...current.history, { status, at: new Date().toISOString(), actor: `${roleLabels[role]} démo`, comment: comment.trim() }] };
  localStorage.setItem(storageKey, JSON.stringify(items.map(i => i.id === item.id ? updated : i)));
  return updated;
}
