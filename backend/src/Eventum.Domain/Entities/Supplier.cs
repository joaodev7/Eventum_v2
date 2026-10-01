namespace Eventum.Domain.Entities;

public class Supplier : BaseEntity
{
    public Guid EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? ContactName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? Instagram { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public bool Contracted { get; set; } = false;
    public decimal? ContractValue { get; set; }
    public decimal PaidAmount { get; set; } = 0;

    public Event Event { get; set; } = null!;
}
