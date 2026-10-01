using Eventum.Application.Suppliers.DTOs;
using Eventum.Application.Suppliers.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[Authorize]
[Route("api/v1/events/{eventId:guid}/suppliers")]
public class SuppliersController : BaseApiController
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSuppliers(Guid eventId, CancellationToken cancellationToken)
    {
        var suppliers = await _supplierService.GetSuppliersAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(suppliers);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSupplierById(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var supplier = await _supplierService.GetSupplierByIdAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(supplier);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSupplier(Guid eventId, [FromBody] CreateSupplierRequest request, CancellationToken cancellationToken)
    {
        var supplier = await _supplierService.CreateSupplierAsync(eventId, CurrentUserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, supplier);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSupplier(Guid eventId, Guid id, [FromBody] UpdateSupplierRequest request, CancellationToken cancellationToken)
    {
        var supplier = await _supplierService.UpdateSupplierAsync(eventId, id, CurrentUserId, request, cancellationToken);
        return Ok(supplier);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSupplier(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var success = await _supplierService.DeleteSupplierAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(new { success });
    }
}
