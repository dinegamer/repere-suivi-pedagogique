import { describe, expect, it } from 'vitest';
import seed from '../../shared/seed.json';
import { filterItems, overdue, statuses, summarize, transitions, validate, type CreateInput, type RequestItem } from './domain';

const items = seed as RequestItem[];
const date = '2026-10-08';
const valid: CreateInput = { title: 'Documenter une procédure', description: 'Une description fictive suffisamment détaillée.', unit: 'Cellule Delta', kind: 'demande', priority: 'normale', dueDate: '2026-10-20' };
describe('validation', () => {
  it('accepte un dossier valide', () => expect(validate(valid, date)).toEqual({}));
  it('refuse les espaces comme titre', () => expect(validate({ ...valid, title: '        ' }, date)).toHaveProperty('title'));
  it('refuse un titre trop long', () => expect(validate({ ...valid, title: 'a'.repeat(121) }, date)).toHaveProperty('title'));
  it('refuse une description courte', () => expect(validate({ ...valid, description: 'courte' }, date)).toHaveProperty('description'));
  it('refuse une cellule courte', () => expect(validate({ ...valid, unit: 'ab' }, date)).toHaveProperty('unit'));
  it('refuse une date impossible', () => expect(validate({ ...valid, dueDate: '2026-02-30' }, date)).toHaveProperty('dueDate'));
  it('refuse une date passée', () => expect(validate({ ...valid, dueDate: '2026-10-07' }, date)).toHaveProperty('dueDate'));
  it('accepte la date du jour', () => expect(validate({ ...valid, dueDate: date }, date)).toEqual({}));
  it('refuse un format de date incorrect', () => expect(validate({ ...valid, dueDate: '20/10/2026' }, date)).toHaveProperty('dueDate'));
  it('refuse un type inconnu reçu à l’exécution', () => expect(validate({ ...valid, kind: 'autre' } as unknown as CreateInput, date)).toHaveProperty('kind'));
});
describe('transitions et rôles simulés', () => {
  it('interdit toute écriture au lecteur', () => statuses.forEach(s => expect(transitions(s, 'lecteur')).toEqual([])));
  it('permet de démarrer au rédacteur', () => expect(transitions('nouvelle', 'redacteur')).toEqual(['en_cours']));
  it('permet de soumettre au rédacteur', () => expect(transitions('en_cours', 'redacteur')).toEqual(['a_valider']));
  it('réserve la validation au superviseur', () => expect(transitions('a_valider', 'redacteur')).toEqual([]));
  it('permet au superviseur de renvoyer ou clôturer', () => expect(transitions('a_valider', 'superviseur')).toEqual(['en_cours', 'cloturee']));
  it('conserve la clôture comme état terminal', () => expect(transitions('cloturee', 'superviseur')).toEqual([]));
});
describe('recherche, filtres et indicateurs', () => {
  it('recherche sans accents ni casse', () => expect(filterItems(items, 'EQUIPEMENTS')).toHaveLength(1));
  it('recherche par référence', () => expect(filterItems(items, 'dem-002')[0].id).toBe(items[1].id));
  it('combine recherche, statut et type', () => expect(filterItems(items, 'beta', 'nouvelle', 'demande')).toHaveLength(1));
  it('produit une liste vide sans correspondance', () => expect(filterItems(items, 'inexistant')).toEqual([]));
  it('ignore les clôtures dans les retards', () => expect(overdue(items[3], date)).toBe(false));
  it('ne considère pas le jour de l’échéance comme un retard', () => expect(overdue({ ...items[0], dueDate: date }, date)).toBe(false));
  it('calcule les indicateurs du jeu fictif', () => expect(summarize(items, date)).toEqual({ total: 6, active: 5, overdue: 1, pending: 1, closed: 1 }));
  it('gère un registre vide', () => expect(summarize([], date)).toEqual({ total: 0, active: 0, overdue: 0, pending: 0, closed: 0 }));
});
