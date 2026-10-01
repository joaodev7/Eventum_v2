using System.Linq.Expressions;
using Eventum.Application.Common.Interfaces;
using Eventum.Application.Tables.Services;
using Eventum.Domain.Entities;
using Eventum.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Eventum.UnitTests.Services;

public class TableServiceTests
{
    private readonly Mock<IRepository<Table>> _tableRepoMock = new();
    private readonly Mock<IRepository<Guest>> _guestRepoMock = new();
    private readonly Mock<IEventAuthorizationService> _authServiceMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    private readonly TableService _sut;

    public TableServiceTests()
    {
        _sut = new TableService(
            _tableRepoMock.Object,
            _guestRepoMock.Object,
            _authServiceMock.Object,
            _uowMock.Object
        );
    }

    [Fact]
    public async Task GetTablesAsync_ShouldSumGuestsAndCompanionsForAssignedCount()
    {
        // Arrange
        var eventId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var tableId = Guid.NewGuid();

        var table = new Table { Id = tableId, EventId = eventId, Name = "Mesa 01", Capacity = 10 };
        var guest1 = new Guest { Id = Guid.NewGuid(), EventId = eventId, TableId = tableId, Companions = 2 };
        var guest2 = new Guest { Id = Guid.NewGuid(), EventId = eventId, TableId = tableId, Companions = 1 };

        _authServiceMock
            .Setup(x => x.EnsureHasAccessAsync(eventId, userId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _tableRepoMock
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<Table, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Table> { table });

        _guestRepoMock
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<Guest, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guest> { guest1, guest2 });

        // Act
        var result = await _sut.GetTablesAsync(eventId, userId);

        // Assert
        result.Should().HaveCount(1);
        // (1 + 2) + (1 + 1) = 5
        result[0].AssignedGuestsCount.Should().Be(5);
    }
}
