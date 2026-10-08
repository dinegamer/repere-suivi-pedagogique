# Comprendre et refaire le projet

Objectif : être capable de justifier le code, de le modifier et de refaire une petite fonctionnalité pendant une épreuve pratique. Le code assisté par IA est un support de travail. Lire du code ou faire une démonstration ne signifie pas encore savoir le reconstruire seul.

## Sept séances de travail

| Séance | À lire / manipuler | Résultat à produire sans copier |
| --- | --- | --- |
| 1 · 45–60 min | README, lancer l’aperçu, `shared/seed.json` | Expliquer les champs d’un dossier et le caractère fictif des données |
| 2 · 60–90 min | `domain.ts`, types `Status`, `Role`, `CreateInput` | Écrire une fonction de filtre par statut et trois tests |
| 3 · 60–90 min | `App.tsx`, `NewForm`, `useState`, événements | Refaire un formulaire titre + description avec erreurs visibles |
| 4 · 60–90 min | `data.ts`, `fetch`, `localStorage`, modes | Expliquer une requête HTTP et provoquer l’erreur API inaccessible |
| 5 · 90 min | `api/Program.cs`, `Domain.cs`, `MemoryStore.cs` | Ajouter une route GET de lecture et sa réponse 404 |
| 6 · 60–90 min | `sql/001-schema.sql`, jointure et index | Dessiner les deux tables et écrire une jointure avec les historiques |
| 7 · 90 min | Tests et répétition de la démonstration | Modifier une règle, corriger les tests utiles et expliquer l’effet |

Ne cocher une séance qu’après reproduction autonome du résultat. Si C# ou SQL Server est nouveau, prévoir davantage de temps et dire clairement ce qui reste à apprendre.

## Le trajet d’une création

1. React garde les valeurs dans `input`, un état local de `NewForm`. `onChange` remplace une propriété sans modifier l’ancien objet.
2. `onSubmit` empêche le rechargement de la page. `validate` renvoie un objet d’erreurs par nom de champ. `aria-invalid` et le texte d’erreur les rendent perceptibles.
3. `createItem` revalide et refuse le lecteur simulé. En mode navigateur, il ajoute un dossier et sérialise la liste sous une clé dédiée de `localStorage`.
4. En mode API, `fetch` transmet un JSON et `X-Demo-Role`. ASP.NET lie le JSON à `CreateInput`, vérifie le rôle puis appelle `Rules.Validate`. Le contrôle serveur reste nécessaire même si le formulaire est validé.
5. `MemoryStore.Create` attribue un GUID, une référence et une première entrée d’historique. `201 Created` indique la création ; `Location` désigne le dossier.
6. React reçoit le dossier et remplace sa liste d’état. Le tableau de bord est recalculé depuis cette liste. Aucun compteur parallèle n’est maintenu.

Point à expliquer : TypeScript vérifie les types lors de la compilation ; il ne valide pas automatiquement un JSON reçu au moment de l’exécution. Ici, le stockage local est contrôlé sommairement, et les entrées d’API sont vérifiées par C#.

## Le trajet d’un changement de statut

`transitions` décrit les choix permis à l’interface. La même règle existe en C# dans `Rules.Transitions`. Leur duplication est volontaire dans ce petit exercice : chaque environnement doit refuser ses entrées invalides. Les tests doivent éviter que les deux versions divergent.

La requête contient le statut souhaité, `expectedStatus` et un commentaire. Le dépôt compare le statut attendu avec le statut réel. Si une autre modification a déjà eu lieu, il renvoie `409 Conflict`. Un verrou protège l’ensemble « vérifier, changer le statut, ajouter l’historique ». Sans ce regroupement, le statut pourrait changer sans trace correspondante.

Le lecteur est refusé avec `403`. Le rédacteur ne peut pas clôturer un dossier à valider. Le superviseur simulé peut renvoyer à « en cours » ou clôturer. Une clôture ne permet plus de transition. L’historique contient des rôles simulés et reste modifiable dans le code ou le stockage : il n’est pas inviolable.

## Pourquoi SQL Server est séparé

Le script définit `DemoRequest` et `DemoHistory`. `RequestId` est une clé étrangère vers le dossier ; plusieurs entrées d’historique peuvent appartenir au même dossier. `CHECK` limite les valeurs des statuts ; il ne décrit pas à lui seul les transitions autorisées. L’index `(Status, DueDate)` aide les lectures par statut et échéance. `ROWVERSION` est un jeton de concurrence, pas une date.

Un futur dépôt SQL devrait remplacer `MemoryStore` par des commandes paramétrées. La mise à jour de statut et l’insertion d’historique doivent être dans la même transaction. Il faut traiter une modification concurrente et tester rollback, contraintes et persistance. Cette intégration n’est pas réalisée ni revendiquée dans le livrable actuel.

## Questions à savoir traiter

- Pourquoi valider côté serveur ? Un visiteur peut envoyer un JSON directement sans passer par React.
- Pourquoi le rôle n’est-il pas une sécurité ? Le visiteur contrôle le sélecteur et l’en-tête HTTP.
- Qu’arrive-t-il au redémarrage de C# ? Le dépôt en mémoire reprend les exemples initiaux.
- Qu’arrive-t-il au rechargement du navigateur autonome ? Les modifications restent sur cet appareil, sous la clé `repere-pedagogique-v1`.
- Pourquoi comparer une date `yyyy-MM-dd` ? Les dates ISO valides sans heure se trient lexicalement dans l’ordre chronologique. Une date doit d’abord être validée.
- Pourquoi les tests des compteurs fixent-ils la date ? Pour rester déterministes lorsque le jour réel change.
- Pourquoi `409` et `403` sont-ils différents ? `409` signale un conflit d’état ; `403` un refus lié au rôle simulé.
- Quels tests n’ont pas été faits ? L’exécution SQL Server et une architecture de sécurité de production.

## Épreuve blanche de 90 minutes

1. 10 min : lancer le projet et expliquer la structure sans IA.
2. 20 min : ajouter un filtre de priorité dans `domain.ts` et un test qui combine ce filtre avec le statut.
3. 20 min : intégrer le filtre dans React avec un libellé accessible et un état vide.
4. 20 min : ajouter à l’API un filtre de priorité, valider ses valeurs et tester `400` puis une réponse valide.
5. 10 min : écrire la requête SQL équivalente, avec un paramètre plutôt qu’une concaténation.
6. 10 min : expliquer les choix, les limites et les erreurs rencontrées.

Variantes à pratiquer : renvoyer un dossier à valider vers « en cours » ; ajouter un compteur par type ; montrer qu’un commentaire invalide n’allonge pas l’historique. Garder la correction personnelle dans une copie d’exercice, sans prétendre que les extensions sont déjà réalisées ici.

## Présentation personnelle honnête

Après appropriation, adapter cette phrase à la réalité : « J’ai étudié un projet pédagogique assisté par IA pour pratiquer React, TypeScript et ASP.NET Core. Je peux expliquer la validation, les transitions et les tests. L’API utilise la mémoire ; le schéma SQL Server fourni reste à raccorder. »

Remplacer « je peux expliquer » par les éléments effectivement maîtrisés. Ne pas présenter ce travail comme une réalisation interne du BVG Mali ou comme un projet professionnel passé.
