using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace SpotLight.Api.Authentication;

public static class SupabaseAuthenticationExtensions
{
    public const string AuthenticatedUserPolicy = "SupabaseAuthenticatedUser";
    public static IServiceCollection AddSupabaseAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services
            .AddOptions<SupabaseAuthSettings>()
            .Bind(configuration.GetRequiredSection(SupabaseAuthSettings.SectionName))
            .Validate(IsValid, "SupabaseAuth exige Issuer HTTPS e Audience.")
            .ValidateOnStart();
        var settings = configuration
            .GetRequiredSection(SupabaseAuthSettings.SectionName)
            .Get<SupabaseAuthSettings>()
            ?? throw new OptionsValidationException(
                SupabaseAuthSettings.SectionName,
                typeof(SupabaseAuthSettings),
                ["A configuração SupabaseAuth não foi encontrada."]);

        var issuer = settings.Issuer.TrimEnd('/');
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = issuer;
                options.Audience = settings.Audience;
                options.RequireHttpsMetadata = true;
                options.MapInboundClaims = false;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = settings.Audience,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidAlgorithms =
                    [
                        SecurityAlgorithms.EcdsaSha256,
                        SecurityAlgorithms.RsaSha256,
                    ],
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = "email",
                    RoleClaimType = "role",
                };
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
