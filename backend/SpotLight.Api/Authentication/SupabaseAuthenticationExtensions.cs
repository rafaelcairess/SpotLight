using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace SpotLight.Api.Authentication;

// Extension methods deixam o Program.cs curto e dão um nome claro a uma configuração grande.
public static class SupabaseAuthenticationExtensions
{
    // Controllers usam esta constante para exigir um usuário real do Supabase.
    public const string AuthenticatedUserPolicy = "SupabaseAuthenticatedUser";

    // "this IServiceCollection" permite chamar builder.Services.AddSupabaseAuthentication(...).
    public static IServiceCollection AddSupabaseAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Liga a seção do JSON à classe tipada e valida a configuração ao iniciar.
        services
            .AddOptions<SupabaseAuthSettings>()
            .Bind(configuration.GetRequiredSection(SupabaseAuthSettings.SectionName))
            .Validate(IsValid, "SupabaseAuth exige Issuer HTTPS e Audience.")
            .ValidateOnStart();

        // Precisamos dos valores agora para configurar o middleware JwtBearer.
        var settings = configuration
            .GetRequiredSection(SupabaseAuthSettings.SectionName)
            .Get<SupabaseAuthSettings>()
            ?? throw new OptionsValidationException(
                SupabaseAuthSettings.SectionName,
                typeof(SupabaseAuthSettings),
                ["A configuração SupabaseAuth não foi encontrada."]);

        var issuer = settings.Issuer.TrimEnd('/');

        // Define Bearer como o mecanismo padrão de autenticação.
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                // Authority permite ao ASP.NET localizar a configuração OpenID e o JWKS.
                options.Authority = issuer;

                // Audience impede aceitar tokens destinados a outro tipo de cliente.
                options.Audience = settings.Audience;

                // Nunca é permitido buscar metadados de autenticação por HTTP.
                options.RequireHttpsMetadata = true;

                // Mantém os nomes originais das claims: sub, role, email e aal.
                options.MapInboundClaims = false;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = settings.Audience,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,

                    // O projeto usa ES256. RS256 também é assimétrico e aceito pelo Supabase.
                    // HS256 fica intencionalmente de fora para não depender de segredo compartilhado.
                    ValidAlgorithms =
                    [
                        SecurityAlgorithms.EcdsaSha256,
                        SecurityAlgorithms.RsaSha256,
                    ],

                    // Uma tolerância curta absorve pequenos desvios entre relógios.
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = "email",
                    RoleClaimType = "role",
                };

                // Padroniza 401 e 403 sem revelar por que um token falhou.
                options.Events = CreateSafeEvents();
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthenticatedUserPolicy, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireClaim("sub");
                policy.RequireClaim("role", "authenticated");
            });
        });

        return services;
    }

    // Verifica a configuração antes de a API começar a aceitar requisições.
    private static bool IsValid(SupabaseAuthSettings settings)
    {
        return Uri.TryCreate(settings.Issuer, UriKind.Absolute, out var issuer)
            && issuer.Scheme == Uri.UriSchemeHttps
            && !string.IsNullOrWhiteSpace(settings.Audience);
    }

    private static JwtBearerEvents CreateSafeEvents()
    {
        return new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                // Evita que o manipulador padrão escreva uma segunda resposta.
                context.HandleResponse();

                await Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Autenticação necessária",
                    detail: "Envie um access token válido no cabeçalho Authorization.")
                    .ExecuteAsync(context.HttpContext);
            },
            OnForbidden = async context =>
            {
                await Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Acesso negado",
                    detail: "Sua conta não possui permissão para acessar este recurso.")
                    .ExecuteAsync(context.HttpContext);
            },
        };
    }
}
