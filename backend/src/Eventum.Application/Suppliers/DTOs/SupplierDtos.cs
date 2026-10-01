namespace Eventum.Application.Suppliers.DTOs;

public record SupplierDto(
    Guid Id,
    Guid EventId,
    string Name,
    string? Category,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Website,
    string? Instagram,
    string? Address,
    string? Notes,
    bool Contracted,
    decimal? ContractValue,
    decimal PaidAmount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateSupplierRequest(
    string Name,
    string? Category,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Website,
    string? Instagram,
    string? Address,
    string? Notes,
    bool Contracted,
    decimal? ContractValue,
    decimal PaidAmount
);

public record UpdateSupplierRequest(
    string Name,
    string? Category,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Website,
    string? Instagram,
    string? Address,
    string? Notes,
    bool Contracted,
    decimal? ContractValue,
    decimal PaidAmount
);
