using System.Linq.Expressions;
using Eventum.Application.Common.Interfaces;
using Eventum.Application.Guests.DTOs;
using Eventum.Application.Guests.Services;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Eventum.UnitTests.Services;

public class GuestServiceTests
{
    private readonly Mock<IRepository<Guest>> _guestRepoMock = new();
    private readonly Mock<IRepository<GuestCompanion>> _companionRepoMock = new();
    private readonly Mock<IRepository<Table>> _tableRepoMock = new();
    private readonly Mock<IRepository<Event>> _eventRepoMock = new();
    private readonly Mock<IRepository<InviteEmail>> _inviteEmailRepoMock = new();
    private readonly Mock<IEventAuthorizationService> _authServiceMock = new();
    private readonly Mock<IEmailService> _emailServiceMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    private readonly GuestService _sut;

    public GuestServiceTests()
    {
        _sut = new GuestService(
            _guestRepoMock.Object,
            _companionRepoMock.Object,
            _tableRepoMock.Object,
            _eventRepoMock.Object,
            _inviteEmailRepoMock.Object,
            _authServiceMock.Object,
            _emailServiceMock.Object,
            _uowMock.Object
        );
    }

    [Fact]
    public async Task GetMetricsAsync_ShouldCalculateCorrectMetrics()
    {
        // Arrange
        var eventId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var guest1 = new Guest { Id = Guid.NewGuid(), EventId = eventId, Status = InviteStatus.Accepted, Companions = 1 };
        var guest2 = new Guest { Id = Guid.NewGuid(), EventId = eventId, Status = InviteStatus.Declined, Companions = 0 };
        var guest3 = new Guest { Id = Guid.NewGuid(), EventId = eventId, Status = InviteStatus.Pending, HasViewed = true, Companions = 1 };

        var comp1 = new GuestCompanion { Id = Guid.NewGuid(), EventId = eventId, GuestId = guest1.Id, WillAttend = true };
        var comp2 = new GuestCompanion { Id = Guid.NewGuid(), EventId = eventId, GuestId = guest3.Id, WillAttend = null };

        _authServiceMock
            .Setup(x => x.EnsureHasAccessAsync(eventId, userId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _guestRepoMock
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<Guest, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guest> { guest1, guest2, guest3 });

        _companionRepoMock
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<GuestCompanion, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GuestCompanion> { comp1, comp2 });

        // Act
        var metrics = await _sut.GetMetricsAsync(eventId, userId);

        // Assert
        metrics.TotalGuests.Should().Be(3);
        metrics.TotalCompanions.Should().Be(2);
        metrics.Total.Should().Be(5);

        metrics.AcceptedGuests.Should().Be(1);
        metrics.AcceptedCompanions.Should().Be(1);
        metrics.Accepted.Should().Be(2);

        metrics.DeclinedGuests.Should().Be(1);
        metrics.DeclinedCompanions.Should().Be(0);
        metrics.Declined.Should().Be(1);

        metrics.PendingGuests.Should().Be(1);
        metrics.PendingCompanions.Should().Be(1);
        metrics.Pending.Should().Be(2);

        metrics.ViewedGuests.Should().Be(1);
        metrics.ViewedCompanions.Should().Be(1);
        metrics.Viewed.Should().Be(2);
    }

    [Fact]
    public async Task CreateGuestAsync_WithoutName_ShouldThrowDomainException()
    {
        // Arrange
        var eventId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var request = new CreateGuestRequest("", null, null, GuestGroup.Family, null, null, null);

        _authServiceMock
            .Setup(x => x.EnsureCanManageAsync(eventId, userId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var act = async () => await _sut.CreateGuestAsync(eventId, userId, request);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("O nome do convidado é obrigatório.");
    }
}
