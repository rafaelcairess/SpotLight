namespace SpotLight.Api.Contracts;

public sealed record HealthResponse(
    string Service,
    string Status,
    DateTimeOffset Timestamp);
