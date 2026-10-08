-- Deux exemples entièrement fictifs. Base d'exercice uniquement, après 001-schema.sql.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
INSERT dbo.DemoRequest (Id, Reference, Title, Description, Unit, Kind, Priority, Status, DueDate, CreatedAt)
VALUES
('00000000-0000-0000-0000-000000000001', N'DEM-001', N'Clarifier le circuit de validation', N'Documenter les étapes de validation de la cellule fictive.', N'Cellule Alpha', 'recommandation', 'haute', 'en_cours', '2026-10-06', '2026-09-15T09:00:00+00:00'),
('00000000-0000-0000-0000-000000000002', N'DEM-002', N'Centraliser les pièces de suivi', N'Créer une liste des pièces attendues pour les dossiers fictifs.', N'Cellule Bêta', 'demande', 'normale', 'nouvelle', '2026-10-20', '2026-09-20T08:30:00+00:00');
INSERT dbo.DemoHistory (RequestId, Status, At, Actor, Comment)
VALUES
('00000000-0000-0000-0000-000000000001', 'nouvelle', '2026-09-15T09:00:00+00:00', N'Rédacteur démo', N'Création de la recommandation fictive.'),
('00000000-0000-0000-0000-000000000001', 'en_cours', '2026-09-18T10:00:00+00:00', N'Rédacteur démo', N'Le circuit de validation est en rédaction.'),
('00000000-0000-0000-0000-000000000002', 'nouvelle', '2026-09-20T08:30:00+00:00', N'Rédacteur démo', N'Création de la demande fictive.');
COMMIT TRANSACTION;
