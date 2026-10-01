using Eventum.Domain.Enums;

namespace Eventum.Domain.Entities;

public class Guest : BaseEntity
{
    public Guid EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public GuestGroup GuestGroup { get; set; } = GuestGroup.Other;
    public Guid? TableId { get; set; }
    public string Token { get; set; } = Guid.NewGuid().ToString();
    public InviteStatus Status { get; set; } = InviteStatus.Pending;
    public int Companions { get; set; } = 0;
    public bool HasViewed { get; set; } = false;
    public DateTime? ViewedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime? InviteEmailSentAt { get; set; }

    // Segunda Confirmação
    public bool SecondConfirmationSent { get; set; } = false;
    public string? SecondConfirmationStatus { get; set; }
    public DateTime? SecondConfirmationRespondedAt { get; set; }
    public int SecondConfirmationCompanions { get; set; } = 0;
    public string? ReconfirmationToken { get; set; }

    public Event Event { get; set; } = null!;
    public Table? Table { get; set; }
    public ICollection<GuestCompanion> CompanionsList { get; set; } = new List<GuestCompanion>();
    public ICollection<InviteEmail> InviteEmails { get; set; } = new List<InviteEmail>();
}
