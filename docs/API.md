# Contrat de l’API C# locale

Base : `http://127.0.0.1:5050/api`. JSON en camelCase. Pas de connexion SQL Server. Pas de connexion utilisateur ; `X-Demo-Role` simule un rôle. S’il manque, le serveur utilise `lecteur`. Valeurs : `lecteur`, `redacteur`, `superviseur`. Un rôle inconnu est rejeté à l’écriture avec `400`.

| Méthode | Route | Résultat |
| --- | --- | --- |
| GET | `/health` | Mode mémoire, identité simulée et SQL non connecté |
| GET | `/requests?q=&status=&kind=` | Liste, recherche sans accents ; filtres combinés ; `400` pour filtres inconnus |
| GET | `/requests/{guid}` | Détail avec historique, ou `404` |
| POST | `/requests` | Création `201` + `Location`, ou validation `400`, refus `403` |
| POST | `/requests/{guid}/transitions` | Dossier modifié `200`, validation `400`, refus `403`, absence `404`, conflit `409` |
| GET | `/dashboard` | Total, actifs, à valider, clôturés, retards actifs |

## Créer un dossier

```json
{
  "title": "Documenter une procédure fictive",
  "description": "Décrire les étapes d’une procédure entièrement inventée.",
  "unit": "Cellule Delta",
  "kind": "demande",
  "priority": "normale",
  "dueDate": "2099-10-20"
}
```

Titre : 8–120 caractères ; description : 20–2000 ; cellule : 3–80. Les longueurs sont calculées après suppression des espaces aux extrémités. Date : ISO réelle, aujourd’hui ou après selon UTC. Type : `demande` ou `recommandation` ; priorité : `normale` ou `haute`. Le serveur choisit le GUID, la référence, le statut initial et l’historique ; ces champs ne sont pas confiés au formulaire.

## Changer le statut

```json
{
  "status": "en_cours",
  "expectedStatus": "nouvelle",
  "comment": "Le traitement du dossier fictif a démarré."
}
```

Le commentaire doit contenir 8–500 caractères après trim. `expectedStatus` doit correspondre au statut actuel. Une réponse `409` laisse le dossier et son historique inchangés ; le client doit actualiser. Une validation défectueuse ne crée pas d’historique.

## Tester à la main sans secret

```powershell
$headers = @{ 'X-Demo-Role' = 'redacteur' }
$payload = @{ title = 'Documenter une procédure fictive'; description = 'Décrire une procédure inventée pour apprendre les routes HTTP.'; unit = 'Cellule Delta'; kind = 'demande'; priority = 'normale'; dueDate = '2099-10-20' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5050/api/requests' -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $payload
```

Changer l’en-tête en `lecteur` permet de constater le refus `403`. Ce test illustre aussi pourquoi un en-tête librement contrôlé ne constitue pas une authentification.
