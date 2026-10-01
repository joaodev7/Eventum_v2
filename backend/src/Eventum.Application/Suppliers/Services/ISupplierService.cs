using Eventum.Application.Suppliers.DTOs;

namespace Eventum.Application.Suppliers.Services;

public interface ISupplierService
{
    Task<IReadOnlyList<SupplierDto>> GetSuppliersAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<SupplierDto> GetSupplierByIdAsync(Guid eventId, Guid supplierId, Guid userId, CancellationToken cancellationToken = default);
    Task<SupplierDto> CreateSupplierAsync(Guid eventId, Guid userId, CreateSupplierRequest request, CancellationToken cancellationToken = default);
    Task<SupplierDto> UpdateSupplierAsync(Guid eventId, Guid supplierId, Guid userId, UpdateSupplierRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteSupplierAsync(Guid eventId, Guid supplierId, Guid userId, CancellationToken cancellationToken = default);
}
