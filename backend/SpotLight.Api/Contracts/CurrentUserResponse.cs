namespace SpotLight.Api.Contracts;

// Define exatamente quais informações do token podem voltar para o frontend.
// Não devolvemos o token completo nem metadados internos do provedor.
public sealed record CurrentUserResponse(
    Guid UserId,
    string? Email,
    string Role,
    string? AuthenticationLevel,
    bool IsAnonymous);
