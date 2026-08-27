using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpotLight.Api.Authentication;
using SpotLight.Api.Contracts;

namespace SpotLight.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize(Policy = SupabaseAuthenticationExtensions.AuthenticatedUserPolicy)]
public sealed class MeController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public ActionResult<CurrentUserResponse> Get()
    {
        var subject = User.FindFirstValue("sub");
        if (!Guid.TryParse(subject, out var userId))
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Identidade inválida",
                detail: "O token não possui um identificador de usuário válido.");
        }

        var isAnonymous = bool.TryParse(
            User.FindFirstValue("is_anonymous"),
            out var anonymousValue) && anonymousValue;

        return Ok(new CurrentUserResponse(
            UserId: userId,
            Email: User.FindFirstValue("email"),
            Role: User.FindFirstValue("role") ?? "authenticated",
            AuthenticationLevel: User.FindFirstValue("aal"),
            IsAnonymous: isAnonymous));
    }
}
