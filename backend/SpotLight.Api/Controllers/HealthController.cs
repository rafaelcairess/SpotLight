using Microsoft.AspNetCore.Mvc;
using SpotLight.Api.Contracts;
namespace SpotLight.Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController(TimeProvider clock) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<HealthResponse>(StatusCodes.Status200OK)]
    public ActionResult<HealthResponse> Get()
    {
        return Ok(new HealthResponse(
            Service: "SpotLight.Api",
            Status: "healthy",
            Timestamp: clock.GetUtcNow()));
    }
}
