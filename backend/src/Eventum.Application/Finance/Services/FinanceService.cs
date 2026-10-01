using Eventum.Application.Common.Interfaces;
using Eventum.Application.Finance.DTOs;
using Eventum.Domain.Entities;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;

namespace Eventum.Application.Finance.Services;

public class FinanceService : IFinanceService
{
    private readonly IRepository<ExpenseCategory> _categoryRepository;
    private readonly IRepository<Expense> _expenseRepository;
    private readonly IRepository<GiftPayment> _paymentRepository;
    private readonly IRepository<Gift> _giftRepository;
    private readonly IEventAuthorizationService _authorizationService;
    private readonly IUnitOfWork _unitOfWork;

    public FinanceService(
        IRepository<ExpenseCategory> categoryRepository,
        IRepository<Expense> expenseRepository,
        IRepository<GiftPayment> paymentRepository,
        IRepository<Gift> giftRepository,
        IEventAuthorizationService authorizationService,
        IUnitOfWork unitOfWork)
    {
        _categoryRepository = categoryRepository;
        _expenseRepository = expenseRepository;
        _paymentRepository = paymentRepository;
        _giftRepository = giftRepository;
        _authorizationService = authorizationService;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ExpenseCategoryDto>> GetCategoriesAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var categories = await _categoryRepository.FindAsync(c => c.EventId == eventId, cancellationToken);
        var expenses = await _expenseRepository.FindAsync(e => e.EventId == eventId && e.CategoryId != null, cancellationToken);

        var amountByCategory = expenses.GroupBy(e => e.CategoryId!.Value)
            .ToDictionary(g => g.Key, g => new { Total = g.Sum(x => x.Amount), Paid = g.Sum(x => x.PaidAmount) });

        return categories.OrderBy(c => c.Name).Select(c =>
        {
            var total = amountByCategory.TryGetValue(c.Id, out var stats) ? stats.Total : 0;
            var paid = amountByCategory.TryGetValue(c.Id, out var stats2) ? stats2.Paid : 0;
            return new ExpenseCategoryDto(c.Id, c.EventId, c.Name, c.Color, c.Icon, total, paid, c.CreatedAt);
        }).ToList();
    }

    public async Task<ExpenseCategoryDto> CreateCategoryAsync(Guid eventId, Guid userId, CreateExpenseCategoryRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome da categoria é obrigatório.");
        }

        var category = new ExpenseCategory
        {
            EventId = eventId,
            Name = request.Name.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#6B7280" : request.Color.Trim(),
            Icon = request.Icon?.Trim()
        };

