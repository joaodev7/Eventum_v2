using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Eventum.Application.Common.Interfaces;
using Eventum.Application.Events.DTOs;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;

namespace Eventum.Application.Events.Services;

public class EventService : IEventService
{
    private readonly IRepository<Event> _eventRepository;
    private readonly IRepository<EventUser> _eventUserRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IEventAuthorizationService _authorizationService;
    private readonly IUnitOfWork _unitOfWork;

    public EventService(
        IRepository<Event> eventRepository,
        IRepository<EventUser> eventUserRepository,
        IRepository<User> userRepository,
        IEventAuthorizationService authorizationService,
        IUnitOfWork unitOfWork)
    {
        _eventRepository = eventRepository;
        _eventUserRepository = eventUserRepository;
        _userRepository = userRepository;
        _authorizationService = authorizationService;
        _unitOfWork = unitOfWork;
    }

    private static string GenerateSlug(string name)
    {
        var normalizedString = name.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        var cleaned = stringBuilder.ToString().Normalize(NormalizationForm.FormC).ToLower();
        cleaned = Regex.Replace(cleaned, @"[^a-z0-9\s-]", "");
        cleaned = Regex.Replace(cleaned, @"\s+", "-").Trim('-');
        var suffix = Guid.NewGuid().ToString("N")[..6];

        return $"{cleaned}-{suffix}";
    }

    public async Task<IReadOnlyList<EventDto>> GetUserEventsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var userLinks = await _eventUserRepository.FindAsync(eu => eu.UserId == userId, cancellationToken);
        var eventIds = userLinks.Select(eu => eu.EventId).ToHashSet();

        var events = await _eventRepository.FindAsync(e => eventIds.Contains(e.Id), cancellationToken);

        var list = new List<EventDto>();
        foreach (var ev in events.OrderByDescending(e => e.CreatedAt))
        {
            var role = userLinks.First(l => l.EventId == ev.Id).Role.ToString().ToLower();
            list.Add(new EventDto(
                ev.Id, ev.Slug, ev.EventType, ev.EventName, ev.EventDate, ev.EventTime,
                ev.VenueName, ev.VenueAddress, ev.VenueMapsLink, ev.HeroImageUrl, ev.InviteImageUrl,
                ev.WelcomeMessage, ev.GalleryImages, ev.ThemeConfigJson, ev.SettingsJson,
                ev.Status, ev.CreatedBy, role, ev.CreatedAt, ev.UpdatedAt
            ));
        }

