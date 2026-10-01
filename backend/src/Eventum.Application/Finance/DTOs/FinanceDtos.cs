using Eventum.Domain.Enums;

namespace Eventum.Application.Finance.DTOs;

public record ExpenseCategoryDto(
    Guid Id,
    Guid EventId,
    string Name,
    string Color,
    string? Icon,
    decimal TotalAmount,
    decimal TotalPaid,
    DateTime CreatedAt
);

public record CreateExpenseCategoryRequest(
    string Name,
    string? Color,
    string? Icon
);

public record UpdateExpenseCategoryRequest(
    string Name,
    string? Color,
    string? Icon
);

public record ExpenseDto(
    Guid Id,
    Guid EventId,
    Guid? CategoryId,
    string? CategoryName,
    string? CategoryColor,
    string Description,
    decimal Amount,
    decimal PaidAmount,
    ExpenseStatus Status,
    DateTime? DueDate,
    DateTime? PaidAt,
    string? VendorName,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateExpenseRequest(
    Guid? CategoryId,
    string Description,
    decimal Amount,
    decimal PaidAmount,
    ExpenseStatus Status,
    DateTime? DueDate,
    string? VendorName,
    string? Notes
);

public record UpdateExpenseRequest(
    Guid? CategoryId,
    string Description,
    decimal Amount,
    decimal PaidAmount,
    ExpenseStatus Status,
    DateTime? DueDate,
    DateTime? PaidAt,
    string? VendorName,
    string? Notes
);

public record CategoryChartDto(
    string Name,
    decimal Value,
    string Color
);

public record CategoryComparisonDto(
    string Name,
    decimal Planned,
    decimal Paid
);

public record FinanceMetricsDto(
    decimal TotalBudget,
    decimal TotalPaid,
    decimal ToPay,
    decimal TotalGiftsReceived,
    decimal GeneralBalance,
    List<CategoryChartDto> ExpensesByCategory,
    List<CategoryComparisonDto> PaidVsPlanned
);
