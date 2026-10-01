using Eventum.Application.Tables.DTOs;
using Eventum.Application.Tables.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[Authorize]
[Route("api/v1/events/{eventId:guid}/tables")]
public class TablesController : BaseApiController
{
    private readonly ITableService _tableService;

    public TablesController(ITableService tableService)
    {
        _tableService = tableService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTables(Guid eventId, CancellationToken cancellationToken)
    {
        var tables = await _tableService.GetTablesAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(tables);
    }

    [HttpGet("with-guests")]
    public async Task<IActionResult> GetTablesWithGuests(Guid eventId, CancellationToken cancellationToken)
    {
        var tables = await _tableService.GetTablesWithGuestsAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(tables);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTableById(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var table = await _tableService.GetTableByIdAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(table);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTable(Guid eventId, [FromBody] CreateTableRequest request, CancellationToken cancellationToken)
    {
        var table = await _tableService.CreateTableAsync(eventId, CurrentUserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, table);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTable(Guid eventId, Guid id, [FromBody] UpdateTableRequest request, CancellationToken cancellationToken)
    {
        var table = await _tableService.UpdateTableAsync(eventId, id, CurrentUserId, request, cancellationToken);
        return Ok(table);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTable(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var success = await _tableService.DeleteTableAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(new { success });
    }
}
