using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Eventum.UnitTests.Domain;

public class DomainRulesTests
{
    [Fact]
    public void Guest_InitialState_ShouldBePendingAndHaveToken()
    {
        var guest = new Guest
        {
            EventId = Guid.NewGuid(),
            Name = "João Silva",
            Email = "joao@example.com"
        };

        guest.Status.Should().Be(InviteStatus.Pending);
        guest.Token.Should().NotBeNullOrEmpty();
        guest.HasViewed.Should().BeFalse();
        guest.Companions.Should().Be(0);
        guest.SecondConfirmationSent.Should().BeFalse();
    }

    [Fact]
    public void Table_InitialCapacity_ShouldDefaultToTen()
    {
        var table = new Table
        {
            EventId = Guid.NewGuid(),
            Name = "Mesa VIP"
        };

        table.Capacity.Should().Be(10);
    }

    [Fact]
    public void Gift_InitialState_ShouldBeAvailable()
    {
        var gift = new Gift
        {
            EventId = Guid.NewGuid(),
            Name = "Jogo de Jantar",
            Value = 350.00m
        };

        gift.Status.Should().Be("available");
        gift.IsFlexibleValue.Should().BeFalse();
    }

    [Fact]
    public void Expense_InitialState_ShouldBePending()
    {
        var expense = new Expense
        {
            EventId = Guid.NewGuid(),
            Description = "Buffet Completo",
            Amount = 15000.00m,
            PaidAmount = 0
        };

        expense.Status.Should().Be(ExpenseStatus.Pending);
        (expense.Amount - expense.PaidAmount).Should().Be(15000.00m);
    }
}
