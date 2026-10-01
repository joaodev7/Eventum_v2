using Eventum.Domain.Enums;

namespace Eventum.Domain.Entities;

public class Expense : BaseEntity
{
    public Guid EventId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; } = 0;
    public decimal PaidAmount { get; set; } = 0;
    public ExpenseStatus Status { get; set; } = ExpenseStatus.Pending;
    public DateTime? DueDate { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? VendorName { get; set; }
    public string? Notes { get; set; }

    public Event Event { get; set; } = null!;
    public ExpenseCategory? Category { get; set; }
}
