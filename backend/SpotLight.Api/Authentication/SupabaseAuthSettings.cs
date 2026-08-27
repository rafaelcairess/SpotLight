namespace SpotLight.Api.Authentication;

public sealed class SupabaseAuthSettings
{
    public const string SectionName = "SupabaseAuth";
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
}
