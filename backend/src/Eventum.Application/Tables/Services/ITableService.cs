using Eventum.Application.Tables.DTOs;

namespace Eventum.Application.Tables.Services;

public interface ITableService
{
    Task<IReadOnlyList<TableDto>> GetTablesAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TableWithGuestsDto>> GetTablesWithGuestsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<TableDto> GetTableByIdAsync(Guid eventId, Guid tableId, Guid userId, CancellationToken cancellationToken = default);
    Task<TableDto> CreateTableAsync(Guid eventId, Guid userId, CreateTableRequest request, CancellationToken cancellationToken = default);
    Task<TableDto> UpdateTableAsync(Guid eventId, Guid tableId, Guid userId, UpdateTableRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteTableAsync(Guid eventId, Guid tableId, Guid userId, CancellationToken cancellationToken = default);
}
