using Eventum.Domain.Enums;

namespace Eventum.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendAsync(string recipient, string subject, string html, CancellationToken cancellationToken = default);
}

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string folder, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default);
}

public interface IEventAuthorizationService
{
    Task<bool> HasAccessAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CanManageAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> IsOwnerAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task EnsureCanManageAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task EnsureHasAccessAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
}
