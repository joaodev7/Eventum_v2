using Eventum.Domain.Enums;

namespace Eventum.Domain.Entities;

public class Event : BaseEntity
{
    public string Slug { get; set; } = string.Empty;
    public EventType EventType { get; set; } = EventType.Wedding;
    public string EventName { get; set; } = string.Empty;
    public DateTime? EventDate { get; set; }
    public string? EventTime { get; set; }
    public string? VenueName { get; set; }
    public string? VenueAddress { get; set; }
    public string? VenueMapsLink { get; set; }
    public string? HeroImageUrl { get; set; }
    public string? InviteImageUrl { get; set; }
    public string? WelcomeMessage { get; set; }
    public List<string> GalleryImages { get; set; } = new();
    public string ThemeConfigJson { get; set; } = "{}";
    public string SettingsJson { get; set; } = "{}";
    public EventStatus Status { get; set; } = EventStatus.Draft;
    public Guid? CreatedBy { get; set; }

    public User? Creator { get; set; }
    public ICollection<EventUser> EventUsers { get; set; } = new List<EventUser>();
    public ICollection<Table> Tables { get; set; } = new List<Table>();
    public ICollection<Guest> Guests { get; set; } = new List<Guest>();
    public ICollection<GuestCompanion> Companions { get; set; } = new List<GuestCompanion>();
    public ICollection<Gift> Gifts { get; set; } = new List<Gift>();
    public ICollection<GiftPayment> GiftPayments { get; set; } = new List<GiftPayment>();
    public PixConfig? PixConfig { get; set; }
    public MercadoPagoConnection? MercadoPagoConnection { get; set; }
    public ICollection<ExpenseCategory> ExpenseCategories { get; set; } = new List<ExpenseCategory>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
    public ICollection<InviteEmail> InviteEmails { get; set; } = new List<InviteEmail>();
}
