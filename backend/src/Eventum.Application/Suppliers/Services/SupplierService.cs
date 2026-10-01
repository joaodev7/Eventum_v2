using Eventum.Application.Common.Interfaces;
using Eventum.Application.Suppliers.DTOs;
using Eventum.Domain.Entities;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;

namespace Eventum.Application.Suppliers.Services;

public class SupplierService : ISupplierService
{
    private readonly IRepository<Supplier> _supplierRepository;
    private readonly IEventAuthorizationService _authorizationService;
    private readonly IUnitOfWork _unitOfWork;

    public SupplierService(
        IRepository<Supplier> supplierRepository,
        IEventAuthorizationService authorizationService,
        IUnitOfWork unitOfWork)
    {
        _supplierRepository = supplierRepository;
        _authorizationService = authorizationService;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<SupplierDto>> GetSuppliersAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var suppliers = await _supplierRepository.FindAsync(s => s.EventId == eventId, cancellationToken);
        return suppliers.OrderBy(s => s.Name).Select(s => new SupplierDto(
            s.Id, s.EventId, s.Name, s.Category, s.ContactName, s.Phone, s.Email,
            s.Website, s.Instagram, s.Address, s.Notes, s.Contracted, s.ContractValue,
            s.PaidAmount, s.CreatedAt, s.UpdatedAt
        )).ToList();
    }

    public async Task<SupplierDto> GetSupplierByIdAsync(Guid eventId, Guid supplierId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var supplier = (await _supplierRepository.FindAsync(s => s.Id == supplierId && s.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (supplier == null)
        {
            throw new EntityNotFoundException(nameof(Supplier), supplierId);
        }

        return new SupplierDto(
            supplier.Id, supplier.EventId, supplier.Name, supplier.Category, supplier.ContactName,
            supplier.Phone, supplier.Email, supplier.Website, supplier.Instagram,
            supplier.Address, supplier.Notes, supplier.Contracted, supplier.ContractValue,
            supplier.PaidAmount, supplier.CreatedAt, supplier.UpdatedAt
        );
    }

    public async Task<SupplierDto> CreateSupplierAsync(Guid eventId, Guid userId, CreateSupplierRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome do fornecedor é obrigatório.");
        }

        var supplier = new Supplier
        {
            EventId = eventId,
            Name = request.Name.Trim(),
            Category = request.Category?.Trim(),
            ContactName = request.ContactName?.Trim(),
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim().ToLowerInvariant(),
            Website = request.Website?.Trim(),
            Instagram = request.Instagram?.Trim(),
            Address = request.Address?.Trim(),
            Notes = request.Notes?.Trim(),
            Contracted = request.Contracted,
            ContractValue = request.ContractValue,
            PaidAmount = request.PaidAmount
        };

        await _supplierRepository.AddAsync(supplier, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new SupplierDto(
            supplier.Id, supplier.EventId, supplier.Name, supplier.Category, supplier.ContactName,
            supplier.Phone, supplier.Email, supplier.Website, supplier.Instagram,
            supplier.Address, supplier.Notes, supplier.Contracted, supplier.ContractValue,
            supplier.PaidAmount, supplier.CreatedAt, supplier.UpdatedAt
        );
    }

    public async Task<SupplierDto> UpdateSupplierAsync(Guid eventId, Guid supplierId, Guid userId, UpdateSupplierRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var supplier = (await _supplierRepository.FindAsync(s => s.Id == supplierId && s.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (supplier == null)
        {
            throw new EntityNotFoundException(nameof(Supplier), supplierId);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome do fornecedor é obrigatório.");
        }

        supplier.Name = request.Name.Trim();
        supplier.Category = request.Category?.Trim();
        supplier.ContactName = request.ContactName?.Trim();
        supplier.Phone = request.Phone?.Trim();
        supplier.Email = request.Email?.Trim().ToLowerInvariant();
        supplier.Website = request.Website?.Trim();
        supplier.Instagram = request.Instagram?.Trim();
        supplier.Address = request.Address?.Trim();
        supplier.Notes = request.Notes?.Trim();
        supplier.Contracted = request.Contracted;
        supplier.ContractValue = request.ContractValue;
        supplier.PaidAmount = request.PaidAmount;

        await _supplierRepository.UpdateAsync(supplier, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new SupplierDto(
            supplier.Id, supplier.EventId, supplier.Name, supplier.Category, supplier.ContactName,
            supplier.Phone, supplier.Email, supplier.Website, supplier.Instagram,
            supplier.Address, supplier.Notes, supplier.Contracted, supplier.ContractValue,
            supplier.PaidAmount, supplier.CreatedAt, supplier.UpdatedAt
        );
    }

    public async Task<bool> DeleteSupplierAsync(Guid eventId, Guid supplierId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var supplier = (await _supplierRepository.FindAsync(s => s.Id == supplierId && s.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (supplier == null)
        {
            throw new EntityNotFoundException(nameof(Supplier), supplierId);
        }

        await _supplierRepository.DeleteAsync(supplier, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
