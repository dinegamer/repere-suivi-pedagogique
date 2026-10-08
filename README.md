# Repère — suivi pédagogique de demandes et recommandations

**Démonstrateur pédagogique assisté par IA. Données entièrement fictives. Aucune affiliation officielle au BVG Mali.** Aucun logo ou document réel n’est utilisé. Ce travail est un support d’apprentissage ; il ne représente ni une expérience professionnelle antérieure ni une preuve de maîtrise déjà acquise.

- [Démo interactive](https://dinegamer.github.io/repere-suivi-pedagogique/)
- [Code source](https://github.com/dinegamer/repere-suivi-pedagogique)

## Fonctionnalités

Registre de six exemples, recherche sans accents, filtres combinés, formulaire validé, transitions de statut avec commentaire et historique, rôles simulés, tableau de bord et affichage mobile.

## Ce qui est exécuté et ce qui est fourni

| Élément | Situation |
| --- | --- |
| React / TypeScript | Interface compilée et testée ; aperçu public en mode navigateur |
| Stockage de la démo | localStorage sur l’appareil du visiteur, sans envoi à une API |
| C# / ASP.NET Core / .NET 10 | API compilée et testée localement, dépôt en mémoire remis à zéro au redémarrage ; aucune API hébergée |
| SQL Server | Scripts T-SQL fournis, **non exécutés et non raccordés** |
| Rôles | Sélecteur et en-tête X-Demo-Role falsifiables ; **aucune authentification réelle** |

La démo publique ne collecte aucun dossier côté serveur. Utiliser uniquement des exemples inventés. Les rôles, refus et conflits servent à étudier les règles métier ; aucune sécurité de production ni journal inviolable n’est revendiqué. Le mode API local affiche une erreur lorsque le serveur est inaccessible, sans substitution silencieuse par les exemples navigateur.

## Lire l’aperçu compilé

Avec Node, depuis ce dossier :

```powershell
node scripts/serve-preview.mjs
# Ouvrir http://127.0.0.1:4173 ; arrêt avec Ctrl+C.
```

Aucune installation npm n’est nécessaire pour ce serveur de lecture. Ne pas ouvrir index.html avec file://.

## Développer et vérifier

Node 20.17.0 a servi aux contrôles ; préférer une version Node supportée compatible avec les dépendances verrouillées. Les tests navigateur utilisent Chrome installé, sandbox activée et contextes isolés.

```powershell
npm ci
npm run dev
npm run build
npm test
npm run test:e2e
```

La compilation produit preview/ avec chemins relatifs. Les rapports locaux et dépendances installées sont exclus du dépôt.

## API locale en mémoire

Installer un SDK .NET 10 selon les règles de sa machine. Les scripts utilisent DOTNET_EXE si défini, sinon un SDK portable .tools/dotnet/dotnet.exe, sinon dotnet sur le PATH. Aucun SDK ou certificat n’est livré. La génération automatique de certificat ASP.NET et la télémétrie sont désactivées dans le processus des scripts.

```powershell
npm run test:csharp
npm run test:api
npm run test:integration

# Terminal 1, après compilation de l’API :
node scripts/run-api.mjs
# Terminal 2 : variables de ce processus uniquement
$env:VITE_DATA_MODE = 'api'
$env:VITE_API_URL = 'http://127.0.0.1:5050'
npm run dev
```

Les ports 4173, 5173, 5050 et 5051 doivent être disponibles. Pour revenir à la démo autonome, ouvrir un nouveau terminal. L’aperçu public est compilé avec VITE_DATA_MODE=demo.

## Règles et limites

Circuit : nouvelle → en cours → à valider → clôturée. Le superviseur simulé peut aussi renvoyer à en cours. Le lecteur consulte, le rédacteur crée et soumet, le superviseur clôture ou renvoie. Un commentaire de 8 à 500 caractères est requis ; la clôture est terminale. Une modification concurrente de statut entraîne un conflit 409.

Les exemples datent de septembre/octobre 2026 ; les retards varient avec le jour de consultation. La date du navigateur est locale, celle de l’API est UTC : la limite peut différer près de minuit. Le stockage navigateur est modifiable et effaçable ; l’API ne persiste rien après redémarrage. Aucun service SQL, pièce jointe, notification ou authentification réelle n’est implémenté.

## Comprendre et expliquer le code

- [Guide d’apprentissage et épreuve blanche](docs/APPRENTISSAGE.md)
- [Contrat API](docs/API.md)
- [Parcours de démonstration](docs/DEMONSTRATION.md)
- [Vérifications et limites](docs/VERIFICATION.md)
- [Périmètre de publication](docs/PUBLICATION.md)

web/src/domain.ts contient les règles pures ; App.tsx les vues et formulaires ; data.ts le choix explicite de stockage. api/Domain.cs et MemoryStore.cs gèrent les règles et opérations atomiques en mémoire. shared/seed.json est le jeu entièrement fictif partagé. sql/ contient uniquement des scripts à étudier.