        return list;
    }

    public async Task<EventDto> GetEventByIdAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var ev = await _eventRepository.GetByIdAsync(eventId, cancellationToken);
        if (ev == null)
        {
            throw new EntityNotFoundException(nameof(Event), eventId);
        }

        var member = (await _eventUserRepository.FindAsync(eu => eu.EventId == eventId && eu.UserId == userId, cancellationToken)).FirstOrDefault();
        var role = member?.Role.ToString().ToLower() ?? "admin";

        return new EventDto(
            ev.Id, ev.Slug, ev.EventType, ev.EventName, ev.EventDate, ev.EventTime,
            ev.VenueName, ev.VenueAddress, ev.VenueMapsLink, ev.HeroImageUrl, ev.InviteImageUrl,
            ev.WelcomeMessage, ev.GalleryImages, ev.ThemeConfigJson, ev.SettingsJson,
            ev.Status, ev.CreatedBy, role, ev.CreatedAt, ev.UpdatedAt
        );
    }

    public async Task<PublicEventDto?> GetEventBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var events = await _eventRepository.FindAsync(e => e.Slug == slug && e.Status == EventStatus.Active, cancellationToken);
        var ev = events.FirstOrDefault();
        if (ev == null) return null;

        return new PublicEventDto(
            ev.Id, ev.Slug, ev.EventType, ev.EventName, ev.EventDate, ev.EventTime,
            ev.VenueName, ev.VenueAddress, ev.VenueMapsLink, ev.HeroImageUrl, ev.WelcomeMessage,
            ev.GalleryImages, ev.ThemeConfigJson, ev.SettingsJson
        );
    }

    public async Task<EventDto> CreateEventAsync(Guid userId, CreateEventRequest request, CancellationToken cancellationToken = default)
    {
        var slug = GenerateSlug(request.EventName);

        var ev = new Event
        {
            Slug = slug,
            EventType = request.EventType,
            EventName = request.EventName.Trim(),
            EventDate = request.EventDate,
            EventTime = request.EventTime,
            VenueName = request.VenueName,
            VenueAddress = request.VenueAddress,
            Status = EventStatus.Draft,
            CreatedBy = userId
        };

        await _eventRepository.AddAsync(ev, cancellationToken);

        var link = new EventUser
        {
            EventId = ev.Id,
            UserId = userId,
            Role = EventRole.Owner
        };
        await _eventUserRepository.AddAsync(link, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new EventDto(
            ev.Id, ev.Slug, ev.EventType, ev.EventName, ev.EventDate, ev.EventTime,
            ev.VenueName, ev.VenueAddress, ev.VenueMapsLink, ev.HeroImageUrl, ev.InviteImageUrl,
            ev.WelcomeMessage, ev.GalleryImages, ev.ThemeConfigJson, ev.SettingsJson,
            ev.Status, ev.CreatedBy, "owner", ev.CreatedAt, ev.UpdatedAt
        );
    }

    public async Task<EventDto> UpdateEventAsync(Guid eventId, Guid userId, UpdateEventRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var ev = await _eventRepository.GetByIdAsync(eventId, cancellationToken);
        if (ev == null)
        {
            throw new EntityNotFoundException(nameof(Event), eventId);
        }

        ev.EventName = request.EventName.Trim();
        ev.EventType = request.EventType;
        ev.EventDate = request.EventDate;
        ev.EventTime = request.EventTime;
        ev.VenueName = request.VenueName;
        ev.VenueAddress = request.VenueAddress;
        ev.VenueMapsLink = request.VenueMapsLink;
        ev.HeroImageUrl = request.HeroImageUrl;
        ev.InviteImageUrl = request.InviteImageUrl;
        ev.WelcomeMessage = request.WelcomeMessage;
        if (request.GalleryImages != null) ev.GalleryImages = request.GalleryImages;
        if (!string.IsNullOrWhiteSpace(request.ThemeConfigJson)) ev.ThemeConfigJson = request.ThemeConfigJson;
        if (!string.IsNullOrWhiteSpace(request.SettingsJson)) ev.SettingsJson = request.SettingsJson;
        ev.Status = request.Status;

        await _eventRepository.UpdateAsync(ev, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var member = (await _eventUserRepository.FindAsync(eu => eu.EventId == eventId && eu.UserId == userId, cancellationToken)).FirstOrDefault();
        var role = member?.Role.ToString().ToLower() ?? "admin";

        return new EventDto(
            ev.Id, ev.Slug, ev.EventType, ev.EventName, ev.EventDate, ev.EventTime,
            ev.VenueName, ev.VenueAddress, ev.VenueMapsLink, ev.HeroImageUrl, ev.InviteImageUrl,
            ev.WelcomeMessage, ev.GalleryImages, ev.ThemeConfigJson, ev.SettingsJson,
            ev.Status, ev.CreatedBy, role, ev.CreatedAt, ev.UpdatedAt
        );
    }

    public async Task DeleteEventAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        var isOwner = await _authorizationService.IsOwnerAsync(eventId, userId, cancellationToken);
        if (!isOwner)
        {
            throw new UnauthorizedDomainException("Only event owners or superadmins can delete an event.");
        }

        var ev = await _eventRepository.GetByIdAsync(eventId, cancellationToken);
        if (ev != null)
        {
            await _eventRepository.DeleteAsync(ev, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyList<EventMemberDto>> GetMembersAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var members = await _eventUserRepository.FindAsync(eu => eu.EventId == eventId, cancellationToken);
        var userIds = members.Select(m => m.UserId).ToHashSet();
        var users = (await _userRepository.FindAsync(u => userIds.Contains(u.Id), cancellationToken)).ToDictionary(u => u.Id);

        return members.Select(m => new EventMemberDto(
            m.Id,
            m.UserId,
            users.TryGetValue(m.UserId, out var u) ? u.Email : string.Empty,
            users.TryGetValue(m.UserId, out var usr) ? usr.FullName : null,
            m.Role,
            m.CreatedAt
        )).ToList();
    }

    public async Task<EventMemberDto> AddMemberAsync(Guid eventId, Guid userId, AddEventMemberRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var users = await _userRepository.FindAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        var targetUser = users.FirstOrDefault();
        if (targetUser == null)
        {
            throw new EntityNotFoundException("User", request.Email);
        }

        var existing = await _eventUserRepository.FindAsync(eu => eu.EventId == eventId && eu.UserId == targetUser.Id, cancellationToken);
        if (existing.Any())
        {
            throw new DomainException("This user is already a member of this event.");
        }

        var member = new EventUser
        {
            EventId = eventId,
            UserId = targetUser.Id,
            Role = request.Role
        };

        await _eventUserRepository.AddAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new EventMemberDto(member.Id, targetUser.Id, targetUser.Email, targetUser.FullName, member.Role, member.CreatedAt);
    }

    public async Task RemoveMemberAsync(Guid eventId, Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, currentUserId, cancellationToken);

        var members = await _eventUserRepository.FindAsync(eu => eu.EventId == eventId && eu.UserId == targetUserId, cancellationToken);
        var targetMember = members.FirstOrDefault();

        if (targetMember != null)
        {
            if (targetMember.Role == EventRole.Owner)
            {
                throw new DomainException("Cannot remove the owner of the event.");
            }

            await _eventUserRepository.DeleteAsync(targetMember, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