        await _categoryRepository.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ExpenseCategoryDto(category.Id, category.EventId, category.Name, category.Color, category.Icon, 0, 0, category.CreatedAt);
    }

    public async Task<ExpenseCategoryDto> UpdateCategoryAsync(Guid eventId, Guid categoryId, Guid userId, UpdateExpenseCategoryRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var category = (await _categoryRepository.FindAsync(c => c.Id == categoryId && c.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (category == null)
        {
            throw new EntityNotFoundException(nameof(ExpenseCategory), categoryId);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome da categoria é obrigatório.");
        }

        category.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Color))
        {
            category.Color = request.Color.Trim();
        }
        category.Icon = request.Icon?.Trim();

        await _categoryRepository.UpdateAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var expenses = await _expenseRepository.FindAsync(e => e.CategoryId == categoryId && e.EventId == eventId, cancellationToken);
        var total = expenses.Sum(x => x.Amount);
        var paid = expenses.Sum(x => x.PaidAmount);

        return new ExpenseCategoryDto(category.Id, category.EventId, category.Name, category.Color, category.Icon, total, paid, category.CreatedAt);
    }

    public async Task<bool> DeleteCategoryAsync(Guid eventId, Guid categoryId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var category = (await _categoryRepository.FindAsync(c => c.Id == categoryId && c.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (category == null)
        {
            throw new EntityNotFoundException(nameof(ExpenseCategory), categoryId);
        }

        var expenses = await _expenseRepository.FindAsync(e => e.CategoryId == categoryId && e.EventId == eventId, cancellationToken);
        foreach (var expense in expenses)
        {
            expense.CategoryId = null;
            await _expenseRepository.UpdateAsync(expense, cancellationToken);
        }

        await _categoryRepository.DeleteAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<ExpenseDto>> GetExpensesAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var expenses = await _expenseRepository.FindAsync(e => e.EventId == eventId, cancellationToken);
        var categories = (await _categoryRepository.FindAsync(c => c.EventId == eventId, cancellationToken)).ToDictionary(c => c.Id);

        return expenses.OrderByDescending(e => e.CreatedAt).Select(e =>
        {
            var cat = e.CategoryId.HasValue && categories.TryGetValue(e.CategoryId.Value, out var c) ? c : null;
            return new ExpenseDto(
                e.Id, e.EventId, e.CategoryId, cat?.Name, cat?.Color, e.Description,
                e.Amount, e.PaidAmount, e.Status, e.DueDate, e.PaidAt, e.VendorName, e.Notes,
                e.CreatedAt, e.UpdatedAt
            );
        }).ToList();
    }

    public async Task<ExpenseDto> GetExpenseByIdAsync(Guid eventId, Guid expenseId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var expense = (await _expenseRepository.FindAsync(e => e.Id == expenseId && e.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (expense == null)
        {
            throw new EntityNotFoundException(nameof(Expense), expenseId);
        }

        string? catName = null;
        string? catColor = null;
        if (expense.CategoryId.HasValue)
        {
            var cat = await _categoryRepository.GetByIdAsync(expense.CategoryId.Value, cancellationToken);
            catName = cat?.Name;
            catColor = cat?.Color;
        }

        return new ExpenseDto(
            expense.Id, expense.EventId, expense.CategoryId, catName, catColor,
            expense.Description, expense.Amount, expense.PaidAmount, expense.Status,
            expense.DueDate, expense.PaidAt, expense.VendorName, expense.Notes,
            expense.CreatedAt, expense.UpdatedAt
        );
    }

    public async Task<ExpenseDto> CreateExpenseAsync(Guid eventId, Guid userId, CreateExpenseRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            throw new DomainException("A descrição da despesa é obrigatória.");
        }

        if (request.CategoryId.HasValue)
        {
            var cat = (await _categoryRepository.FindAsync(c => c.Id == request.CategoryId.Value && c.EventId == eventId, cancellationToken)).FirstOrDefault();
            if (cat == null)
            {
                throw new DomainException("Categoria informada não pertence ao evento.");
            }
        }

        var expense = new Expense
        {
            EventId = eventId,
            CategoryId = request.CategoryId,
            Description = request.Description.Trim(),
            Amount = request.Amount,
            PaidAmount = request.PaidAmount,
            Status = request.Status,
            DueDate = request.DueDate,
            VendorName = request.VendorName?.Trim(),
            Notes = request.Notes?.Trim()
        };

        await _expenseRepository.AddAsync(expense, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        string? catName = null;
        string? catColor = null;
        if (expense.CategoryId.HasValue)
        {
            var cat = await _categoryRepository.GetByIdAsync(expense.CategoryId.Value, cancellationToken);
            catName = cat?.Name;
            catColor = cat?.Color;
        }

        return new ExpenseDto(
            expense.Id, expense.EventId, expense.CategoryId, catName, catColor,
            expense.Description, expense.Amount, expense.PaidAmount, expense.Status,
            expense.DueDate, expense.PaidAt, expense.VendorName, expense.Notes,
            expense.CreatedAt, expense.UpdatedAt
        );
    }

    public async Task<ExpenseDto> UpdateExpenseAsync(Guid eventId, Guid expenseId, Guid userId, UpdateExpenseRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var expense = (await _expenseRepository.FindAsync(e => e.Id == expenseId && e.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (expense == null)
        {
            throw new EntityNotFoundException(nameof(Expense), expenseId);
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            throw new DomainException("A descrição da despesa é obrigatória.");
        }

        if (request.CategoryId.HasValue && request.CategoryId != expense.CategoryId)
        {
            var cat = (await _categoryRepository.FindAsync(c => c.Id == request.CategoryId.Value && c.EventId == eventId, cancellationToken)).FirstOrDefault();
            if (cat == null)
            {
                throw new DomainException("Categoria informada não pertence ao evento.");
            }
        }

        expense.CategoryId = request.CategoryId;
        expense.Description = request.Description.Trim();
        expense.Amount = request.Amount;
        expense.PaidAmount = request.PaidAmount;
        expense.Status = request.Status;
        expense.DueDate = request.DueDate;
        expense.PaidAt = request.PaidAt;
        expense.VendorName = request.VendorName?.Trim();
        expense.Notes = request.Notes?.Trim();

        await _expenseRepository.UpdateAsync(expense, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        string? catName = null;
        string? catColor = null;
        if (expense.CategoryId.HasValue)
        {
            var cat = await _categoryRepository.GetByIdAsync(expense.CategoryId.Value, cancellationToken);
            catName = cat?.Name;
            catColor = cat?.Color;
        }

        return new ExpenseDto(
            expense.Id, expense.EventId, expense.CategoryId, catName, catColor,
            expense.Description, expense.Amount, expense.PaidAmount, expense.Status,
            expense.DueDate, expense.PaidAt, expense.VendorName, expense.Notes,
            expense.CreatedAt, expense.UpdatedAt
        );
    }

    public async Task<bool> DeleteExpenseAsync(Guid eventId, Guid expenseId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var expense = (await _expenseRepository.FindAsync(e => e.Id == expenseId && e.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (expense == null)
        {
            throw new EntityNotFoundException(nameof(Expense), expenseId);
        }

        await _expenseRepository.DeleteAsync(expense, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<FinanceMetricsDto> GetFinanceMetricsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var expenses = (await _expenseRepository.FindAsync(e => e.EventId == eventId, cancellationToken)).ToList();
        var categories = (await _categoryRepository.FindAsync(c => c.EventId == eventId, cancellationToken)).ToList();

        var totalBudget = expenses.Sum(e => e.Amount);
        var totalPaid = expenses.Sum(e => e.PaidAmount);
        var toPay = totalBudget - totalPaid;

        // Presentes confirmados
        var payments = await _paymentRepository.FindAsync(p => p.EventId == eventId && p.Status == "confirmed", cancellationToken);
        var gifts = (await _giftRepository.FindAsync(g => g.EventId == eventId, cancellationToken)).ToDictionary(g => g.Id);

        decimal totalGiftsReceived = 0;
        foreach (var p in payments)
        {
            if (gifts.TryGetValue(p.GiftId, out var g))
            {
                totalGiftsReceived += g.Value;
            }
        }

        var generalBalance = totalGiftsReceived - totalBudget;

        var expensesByCategory = new List<CategoryChartDto>();
        var paidVsPlanned = new List<CategoryComparisonDto>();

        var catMap = categories.ToDictionary(c => c.Id);
        var groupedByCategory = expenses.GroupBy(e => e.CategoryId).ToList();

        foreach (var group in groupedByCategory)
        {
            var catName = group.Key.HasValue && catMap.TryGetValue(group.Key.Value, out var c) ? c.Name : "Outros";
            var catColor = group.Key.HasValue && catMap.TryGetValue(group.Key.Value, out var c2) ? c2.Color : "#6B7280";

            var planned = group.Sum(e => e.Amount);
            var paid = group.Sum(e => e.PaidAmount);

            expensesByCategory.Add(new CategoryChartDto(catName, planned, catColor));
            paidVsPlanned.Add(new CategoryComparisonDto(catName, planned, paid));
        }

        return new FinanceMetricsDto(
            TotalBudget: totalBudget,
            TotalPaid: totalPaid,
            ToPay: toPay,
            TotalGiftsReceived: totalGiftsReceived,
            GeneralBalance: generalBalance,
            ExpensesByCategory: expensesByCategory,
            PaidVsPlanned: paidVsPlanned
        );
    }
}
