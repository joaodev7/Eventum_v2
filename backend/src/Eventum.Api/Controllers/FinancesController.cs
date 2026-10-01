using Eventum.Application.Finance.DTOs;
using Eventum.Application.Finance.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[Authorize]
public class FinancesController : BaseApiController
{
    private readonly IFinanceService _financeService;

    public FinancesController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    [HttpGet("api/v1/events/{eventId:guid}/finances/metrics")]
    public async Task<IActionResult> GetMetrics(Guid eventId, CancellationToken cancellationToken)
    {
        var metrics = await _financeService.GetFinanceMetricsAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(metrics);
    }

    // Categorias
    [HttpGet("api/v1/events/{eventId:guid}/expense-categories")]
    public async Task<IActionResult> GetCategories(Guid eventId, CancellationToken cancellationToken)
    {
        var categories = await _financeService.GetCategoriesAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(categories);
    }

    [HttpPost("api/v1/events/{eventId:guid}/expense-categories")]
    public async Task<IActionResult> CreateCategory(Guid eventId, [FromBody] CreateExpenseCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await _financeService.CreateCategoryAsync(eventId, CurrentUserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, category);
    }

    [HttpPut("api/v1/events/{eventId:guid}/expense-categories/{id:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid eventId, Guid id, [FromBody] UpdateExpenseCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await _financeService.UpdateCategoryAsync(eventId, id, CurrentUserId, request, cancellationToken);
        return Ok(category);
    }

    [HttpDelete("api/v1/events/{eventId:guid}/expense-categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var success = await _financeService.DeleteCategoryAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(new { success });
    }

    // Despesas
    [HttpGet("api/v1/events/{eventId:guid}/expenses")]
    public async Task<IActionResult> GetExpenses(Guid eventId, CancellationToken cancellationToken)
    {
        var expenses = await _financeService.GetExpensesAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(expenses);
    }

    [HttpGet("api/v1/events/{eventId:guid}/expenses/{id:guid}")]
    public async Task<IActionResult> GetExpenseById(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var expense = await _financeService.GetExpenseByIdAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(expense);
    }

    [HttpPost("api/v1/events/{eventId:guid}/expenses")]
    public async Task<IActionResult> CreateExpense(Guid eventId, [FromBody] CreateExpenseRequest request, CancellationToken cancellationToken)
    {
        var expense = await _financeService.CreateExpenseAsync(eventId, CurrentUserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, expense);
    }

    [HttpPut("api/v1/events/{eventId:guid}/expenses/{id:guid}")]
    public async Task<IActionResult> UpdateExpense(Guid eventId, Guid id, [FromBody] UpdateExpenseRequest request, CancellationToken cancellationToken)
    {
        var expense = await _financeService.UpdateExpenseAsync(eventId, id, CurrentUserId, request, cancellationToken);
        return Ok(expense);
    }

    [HttpDelete("api/v1/events/{eventId:guid}/expenses/{id:guid}")]
    public async Task<IActionResult> DeleteExpense(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var success = await _financeService.DeleteExpenseAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(new { success });
    }
}
