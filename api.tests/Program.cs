using Repere.Api;

// Petit exécutable de tests sans paquet tiers : une erreur termine avec un code non nul.
var count = 0;
void Check(string name, bool condition) { if (!condition) throw new Exception($"ÉCHEC : {name}"); count++; Console.WriteLine($"OK : {name}"); }
var today = new DateOnly(2026, 10, 8);
var valid = new CreateInput("Documenter une procédure", "Description fictive suffisamment détaillée.", "Cellule Delta", "demande", "normale", "2026-10-20");
Check("Formulaire valide", Rules.Validate(valid, today).Count == 0);
Check("Titre trop court", Rules.Validate(valid with { Title = "court" }, today).ContainsKey("title"));
Check("Titre vide après trim", Rules.Validate(valid with { Title = "        " }, today).ContainsKey("title"));
Check("Description absente", Rules.Validate(valid with { Description = null }, today).ContainsKey("description"));
Check("Date passée rejetée", Rules.Validate(valid with { DueDate = "2026-10-07" }, today).ContainsKey("dueDate"));
Check("Date impossible rejetée", Rules.Validate(valid with { DueDate = "2026-02-30" }, today).ContainsKey("dueDate"));
Check("Type inconnu rejeté", Rules.Validate(valid with { Kind = "autre" }, today).ContainsKey("kind"));
Check("Lecteur interdit", Rules.Transitions("nouvelle", "lecteur").Length == 0);
Check("Rédacteur peut démarrer", Rules.Transitions("nouvelle", "redacteur").SequenceEqual(["en_cours"]));
Check("Rédacteur ne clôture pas", Rules.Transitions("a_valider", "redacteur").Length == 0);
Check("Superviseur peut valider", Rules.Transitions("a_valider", "superviseur").Contains("cloturee"));
Check("Clôture terminale", Rules.Transitions("cloturee", "superviseur").Length == 0);
Check("Commentaire requis", !Rules.ValidComment(" court "));
Check("Commentaire maximal", !Rules.ValidComment(new string('a', 501)));
Check("Commentaire valide", Rules.ValidComment("Exercice vérifié."));
Console.WriteLine($"Résultat : {count}/{count} tests C# réussis.");
