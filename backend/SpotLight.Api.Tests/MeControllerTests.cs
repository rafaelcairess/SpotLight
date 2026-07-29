using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using SpotLight.Api.Contracts;
using SpotLight.Api.Controllers;

namespace SpotLight.Api.Tests;

// Testa tanto o controller isolado quanto a rota passando pelo pipeline HTTP.
public sealed class MeControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _application;

    public MeControllerTests(WebApplicationFactory<Program> application)
    {
        _application = application;
    }

    [Fact]
    public void Get_WithTrustedClaims_ReturnsCurrentUser()
    {
        // Arrange: representa claims que já passaram pela validação JWT.
        var expectedUserId = Guid.Parse("d853dbb3-bcfe-4493-a893-ba084a722ea5");
        var claims = new[]
        {
            new Claim("sub", expectedUserId.ToString()),
            new Claim("email", "usuario@spotlight.local"),
            new Claim("role", "authenticated"),
            new Claim("aal", "aal1"),
            new Claim("is_anonymous", "false"),
        };

        var controller = new MeController
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test")),
                },
            },
        };

        // Act: chama diretamente a regra responsável por montar a resposta.
        var result = controller.Get();

        // Assert: somente as informações permitidas são devolvidas.
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CurrentUserResponse>(ok.Value);
        Assert.Equal(expectedUserId, response.UserId);
        Assert.Equal("usuario@spotlight.local", response.Email);
        Assert.Equal("authenticated", response.Role);
        Assert.Equal("aal1", response.AuthenticationLevel);
        Assert.False(response.IsAnonymous);
    }

    [Fact]
    public async Task Get_WithoutBearerToken_ReturnsStandardUnauthorizedProblem()
    {
        // CreateClient inicia a API inteira em memória, sem abrir uma porta real.
        using var client = _application.CreateClient();

        // A requisição não envia Authorization: Bearer, portanto deve ser recusada.
        using var response = await client.GetAsync("/api/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status401Unauthorized, problem.Status);
        Assert.Equal("Autenticação necessária", problem.Title);
    }
}
