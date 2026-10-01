using Eventum.Domain.Enums;

namespace Eventum.Domain.Entities;

public class UserRole
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public AppRole Role { get; set; } = AppRole.User;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
