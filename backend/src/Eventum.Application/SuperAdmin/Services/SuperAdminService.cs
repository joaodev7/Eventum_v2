using Eventum.Application.Events.DTOs;
using Eventum.Application.SuperAdmin.DTOs;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;

namespace Eventum.Application.SuperAdmin.Services;

public class SuperAdminService : ISuperAdminService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<Event> _eventRepository;
    private readonly IRepository<EventUser> _eventUserRepository;
    private readonly IRepository<Subscription> _subscriptionRepository;
    private readonly IRepository<SubscriptionPlan> _planRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SuperAdminService(
        IRepository<User> userRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<Event> eventRepository,
        IRepository<EventUser> eventUserRepository,
        IRepository<Subscription> subscriptionRepository,
        IRepository<SubscriptionPlan> planRepository,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _eventRepository = eventRepository;
        _eventUserRepository = eventUserRepository;
        _subscriptionRepository = subscriptionRepository;
        _planRepository = planRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<SuperAdminStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var events = await _eventRepository.FindAsync(e => e.Status == EventStatus.Active, cancellationToken);
        var subscriptions = await _subscriptionRepository.FindAsync(s => s.Status == SubscriptionStatus.Active, cancellationToken);
        var plans = (await _planRepository.GetAllAsync(cancellationToken)).ToDictionary(p => p.Id);

        decimal mrr = 0;
        foreach (var sub in subscriptions)
        {
            if (plans.TryGetValue(sub.PlanId, out var plan))
            {
                if (sub.BillingCycle.ToLower() == "yearly")
                {
                    mrr += plan.PriceYearly / 12m;
                }
                else
                {
                    mrr += plan.PriceMonthly;
                }
            }
        }

        return new SuperAdminStatsDto(
            TotalUsers: users.Count,
            TotalEvents: events.Count,
            ActiveSubscriptions: subscriptions.Count,
            MonthlyRecurringRevenue: decimal.Round(mrr, 2)
        );
    }

    public async Task<IReadOnlyList<SuperAdminUserDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var roles = await _userRoleRepository.GetAllAsync(cancellationToken);
        var rolesByUser = roles.GroupBy(r => r.UserId).ToDictionary(g => g.Key, g => g.Select(r => r.Role.ToString().ToLower()).ToList());

        var subs = await _subscriptionRepository.GetAllAsync(cancellationToken);
        var latestSubByUser = subs.GroupBy(s => s.UserId).ToDictionary(g => g.Key, g => g.OrderByDescending(s => s.CreatedAt).First());

        var plans = (await _planRepository.GetAllAsync(cancellationToken)).ToDictionary(p => p.Id);

        return users.OrderByDescending(u => u.CreatedAt).Select(u =>
        {
            var userRoles = rolesByUser.TryGetValue(u.Id, out var rList) ? rList : new List<string> { "user" };
            SubscriptionPlan? plan = null;
            SubscriptionStatus? subStatus = null;
            if (latestSubByUser.TryGetValue(u.Id, out var sub))
            {
                subStatus = sub.Status;
                plans.TryGetValue(sub.PlanId, out plan);
            }

            return new SuperAdminUserDto(
                u.Id, u.Email, u.FullName, u.AvatarUrl, userRoles,
                plan?.DisplayName ?? "Gratuito", subStatus, u.CreatedAt
            );
        }).ToList();
    }

    public async Task<SuperAdminUserDetailDto> GetUserDetailAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (user == null)
        {
            throw new EntityNotFoundException(nameof(User), id);
        }

        var roles = (await _userRoleRepository.FindAsync(r => r.UserId == id, cancellationToken))
            .Select(r => r.Role.ToString().ToLower()).ToList();

        var eventLinks = await _eventUserRepository.FindAsync(eu => eu.UserId == id, cancellationToken);
        var eventIds = eventLinks.Select(eu => eu.EventId).ToHashSet();
        var events = await _eventRepository.FindAsync(e => eventIds.Contains(e.Id), cancellationToken);

        var eventDtos = events.Select(ev =>
        {
            var role = eventLinks.First(l => l.EventId == ev.Id).Role.ToString().ToLower();
            return new EventDto(
                ev.Id, ev.Slug, ev.EventType, ev.EventName, ev.EventDate, ev.EventTime,
                ev.VenueName, ev.VenueAddress, ev.VenueMapsLink, ev.HeroImageUrl, ev.InviteImageUrl,
                ev.WelcomeMessage, ev.GalleryImages, ev.ThemeConfigJson, ev.SettingsJson,
                ev.Status, ev.CreatedBy, role, ev.CreatedAt, ev.UpdatedAt
            );
        }).ToList();

        var subs = await _subscriptionRepository.FindAsync(s => s.UserId == id, cancellationToken);
        var plans = (await _planRepository.GetAllAsync(cancellationToken)).ToDictionary(p => p.Id);

        var subDtos = subs.OrderByDescending(s => s.CreatedAt).Select(s =>
        {
            var plan = plans.TryGetValue(s.PlanId, out var p) ? p : null;
            return new SuperAdminSubscriptionDto(
                s.Id, s.UserId, user.Email,
                plan?.Name ?? "unknown", plan?.DisplayName ?? "Desconhecido",
                s.Status, s.BillingCycle, s.CurrentPeriodEnd, s.CreatedAt
            );
        }).ToList();

        return new SuperAdminUserDetailDto(
            user.Id, user.Email, user.FullName, user.AvatarUrl,
            user.StripeCustomerId, user.TrialEndsAt, roles,
            eventDtos, subDtos, user.CreatedAt
        );
    }

    public async Task<bool> UpdateUserRoleAsync(Guid id, UpdateUserRoleRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (user == null)
        {
            throw new EntityNotFoundException(nameof(User), id);
        }

        if (!Enum.TryParse<AppRole>(request.Role, true, out var newRole))
        {
            throw new DomainException($"Papel inválido: {request.Role}. Valores permitidos: user, admin, superadmin.");
        }

        var existingRoles = await _userRoleRepository.FindAsync(r => r.UserId == id, cancellationToken);
        foreach (var r in existingRoles)
        {
            await _userRoleRepository.DeleteAsync(r, cancellationToken);
        }

        var userRole = new UserRole
        {
            UserId = id,
            Role = newRole
        };
        await _userRoleRepository.AddAsync(userRole, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<IReadOnlyList<SuperAdminEventDto>> GetEventsAsync(CancellationToken cancellationToken = default)
    {
        var events = await _eventRepository.GetAllAsync(cancellationToken);
        var users = (await _userRepository.GetAllAsync(cancellationToken)).ToDictionary(u => u.Id);

        return events.OrderByDescending(e => e.CreatedAt).Select(e =>
        {
            User? owner = null;
            if (e.CreatedBy.HasValue)
            {
                users.TryGetValue(e.CreatedBy.Value, out owner);
            }

            return new SuperAdminEventDto(
                e.Id, e.Slug, e.EventName, e.EventType, e.Status,
                e.EventDate, owner?.Email, owner?.FullName, e.CreatedAt
            );
        }).ToList();
    }

    public async Task<IReadOnlyList<SuperAdminSubscriptionDto>> GetSubscriptionsAsync(CancellationToken cancellationToken = default)
    {
        var subs = await _subscriptionRepository.GetAllAsync(cancellationToken);
        var users = (await _userRepository.GetAllAsync(cancellationToken)).ToDictionary(u => u.Id);
        var plans = (await _planRepository.GetAllAsync(cancellationToken)).ToDictionary(p => p.Id);

        return subs.OrderByDescending(s => s.CreatedAt).Select(s =>
        {
            users.TryGetValue(s.UserId, out var user);
            plans.TryGetValue(s.PlanId, out var plan);

            return new SuperAdminSubscriptionDto(
                s.Id, s.UserId, user?.Email ?? "N/A",
                plan?.Name ?? "unknown", plan?.DisplayName ?? "Desconhecido",
                s.Status, s.BillingCycle, s.CurrentPeriodEnd, s.CreatedAt
            );
        }).ToList();
    }
}
