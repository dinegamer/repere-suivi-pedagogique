# Vérification de la copie publique — 8 octobre 2026

Contrôles réellement exécutés sur cette copie anonymisée, avec données entièrement fictives. **64 tests distincts réussis.** Ce nombre ne prouve ni une maîtrise déjà acquise ni une sécurité de production.

| Contrôle | Résultat |
| --- | --- |
| Compilation TypeScript et Vite, mode navigateur | Réussite |
| Tests TypeScript | 24/24, aucun échec |
| Compilation ASP.NET Core et tests métier C# | Compilation réussie ; 15/15 |
| Tests HTTP de la vraie API locale | 16/16, aucun échec ou test ignoré |
| Tests navigateur Chrome, contextes isolés | 7/7 |
| Intégration React → API C# locale | 2/2, dont absence de substitution en cas d’erreur API |
| Audit npm | Aucune vulnérabilité connue signalée au moment du contrôle |
| SQL Server | Scripts fournis, non exécutés et non raccordés |

Environnement des contrôles : Node 20.17.0, .NET SDK 10.0.401, ASP.NET Core 10.0.12 et Chrome 154.0.8037.98 avec sandbox activée. Les outils, dépendances installées, rapports JSON et traces brutes restent locaux et sont exclus du dépôt.

Couverture : validations, dates, recherche sans accents, filtres combinés, compteurs, refus selon les rôles simulés, transitions et commentaires, conflit 409, historique inchangé lors d’un refus, persistance locale après rechargement, clavier et retour du focus, mobile à 390 px et vraie liaison React/C#.

## Captures de cette copie

Captures renouvelées par les tests puis relues visuellement sur cette interface anonymisée, avec uniquement les exemples inventés de l’exercice :

- [Registre](captures/01-registre-desktop.png)
- [Formulaire](captures/02-formulaire.png)
- [Historique](captures/03-historique.png)
- [Tableau de bord](captures/04-tableau-de-bord.png)
- [Mobile](captures/05-registre-mobile.png)
- [API C# locale en mémoire](captures/06-api-csharp.png)

## Limites

Aucune authentification réelle, persistance serveur, connexion SQL, sécurité de production, charge importante ou audit complet d’accessibilité. Les rôles et leur en-tête HTTP sont manipulables. L’API C# est locale en mémoire et perd les changements au redémarrage. L’aperçu public utilise uniquement le navigateur.

L’exercice est pédagogique et assisté par IA, sans affiliation officielle au BVG Mali. Il ne constitue pas une expérience professionnelle antérieure.