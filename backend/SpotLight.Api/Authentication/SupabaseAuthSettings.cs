namespace SpotLight.Api.Authentication;

// Representa a seção "SupabaseAuth" do appsettings.json.
// A classe contém somente informações públicas usadas para validar tokens.
public sealed class SupabaseAuthSettings
{
    // Evita repetir uma string solta ao procurar a seção de configuração.
    public const string SectionName = "SupabaseAuth";

    // Endereço exato que aparece na claim "iss" dos tokens do projeto.
    public string Issuer { get; init; } = string.Empty;

    // Destinatário esperado na claim "aud"; usuários comuns usam "authenticated".
    public string Audience { get; init; } = string.Empty;
}
