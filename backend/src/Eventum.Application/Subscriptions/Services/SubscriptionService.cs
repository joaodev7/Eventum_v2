using Eventum.Application.Common.Interfaces;
using Eventum.Application.Subscriptions.DTOs;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;

namespace Eventum.Application.Subscriptions.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly IRepository<SubscriptionPlan> _planRepository;
    private readonly IRepository<Subscription> _subscriptionRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IStripeService _stripeService;
    private readonly IUnitOfWork _unitOfWork;

    public SubscriptionService(
        IRepository<SubscriptionPlan> planRepository,
        IRepository<Subscription> subscriptionRepository,
        IRepository<User> userRepository,
        IStripeService stripeService,
        IUnitOfWork unitOfWork)
    {
        _planRepository = planRepository;
        _subscriptionRepository = subscriptionRepository;
        _userRepository = userRepository;
        _stripeService = stripeService;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<SubscriptionPlanDto>> GetPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _planRepository.FindAsync(p => p.IsActive, cancellationToken);
        return plans.OrderBy(p => p.SortOrder).Select(p => new SubscriptionPlanDto(
            p.Id, p.Name, p.DisplayName, p.PriceMonthly, p.PriceYearly,
            p.StripePriceIdMonthly, p.StripePriceIdYearly, p.FeaturesJson, p.LimitsJson,
            p.PlatformFeePercent, p.IsActive, p.SortOrder
        )).ToList();
    }

    public async Task<CurrentSubscriptionDto?> GetCurrentSubscriptionAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var subs = await _subscriptionRepository.FindAsync(s => s.UserId == userId, cancellationToken);
        var activeSub = subs.OrderByDescending(s => s.CreatedAt).FirstOrDefault();
        if (activeSub == null)
        {
            return null;
        }

        var plan = await _planRepository.GetByIdAsync(activeSub.PlanId, cancellationToken);
        return new CurrentSubscriptionDto(
            activeSub.Id,
            activeSub.PlanId,
            plan?.Name ?? "free",
            plan?.DisplayName ?? "Gratuito",
            activeSub.Status,
            activeSub.BillingCycle,
            activeSub.CurrentPeriodStart,
            activeSub.CurrentPeriodEnd,
            activeSub.CancelAtPeriodEnd
        );
    }

    public async Task<SessionResponseDto> CreateCheckoutSessionAsync(Guid userId, CreateCheckoutSessionRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new EntityNotFoundException(nameof(User), userId);
        }

        var plan = await _planRepository.GetByIdAsync(request.PlanId, cancellationToken);
        if (plan == null)
        {
            throw new EntityNotFoundException(nameof(SubscriptionPlan), request.PlanId);
        }

        var priceId = request.BillingCycle.ToLower() == "yearly"
            ? plan.StripePriceIdYearly
            : plan.StripePriceIdMonthly;

        if (string.IsNullOrWhiteSpace(priceId))
        {
            priceId = $"price_mock_{plan.Name}_{request.BillingCycle}";
        }

        var successUrl = request.SuccessUrl ?? "https://eventum.com.br/admin/settings?session_id={CHECKOUT_SESSION_ID}";
        var cancelUrl = request.CancelUrl ?? "https://eventum.com.br/pricing";

        var metadata = new Dictionary<string, string>
        {
            { "user_id", userId.ToString() },
            { "plan_id", plan.Id.ToString() },
            { "plan_name", plan.Name },
            { "billing_cycle", request.BillingCycle }
        };

        var checkoutUrl = await _stripeService.CreateCheckoutSessionAsync(
            user.StripeCustomerId,
            user.Email,
            priceId,
            successUrl,
            cancelUrl,
            metadata,
            cancellationToken
        );

        return new SessionResponseDto(checkoutUrl);
    }

    public async Task<SessionResponseDto> CreateCustomerPortalSessionAsync(Guid userId, CreateCustomerPortalRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new EntityNotFoundException(nameof(User), userId);
        }

        if (string.IsNullOrWhiteSpace(user.StripeCustomerId))
        {
            var customerId = await _stripeService.CreateCustomerAsync(user.Email, user.FullName, cancellationToken);
            user.StripeCustomerId = customerId;
            await _userRepository.UpdateAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var returnUrl = request.ReturnUrl ?? "https://eventum.com.br/admin/settings";
        var portalUrl = await _stripeService.CreateCustomerPortalSessionAsync(user.StripeCustomerId, returnUrl, cancellationToken);

        return new SessionResponseDto(portalUrl);
    }
}
