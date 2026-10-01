using Eventum.Application.Finance.DTOs;

namespace Eventum.Application.Finance.Services;

public interface IFinanceService
{
    // Expense Categories
    Task<IReadOnlyList<ExpenseCategoryDto>> GetCategoriesAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<ExpenseCategoryDto> CreateCategoryAsync(Guid eventId, Guid userId, CreateExpenseCategoryRequest request, CancellationToken cancellationToken = default);
    Task<ExpenseCategoryDto> UpdateCategoryAsync(Guid eventId, Guid categoryId, Guid userId, UpdateExpenseCategoryRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCategoryAsync(Guid eventId, Guid categoryId, Guid userId, CancellationToken cancellationToken = default);

    // Expenses
    Task<IReadOnlyList<ExpenseDto>> GetExpensesAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<ExpenseDto> GetExpenseByIdAsync(Guid eventId, Guid expenseId, Guid userId, CancellationToken cancellationToken = default);
    Task<ExpenseDto> CreateExpenseAsync(Guid eventId, Guid userId, CreateExpenseRequest request, CancellationToken cancellationToken = default);
    Task<ExpenseDto> UpdateExpenseAsync(Guid eventId, Guid expenseId, Guid userId, UpdateExpenseRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteExpenseAsync(Guid eventId, Guid expenseId, Guid userId, CancellationToken cancellationToken = default);

    // Metrics
    Task<FinanceMetricsDto> GetFinanceMetricsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
}
