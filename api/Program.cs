using Repere.Api;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(builder.Configuration["DemoUrl"] ?? "http://127.0.0.1:5050");
builder.Services.AddSingleton<MemoryStore>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins("http://127.0.0.1:5173", "http://127.0.0.1:4173")
    .WithHeaders("Content-Type", "X-Demo-Role").WithMethods("GET", "POST")));
var app = builder.Build();
app.UseCors();

// L'en-tête est contrôlé par le visiteur : rôle simulé, aucune authentification réelle.
static string Role(HttpRequest request) => request.Headers["X-Demo-Role"].FirstOrDefault() ?? "lecteur";
static IResult Problem(int code, string detail) => Results.Problem(statusCode: code, detail: detail);

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", mode = "demo-memory", authentication = "simulated", sqlServerConnected = false }));
app.MapGet("/api/requests", (MemoryStore store, string? q, string? status, string? kind) =>
{
    if (!string.IsNullOrEmpty(status) && !Rules.Statuses.Contains(status)) return Problem(400, "Statut de filtre invalide.");
    if (!string.IsNullOrEmpty(kind) && kind is not ("demande" or "recommandation")) return Problem(400, "Type de filtre invalide.");
    return Results.Ok(store.List(q, status, kind));
});
app.MapGet("/api/requests/{id:guid}", (Guid id, MemoryStore store) => store.Find(id) is { } item ? Results.Ok(item) : Problem(404, "Dossier introuvable."));
app.MapPost("/api/requests", (CreateInput input, HttpRequest request, MemoryStore store) =>
{
    var role = Role(request);
    if (!Rules.Roles.Contains(role)) return Problem(400, "Rôle simulé inconnu.");
    if (role == "lecteur") return Problem(403, "Le lecteur simulé ne peut pas créer de dossier.");
    var errors = Rules.Validate(input, DateOnly.FromDateTime(DateTime.UtcNow));
    if (errors.Count > 0) return Results.ValidationProblem(errors, detail: "Le formulaire contient des erreurs.");
    var item = store.Create(input, role);
    return Results.Created($"/api/requests/{item.Id}", item);
});
app.MapPost("/api/requests/{id:guid}/transitions", (Guid id, TransitionInput input, HttpRequest request, MemoryStore store) =>
{
    var role = Role(request);
    if (!Rules.Roles.Contains(role)) return Problem(400, "Rôle simulé inconnu.");
    if (role == "lecteur") return Problem(403, "Le lecteur simulé ne peut pas changer le statut.");
    var result = store.Transition(id, input, role);
    return result.Code == 200 ? Results.Ok(result.Item) : Problem(result.Code, result.Detail);
});
app.MapGet("/api/dashboard", (MemoryStore store) =>
{
    var items = store.List(); var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
    return Results.Ok(new { total = items.Count, active = items.Count(i => i.Status != "cloturee"),
        pending = items.Count(i => i.Status == "a_valider"), closed = items.Count(i => i.Status == "cloturee"),
        overdue = items.Count(i => i.Status != "cloturee" && string.CompareOrdinal(i.DueDate, today) < 0) });
});
app.Run();
