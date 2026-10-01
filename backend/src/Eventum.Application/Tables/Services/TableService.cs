using Eventum.Application.Common.Interfaces;
using Eventum.Application.Tables.DTOs;
using Eventum.Domain.Entities;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;

namespace Eventum.Application.Tables.Services;

public class TableService : ITableService
{
    private readonly IRepository<Table> _tableRepository;
    private readonly IRepository<Guest> _guestRepository;
    private readonly IEventAuthorizationService _authorizationService;
    private readonly IUnitOfWork _unitOfWork;

    public TableService(
        IRepository<Table> tableRepository,
        IRepository<Guest> guestRepository,
        IEventAuthorizationService authorizationService,
        IUnitOfWork unitOfWork)
    {
        _tableRepository = tableRepository;
        _guestRepository = guestRepository;
        _authorizationService = authorizationService;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<TableDto>> GetTablesAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var tables = await _tableRepository.FindAsync(t => t.EventId == eventId, cancellationToken);
        var guests = await _guestRepository.FindAsync(g => g.EventId == eventId && g.TableId != null, cancellationToken);

        var guestCountByTable = guests
            .GroupBy(g => g.TableId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(x => 1 + x.Companions));

        return tables.OrderBy(t => t.Name).Select(t =>
        {
            var count = guestCountByTable.TryGetValue(t.Id, out var c) ? c : 0;
            return new TableDto(t.Id, t.EventId, t.Name, t.Capacity, t.Description, count, t.CreatedAt);
        }).ToList();
    }

    public async Task<IReadOnlyList<TableWithGuestsDto>> GetTablesWithGuestsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var tables = await _tableRepository.FindAsync(t => t.EventId == eventId, cancellationToken);
        var guests = await _guestRepository.FindAsync(g => g.EventId == eventId && g.TableId != null, cancellationToken);

        var guestsByTable = guests.GroupBy(g => g.TableId!.Value).ToDictionary(g => g.Key, g => g.ToList());

        return tables.OrderBy(t => t.Name).Select(t =>
        {
            var tableGuests = guestsByTable.TryGetValue(t.Id, out var gList)
                ? gList.Select(g => new TableGuestDto(g.Id, g.Name, g.Email, g.Phone, g.Companions, g.Status.ToString().ToLower())).ToList()
                : new List<TableGuestDto>();

            return new TableWithGuestsDto(t.Id, t.EventId, t.Name, t.Capacity, t.Description, tableGuests, t.CreatedAt);
        }).ToList();
    }

    public async Task<TableDto> GetTableByIdAsync(Guid eventId, Guid tableId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var table = (await _tableRepository.FindAsync(t => t.Id == tableId && t.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (table == null)
        {
            throw new EntityNotFoundException(nameof(Table), tableId);
        }

        var guests = await _guestRepository.FindAsync(g => g.TableId == tableId && g.EventId == eventId, cancellationToken);
        var count = guests.Sum(x => 1 + x.Companions);

        return new TableDto(table.Id, table.EventId, table.Name, table.Capacity, table.Description, count, table.CreatedAt);
    }

    public async Task<TableDto> CreateTableAsync(Guid eventId, Guid userId, CreateTableRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome da mesa é obrigatório.");
        }

        var table = new Table
        {
            EventId = eventId,
            Name = request.Name.Trim(),
            Capacity = request.Capacity <= 0 ? 10 : request.Capacity,
            Description = request.Description?.Trim()
        };

        await _tableRepository.AddAsync(table, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new TableDto(table.Id, table.EventId, table.Name, table.Capacity, table.Description, 0, table.CreatedAt);
    }

    public async Task<TableDto> UpdateTableAsync(Guid eventId, Guid tableId, Guid userId, UpdateTableRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var table = (await _tableRepository.FindAsync(t => t.Id == tableId && t.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (table == null)
        {
            throw new EntityNotFoundException(nameof(Table), tableId);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome da mesa é obrigatório.");
        }

        table.Name = request.Name.Trim();
        table.Capacity = request.Capacity <= 0 ? 10 : request.Capacity;
        table.Description = request.Description?.Trim();

        await _tableRepository.UpdateAsync(table, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var guests = await _guestRepository.FindAsync(g => g.TableId == tableId && g.EventId == eventId, cancellationToken);
        var count = guests.Sum(x => 1 + x.Companions);

        return new TableDto(table.Id, table.EventId, table.Name, table.Capacity, table.Description, count, table.CreatedAt);
    }

    public async Task<bool> DeleteTableAsync(Guid eventId, Guid tableId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var table = (await _tableRepository.FindAsync(t => t.Id == tableId && t.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (table == null)
        {
            throw new EntityNotFoundException(nameof(Table), tableId);
        }

        // Unlink guests
        var guests = await _guestRepository.FindAsync(g => g.TableId == tableId && g.EventId == eventId, cancellationToken);
        foreach (var guest in guests)
        {
            guest.TableId = null;
            await _guestRepository.UpdateAsync(guest, cancellationToken);
        }

        await _tableRepository.DeleteAsync(table, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
