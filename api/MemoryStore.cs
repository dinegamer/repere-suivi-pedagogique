using System.Globalization;
using System.Text;
using System.Text.Json;

namespace Repere.Api;

// Dépôt de démonstration : perdu au redémarrage, aucune connexion SQL Server.
// Les verrous protègent l'opération statut + historique dans ce processus unique.
public sealed class MemoryStore
{
    private readonly object gate = new();
    private readonly List<RequestItem> items;
    private int sequence;
    public MemoryStore()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "seed.json");
        items = JsonSerializer.Deserialize<List<RequestItem>>(File.ReadAllText(path), new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];
        sequence = items.Count;
    }
    private static RequestItem Copy(RequestItem item) => item with { History = [.. item.History] };
    public List<RequestItem> List(string? query = null, string? status = null, string? kind = null)
    {
        lock (gate)
        {
            var q = Normalize(query?.Trim() ?? "");
            return items.Where(i => (string.IsNullOrEmpty(status) || i.Status == status)
                && (string.IsNullOrEmpty(kind) || i.Kind == kind)
                && Normalize($"{i.Title} {i.Reference} {i.Unit}").Contains(q)).Select(Copy).ToList();
        }
    }
    public RequestItem? Find(Guid id) { lock (gate) return items.FirstOrDefault(i => i.Id == id) is { } item ? Copy(item) : null; }
    public RequestItem Create(CreateInput input, string role)
    {
        lock (gate)
        {
            var at = DateTimeOffset.UtcNow;
            var item = new RequestItem(Guid.NewGuid(), $"DEM-{++sequence:D3}", input.Title!.Trim(), input.Description!.Trim(), input.Unit!.Trim(),
                input.Kind!, input.Priority!, "nouvelle", input.DueDate!, at,
                [new("nouvelle", at, Rules.Actor(role), "Création du dossier fictif.")]);
            items.Insert(0, item);
            return Copy(item);
        }
    }
    public (int Code, string Detail, RequestItem? Item) Transition(Guid id, TransitionInput input, string role)
    {
        lock (gate)
        {
            var index = items.FindIndex(i => i.Id == id);
            if (index < 0) return (404, "Dossier introuvable.", null);
            var item = items[index];
            if (input.ExpectedStatus != item.Status) return (409, "Le dossier a changé. Actualiser avant de réessayer.", null);
            if (role == "lecteur" || (item.Status == "a_valider" && role != "superviseur")) return (403, "Le rôle simulé ne permet pas cette transition.", null);
            if (!Rules.Transitions(item.Status, role).Contains(input.Status)) return (409, "Transition de statut interdite.", null);
            if (!Rules.ValidComment(input.Comment)) return (400, "Le commentaire doit contenir 8 à 500 caractères.", null);
            var changed = item with { Status = input.Status!, History = [.. item.History, new(input.Status!, DateTimeOffset.UtcNow, Rules.Actor(role), input.Comment!.Trim())] };
            items[index] = changed;
            return (200, "Statut enregistré.", Copy(changed));
        }
    }
    private static string Normalize(string text) => string.Concat(text.Normalize(NormalizationForm.FormD)
        .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)).ToLowerInvariant();
}
