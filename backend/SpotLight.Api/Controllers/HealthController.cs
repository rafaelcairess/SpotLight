// Importa ControllerBase, ActionResult, Ok e os atributos das rotas HTTP.
using Microsoft.AspNetCore.Mvc;

// Importa o contrato que representa o JSON devolvido por esta rota.
using SpotLight.Api.Contracts;

// Agrupa este arquivo com os outros controllers da API.
namespace SpotLight.Api.Controllers;

// Indica que esta classe possui comportamentos de uma API HTTP.
[ApiController]

// Define o endereço base do controller como /api/health.
[Route("api/health")]

// "sealed" impede herança desnecessária.
// "(TimeProvider clock)" é o construtor; o ASP.NET injeta o relógio registrado.
// ControllerBase oferece métodos como Ok(), NotFound() e BadRequest().
public sealed class HealthController(TimeProvider clock) : ControllerBase
{
    // Faz este método responder ao verbo GET em /api/health.
    [HttpGet]

    // Documenta no Swagger que o sucesso é HTTP 200 contendo HealthResponse.
    [ProducesResponseType<HealthResponse>(StatusCodes.Status200OK)]

    // ActionResult permite devolver o objeto esperado ou respostas HTTP alternativas.
    public ActionResult<HealthResponse> Get()
    {
        // Ok cria HTTP 200. O ASP.NET transforma HealthResponse automaticamente em JSON.
        return Ok(new HealthResponse(
            // Identifica qual serviço respondeu.
            Service: "SpotLight.Api",

            // Indica que o processo está funcionando.
            Status: "healthy",

            // Usa o relógio injetado; nos testes ele pode ser controlado.
            Timestamp: clock.GetUtcNow()));
    }
}
