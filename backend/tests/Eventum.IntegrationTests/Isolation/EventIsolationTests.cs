using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Infrastructure.Persistence.Context;
using Eventum.IntegrationTests.Common;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Eventum.IntegrationTests.Isolation;

public class EventIsolationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public EventIsolationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task UserA_CannotAccess_GuestsOfEventB()
    {
        // 1. Arrange: Seed User A and Event A, User B and Event B
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<EventumDbContext>();

        var userA = new User { Id = Guid.NewGuid(), Email = "usera@example.com", PasswordHash = "hash" };
        var userB = new User { Id = Guid.NewGuid(), Email = "userb@example.com", PasswordHash = "hash" };

        var eventA = new Event { Id = Guid.NewGuid(), Slug = "event-a", EventName = "Event A", CreatedBy = userA.Id };
        var eventB = new Event { Id = Guid.NewGuid(), Slug = "event-b", EventName = "Event B", CreatedBy = userB.Id };

        var linkA = new EventUser { EventId = eventA.Id, UserId = userA.Id, Role = EventRole.Owner };
        var linkB = new EventUser { EventId = eventB.Id, UserId = userB.Id, Role = EventRole.Owner };

        var guestB = new Guest { Id = Guid.NewGuid(), EventId = eventB.Id, Name = "Convidado do Evento B" };

        db.Users.AddRange(userA, userB);
        db.Events.AddRange(eventA, eventB);
        db.EventUsers.AddRange(linkA, linkB);
        db.Guests.Add(guestB);
        await db.SaveChangesAsync();

        // Token for User A
        var tokenA = _factory.GenerateTestToken(userA.Id, userA.Email);

        // 2. Act: User A attempts to access Guest list of Event B
        var request = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/events/{eventB.Id}/guests");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenA);

        var response = await _client.SendAsync(request);

        // 3. Assert: Access should be denied (403 Forbidden)
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
