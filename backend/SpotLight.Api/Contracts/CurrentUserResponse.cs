namespace SpotLight.Api.Contracts;

public sealed record CurrentUserResponse(
    Guid UserId,
    string? Email,
    string Role,
    string? AuthenticationLevel,
    bool IsAnonymous);
