-- Exemples de lecture : aucune mutation.
SELECT Status, COUNT(*) AS Total FROM dbo.DemoRequest GROUP BY Status;
SELECT Reference, Title, DueDate FROM dbo.DemoRequest
WHERE Status <> 'cloturee' AND DueDate < CAST(SYSUTCDATETIME() AS DATE)
ORDER BY DueDate;
SELECT r.Reference, h.Status, h.At, h.Actor, h.Comment
FROM dbo.DemoRequest AS r INNER JOIN dbo.DemoHistory AS h ON h.RequestId = r.Id
ORDER BY r.Reference, h.At, h.Id;

-- Exercice à réaliser : un dépôt SQL avec requêtes paramétrées.
-- Changer statut ET insérer l'historique dans la même transaction.
-- Vérifier la version ROWVERSION pour refuser une mise à jour concurrente.
-- Les CHECK n'imposent pas le circuit des transitions ; l'API doit l'imposer.
