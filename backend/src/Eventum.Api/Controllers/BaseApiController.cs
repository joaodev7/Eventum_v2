using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(idClaim) || !Guid.TryParse(idClaim, out var id))
            {
                throw new UnauthorizedAccessException("Usuário não autenticado.");
            }

            return id;
        }
    }
}
