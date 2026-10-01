using System.Linq.Expressions;
using Eventum.Application.Common.Interfaces;
using Eventum.Application.Finance.Services;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Eventum.UnitTests.Services;

public class FinanceServiceTests
{
    private readonly Mock<IRepository<ExpenseCategory>> _categoryRepoMock = new();
    private readonly Mock<IRepository<Expense>> _expenseRepoMock = new();
    private readonly Mock<IRepository<GiftPayment>> _paymentRepoMock = new();
    private readonly Mock<IRepository<Gift>> _giftRepoMock = new();
    private readonly Mock<IEventAuthorizationService> _authServiceMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    private readonly FinanceService _sut;

    public FinanceServiceTests()
    {
        _sut = new FinanceService(
            _categoryRepoMock.Object,
            _expenseRepoMock.Object,
            _paymentRepoMock.Object,
            _giftRepoMock.Object,
            _authServiceMock.Object,
            _uowMock.Object
        );
    }

    [Fact]
    public async Task GetFinanceMetricsAsync_ShouldCalculateCorrectBudgetAndGiftsBalance()
    {
        // Arrange
        var eventId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var cat1 = new ExpenseCategory { Id = Guid.NewGuid(), EventId = eventId, Name = "Buffet", Color = "#10B981" };

        var exp1 = new Expense
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            CategoryId = cat1.Id,
            Description = "Almoço Buffet",
            Amount = 10000m,
            PaidAmount = 6000m,
            Status = ExpenseStatus.Partial
        };
        var exp2 = new Expense
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Description = "Fotógrafo",
            Amount = 4000m,
            PaidAmount = 4000m,
            Status = ExpenseStatus.Paid
        };

        var gift1 = new Gift { Id = Guid.NewGuid(), EventId = eventId, Name = "Lua de Mel", Value = 5000m };
        var payment1 = new GiftPayment { Id = Guid.NewGuid(), EventId = eventId, GiftId = gift1.Id, Status = "confirmed" };

        _authServiceMock
            .Setup(x => x.EnsureHasAccessAsync(eventId, userId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _expenseRepoMock
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<Expense, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Expense> { exp1, exp2 });

        _categoryRepoMock
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<ExpenseCategory, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ExpenseCategory> { cat1 });

        _paymentRepoMock
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<GiftPayment, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GiftPayment> { payment1 });

        _giftRepoMock
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<Gift, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Gift> { gift1 });

        // Act
        var metrics = await _sut.GetFinanceMetricsAsync(eventId, userId);

        // Assert
        metrics.TotalBudget.Should().Be(14000m);
        metrics.TotalPaid.Should().Be(10000m);
        metrics.ToPay.Should().Be(4000m);
        metrics.TotalGiftsReceived.Should().Be(5000m);
        metrics.GeneralBalance.Should().Be(5000m - 14000m); // -9000m
    }
}
