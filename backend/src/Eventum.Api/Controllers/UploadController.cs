using Eventum.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[Authorize]
[Route("api/v1/upload")]
public class UploadController : BaseApiController
{
    private readonly IStorageService _storageService;

    public UploadController(IStorageService storageService)
    {
        _storageService = storageService;
    }

    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "Nenhum arquivo enviado." });
        }

        using var stream = file.OpenReadStream();
        var folder = $"users/{CurrentUserId}/avatar";
        var fileUrl = await _storageService.UploadFileAsync(stream, file.FileName, file.ContentType, folder, cancellationToken);

        return Ok(new { url = fileUrl });
    }

    [HttpPost("event-image")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadEventImage(IFormFile file, [FromQuery] Guid? eventId, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "Nenhum arquivo enviado." });
        }

        var folder = eventId.HasValue ? $"events/{eventId.Value}/gallery" : "events/common";
        using var stream = file.OpenReadStream();
        var fileUrl = await _storageService.UploadFileAsync(stream, file.FileName, file.ContentType, folder, cancellationToken);

        return Ok(new { url = fileUrl });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteFile([FromQuery] string fileUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
        {
            return BadRequest(new { error = "URL do arquivo é obrigatória." });
        }

        var success = await _storageService.DeleteFileAsync(fileUrl, cancellationToken);
        return Ok(new { success });
    }
}
