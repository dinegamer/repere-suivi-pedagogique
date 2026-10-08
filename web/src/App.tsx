import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { createItem, loadItems, mode, transitionItem } from './data';
import { filterItems, labels, overdue, roleLabels, statuses, summarize, today, transitions, validate, type CreateInput, type RequestItem, type Role, type Status } from './domain';

type View = 'dossiers' | 'dashboard' | 'about';
const dateLabel = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
const paths = { list: 'M4 5h16M4 12h16M4 19h16', chart: 'M5 20V10m7 10V4m7 16v-7', info: 'M12 11v6m0-10h.01', search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', plus: 'M12 5v14M5 12h14', check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6', refresh: 'M20 7v5h-5M4 17v-5h5M19 7a8 8 0 0 0-14-2M5 17a8 8 0 0 0 14 2' };
function Icon({ name }: { name: keyof typeof paths }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>; }
function Badge({ status }: { status: Status }) { return <span className={`badge ${status}`}>{labels[status]}</span>; }
function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const dialog = ref.current!; dialog.showModal();
    return () => {
      dialog.close();
      // Après le démontage, rendre le focus au bouton d'origine. Le contrôle
      // dialog.open évite d'interférer avec le remontage de React StrictMode.
      queueMicrotask(() => { if (!dialog.open && opener.current?.isConnected) opener.current.focus(); });
    };
  }, []);
  return <dialog className={wide ? 'modal wide' : 'modal'} ref={ref} onCancel={onClose} aria-labelledby="dialog-title">
    <div className="modal-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="Fermer" onClick={onClose}><Icon name="close" /></button></div>{children}
  </dialog>;
}
function NewForm({ role, onClose, onCreated }: { role: Role; onClose: () => void; onCreated: (item: RequestItem) => Promise<void> }) {
  const [input, setInput] = useState<CreateInput>({ title: '', description: '', unit: '', kind: 'recommandation', priority: 'normale', dueDate: today() });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const change = (key: keyof CreateInput, value: string) => {
    setInput(previous => ({ ...previous, [key]: value }));
    setErrors(previous => { const { [key]: removed, ...remaining } = previous; return remaining; });
    setFailure('');
  };
  async function submit(event: FormEvent) {
    event.preventDefault(); const nextErrors = validate(input); setErrors(nextErrors); setFailure('');
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try { await onCreated(await createItem(input, role)); } catch (error) { setFailure((error as Error).message); }
    finally { setBusy(false); }
  }
  const err = (key: string) => errors[key] ? <span id={`${key}-error`} className="field-error">{errors[key]}</span> : null;
  return <Modal title="Nouveau dossier fictif" onClose={onClose} wide><form onSubmit={submit} noValidate>
    <p className="form-help">Utiliser uniquement des exemples inventés. Tous les champs sont obligatoires.</p>
    <label htmlFor="title">Titre</label><input id="title" autoFocus value={input.title} onChange={e => change('title', e.target.value)} maxLength={120} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} placeholder="Ex. : documenter une procédure fictive" />{err('title')}
    <div className="form-grid"><div><label htmlFor="kind">Type</label><select id="kind" value={input.kind} onChange={e => change('kind', e.target.value)}><option value="recommandation">Recommandation</option><option value="demande">Demande</option></select></div><div><label htmlFor="priority">Priorité</label><select id="priority" value={input.priority} onChange={e => change('priority', e.target.value)}><option value="normale">Normale</option><option value="haute">Haute</option></select></div></div>
    <label htmlFor="unit">Cellule fictive</label><input id="unit" value={input.unit} onChange={e => change('unit', e.target.value)} maxLength={80} aria-invalid={!!errors.unit} aria-describedby={errors.unit ? 'unit-error' : undefined} placeholder="Ex. : Cellule Delta" />{err('unit')}
    <label htmlFor="dueDate">Échéance</label><input id="dueDate" type="date" min={today()} value={input.dueDate} onChange={e => change('dueDate', e.target.value)} aria-invalid={!!errors.dueDate} aria-describedby={errors.dueDate ? 'dueDate-error' : undefined} />{err('dueDate')}
    <label htmlFor="description">Description</label><textarea id="description" rows={4} value={input.description} maxLength={2000} onChange={e => change('description', e.target.value)} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-error' : undefined} placeholder="Décrire le besoin et le résultat attendu de l’exercice." />{err('description')}
    {failure && <p className="error" role="alert">{failure}</p>}
    <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Annuler</button><button className="primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Créer le dossier'}</button></div>
  </form></Modal>;
}
function Detail({ item, role, onClose, onChanged }: { item: RequestItem; role: Role; onClose: () => void; onChanged: (item: RequestItem) => Promise<void> }) {
  const allowed = transitions(item.status, role);
  const [target, setTarget] = useState<Status>(allowed[0] || item.status);
  const [comment, setComment] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setFailure(''); setBusy(true);
    try { await onChanged(await transitionItem(item, target, comment, role)); setComment(''); } catch (error) { setFailure((error as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { setTarget(allowed[0] || item.status); }, [item.status, role]);
  return <Modal title={item.reference} onClose={onClose} wide>
    <div className="detail-top"><span className="eyebrow">{item.kind}</span><Badge status={item.status} /></div><h3 className="detail-title">{item.title}</h3>
    <p className="description">{item.description}</p>
    <dl className="detail-meta"><div><dt>Cellule fictive</dt><dd>{item.unit}</dd></div><div><dt>Échéance</dt><dd className={overdue(item) ? 'late' : ''}>{dateLabel(item.dueDate)}{overdue(item) ? ' · en retard' : ''}</dd></div><div><dt>Priorité</dt><dd>{item.priority === 'haute' ? 'Haute' : 'Normale'}</dd></div><div><dt>Création</dt><dd>{dateLabel(item.createdAt)}</dd></div></dl>
    <h3>Historique des statuts</h3><ol className="timeline">{item.history.map((h, index) => <li key={`${h.at}-${index}`}><div><strong>{labels[h.status]}</strong><time dateTime={h.at}>{dateLabel(h.at)}</time></div><p>{h.comment}</p><span>{h.actor} · rôle simulé</span></li>)}</ol>
    <section className="transition"><h3>Faire avancer le dossier</h3>
      {allowed.length ? <form onSubmit={submit}><label htmlFor="next-status">Nouveau statut</label><select id="next-status" value={target} onChange={e => setTarget(e.target.value as Status)}>{allowed.map(status => <option value={status} key={status}>{labels[status]}</option>)}</select><label htmlFor="comment">Commentaire obligatoire</label><textarea id="comment" rows={3} value={comment} onChange={e => setComment(e.target.value)} maxLength={500} placeholder="8 à 500 caractères pour expliquer le changement." /><p className="form-help">Seul le superviseur simulé peut clôturer ou renvoyer un dossier à valider.</p>{failure && <p className="error" role="alert">{failure}</p>}<button className="primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le statut'}</button></form> : <p className="form-help">{item.status === 'cloturee' ? 'Ce dossier est clôturé. Son historique reste consultable.' : role === 'lecteur' ? 'Le lecteur simulé consulte les dossiers sans les modifier.' : 'Ce dossier attend le superviseur simulé pour sa validation.'}</p>}
    </section>
  </Modal>;
}
function Stats({ items }: { items: RequestItem[] }) {
  const stats = summarize(items);
  return <div className="stats"><article><span>Dossiers actifs</span><strong>{stats.active.toString().padStart(2, '0')}</strong><small>sur {stats.total} dossiers fictifs</small></article><article className="attention"><span>Échéances dépassées</span><strong>{stats.overdue.toString().padStart(2, '0')}</strong><small>hors dossiers clôturés</small></article><article><span>À valider</span><strong>{stats.pending.toString().padStart(2, '0')}</strong><small>par le superviseur simulé</small></article><article><span>Dossiers clôturés</span><strong>{stats.closed.toString().padStart(2, '0')}</strong><small>historique conservé</small></article></div>;
}
export default function App() {
  const [view, setView] = useState<View>('dossiers');
  const [role, setRole] = useState<Role>('redacteur');
  const [items, setItems] = useState<RequestItem[]>([]);
  const [query, setQuery] = useState(''); const [status, setStatus] = useState(''); const [kind, setKind] = useState('');
  const [creating, setCreating] = useState(false); const [selected, setSelected] = useState<RequestItem | null>(null);
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [loading, setLoading] = useState(true);
  async function refresh() { setLoading(true); setError(''); try { setItems(await loadItems()); } catch (err) { setError((err as Error).message); } finally { setLoading(false); } }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 6000); return () => window.clearTimeout(timer); }, [notice]);
  const filtered = filterItems(items, query, status, kind);
  async function changed(item: RequestItem, created = false) {
    setItems(previous => created ? [item, ...previous] : previous.map(i => i.id === item.id ? item : i));
    if (created) { setCreating(false); setQuery(''); setStatus(''); setKind(''); } else setSelected(item);
    setNotice(created ? `${item.reference} créé avec des données fictives.` : `${item.reference} : statut enregistré.`);
  }
  const nav = [{ view: 'dossiers' as const, text: 'Dossiers', icon: 'list' as const }, { view: 'dashboard' as const, text: 'Tableau de bord', icon: 'chart' as const }, { view: 'about' as const, text: 'À propos', icon: 'info' as const }];
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark"><Icon name="check" /></span><span>repère<small>SUIVI PÉDAGOGIQUE</small></span></div><div className="nav-caption">ESPACE D’EXERCICE</div><nav aria-label="Navigation principale">{nav.map(link => <button key={link.view} aria-current={view === link.view ? 'page' : undefined} className={view === link.view ? 'active' : ''} onClick={() => setView(link.view)}><Icon name={link.icon} />{link.text}</button>)}</nav><div className="sidebar-note"><span>PROJET PÉDAGOGIQUE</span><p>Démonstrateur assisté par IA</p><small>Projet pédagogique assisté par IA.<br />Aucune affiliation officielle.</small></div></aside>
    <div className="workspace"><header className="topbar"><span>Demandes & recommandations</span><div className="role-control"><label htmlFor="demo-role">Rôle simulé</label><select id="demo-role" value={role} onChange={e => setRole(e.target.value as Role)}>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div></header>
      <main><div className="demo-banner"><Icon name="info" /><p><strong>Démonstration fictive.</strong> Projet pédagogique assisté par IA, sans affiliation au BVG Mali. Les rôles ne sont pas une authentification.</p></div>
      <div className="page-heading"><div><span className="eyebrow">SUIVI DES ACTIONS</span><h1>{view === 'dossiers' ? 'Les dossiers' : view === 'dashboard' ? 'Tableau de bord' : 'Comprendre ce projet'}</h1><p>{view === 'dossiers' ? 'Retrouver une demande, suivre son statut et garder une trace.' : view === 'dashboard' ? 'Une vue d’ensemble des données fictives de cet exercice.' : 'Un support d’apprentissage et de démonstration honnête.'}</p></div>{view === 'dossiers' && <button className="primary" disabled={role === 'lecteur' || loading || !!error} onClick={() => setCreating(true)}><Icon name="plus" />Nouveau dossier</button>}</div>
      <div className="mode-line"><span>{mode === 'demo' ? 'Mode navigateur · données conservées sur cet appareil' : 'Mode API C# · mémoire temporaire du serveur'}</span><button className="text-button" onClick={() => void refresh()} disabled={loading}><Icon name="refresh" />Actualiser</button></div>
      {error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}
      {loading ? <p className="empty" role="status">Chargement des dossiers…</p> : !error && <>
      {view !== 'about' && <Stats items={items} />}
      {view === 'dossiers' && <section className="records"><div className="section-heading"><h2>Registre des dossiers <span>{filtered.length}</span></h2><span className="muted">Tous les exemples sont inventés</span></div><div className="filters"><div className="search"><Icon name="search" /><label className="sr-only" htmlFor="search">Rechercher un dossier</label><input id="search" placeholder="Titre, référence ou cellule…" value={query} onChange={e => setQuery(e.target.value)} /></div><div><label className="sr-only" htmlFor="status-filter">Filtrer par statut</label><select id="status-filter" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tous les statuts</option>{statuses.map(s => <option value={s} key={s}>{labels[s]}</option>)}</select></div><div><label className="sr-only" htmlFor="kind-filter">Filtrer par type</label><select id="kind-filter" value={kind} onChange={e => setKind(e.target.value)}><option value="">Tous les types</option><option value="demande">Demandes</option><option value="recommandation">Recommandations</option></select></div>{(query || status || kind) && <button className="text-button" onClick={() => { setQuery(''); setStatus(''); setKind(''); }}>Effacer les filtres</button>}</div>
      {filtered.length ? <div className="table-wrap"><table><caption className="sr-only">Dossiers fictifs filtrés</caption><thead><tr><th scope="col">Dossier</th><th scope="col">Cellule fictive</th><th scope="col">Statut</th><th scope="col">Échéance</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><div className="row-meta"><span>{item.reference}</span><span>{item.kind}</span>{item.priority === 'haute' && <span className="priority">Priorité haute</span>}</div><button className="record-title" onClick={() => setSelected(item)}>{item.title}</button></td><td>{item.unit}</td><td><Badge status={item.status} /></td><td><span className={overdue(item) ? 'late' : ''}>{dateLabel(item.dueDate)}</span>{overdue(item) && <small className="late overdue-label">En retard</small>}</td></tr>)}</tbody></table></div> : <div className="empty"><h3>Aucun dossier trouvé</h3><p>Modifier la recherche ou effacer les filtres.</p></div>}
      <div className="table-footer"><span>{filtered.length} dossier{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}</span><span>{role === 'lecteur' ? 'Consultation uniquement · rôle simulé' : 'Création et suivi · rôle simulé'}</span></div></section>}
      {view === 'dashboard' && <div className="dashboard-grid"><section className="panel"><h2>Répartition par statut</h2><p className="muted">Les compteurs portent sur l’ensemble du registre.</p><div className="bars">{statuses.map(s => { const count = items.filter(i => i.status === s).length; return <div className="bar-row" key={s}><span>{labels[s]}</span><div className="bar-track"><div style={{ width: `${items.length ? count / items.length * 100 : 0}%` }} /></div><strong>{count}</strong></div>; })}</div></section><section className="panel"><h2>Échéances à surveiller</h2><p className="muted">Dossiers actifs dont l’échéance est passée.</p>{items.filter(i => overdue(i)).map(i => <button key={i.id} className="dashboard-item" onClick={() => setSelected(i)}><span><small>{i.reference} · {i.unit}</small>{i.title}</span><span className="late">{dateLabel(i.dueDate)}</span></button>)}{!items.some(i => overdue(i)) && <p>Aucune échéance dépassée.</p>}</section></div>}
      {view === 'about' && <section className="panel about"><h2>Un exercice pour apprendre</h2><p>Ce projet a été préparé avec l’assistance d’une IA comme support indépendant d’apprentissage. Il ne constitue ni une expérience professionnelle antérieure, ni une preuve de maîtrise déjà acquise.</p><p>Le scénario de suivi utilise des cellules, demandes, recommandations et historiques entièrement fictifs. Aucun logo, document privé ou lien officiel avec le BVG Mali n’est utilisé.</p><h3>Le parcours à expliquer</h3><ol><li>Créer un dossier : validation du formulaire côté React et, en mode API, côté C#.</li><li>Faire avancer le dossier : nouvelle → en cours → à valider → clôturée.</li><li>Conserver un commentaire et le rôle simulé à chaque changement.</li><li>Lire les compteurs et filtrer les dossiers sans modifier les données.</li></ol><h3>Deux modes clairement distincts</h3><p>Le mode navigateur fonctionne sans serveur et conserve les modifications dans le stockage local. Le mode API utilise ASP.NET Core avec un dépôt en mémoire, remis à zéro au redémarrage. Les scripts SQL Server sont fournis séparément, non exécutés et non raccordés à cette API.</p><h3>Les limites à connaître</h3><p>Le sélecteur de rôle et l’en-tête X-Demo-Role sont falsifiables. Il n’y a pas de connexion utilisateur, de sécurité de production ou de journal inviolable. La clôture exige le superviseur simulé ; un lecteur ne peut pas écrire.</p><p className="learning-note">Avant présentation : lire le guide d’apprentissage, refaire un formulaire et une route API, puis expliquer les tests avec ses propres mots.</p></section>}
      </>}
      <footer className="page-footer">Repère · exercice de développement · React / TypeScript / ASP.NET Core · données fictives</footer></main>
    </div>{creating && <NewForm role={role} onClose={() => setCreating(false)} onCreated={item => changed(item, true)} />}{selected && <Detail key={selected.id} item={selected} role={role} onClose={() => setSelected(null)} onChanged={item => changed(item)} />}
  </div>;
}
