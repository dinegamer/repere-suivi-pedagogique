using System.Globalization;

namespace Repere.Api;

public record HistoryEvent(string Status, DateTimeOffset At, string Actor, string Comment);
public record RequestItem(Guid Id, string Reference, string Title, string Description, string Unit,
    string Kind, string Priority, string Status, string DueDate, DateTimeOffset CreatedAt, List<HistoryEvent> History);
public record CreateInput(string? Title, string? Description, string? Unit, string? Kind, string? Priority, string? DueDate);
public record TransitionInput(string? Status, string? ExpectedStatus, string? Comment);

public static class Rules
{
    public static readonly string[] Statuses = ["nouvelle", "en_cours", "a_valider", "cloturee"];
    public static readonly string[] Roles = ["lecteur", "redacteur", "superviseur"];
    public static string Actor(string role) => role == "superviseur" ? "Superviseur démo" : "Rédacteur démo";
    public static string[] Transitions(string status, string role)
    {
        if (role == "lecteur" || !Roles.Contains(role)) return [];
        return status switch
        {
            "nouvelle" => ["en_cours"],
            "en_cours" => ["a_valider"],
            "a_valider" when role == "superviseur" => ["en_cours", "cloturee"],
            _ => []
        };
    }
    public static Dictionary<string, string[]> Validate(CreateInput input, DateOnly today)
    {
        Dictionary<string, string[]> errors = [];
        CheckText("title", input.Title, 8, 120, errors);
        CheckText("description", input.Description, 20, 2000, errors);
        CheckText("unit", input.Unit, 3, 80, errors);
        if (input.Kind is not ("demande" or "recommandation")) errors["kind"] = ["Choisir un type valide."];
        if (input.Priority is not ("normale" or "haute")) errors["priority"] = ["Choisir une priorité valide."];
        if (!DateOnly.TryParseExact(input.DueDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var due)
            || due < today) errors["dueDate"] = ["Choisir une date valide, aujourd’hui ou après."];
        return errors;
    }
    public static bool ValidComment(string? comment) => comment?.Trim().Length is >= 8 and <= 500;
    private static void CheckText(string name, string? value, int min, int max, Dictionary<string, string[]> errors)
    {
        var length = value?.Trim().Length ?? 0;
        if (length < min || length > max) errors[name] = [$"Le champ doit contenir {min} à {max} caractères."];
    }
}
