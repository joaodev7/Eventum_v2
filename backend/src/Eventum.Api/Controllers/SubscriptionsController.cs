using Eventum.Application.Subscriptions.DTOs;
using Eventum.Application.Subscriptions.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[Authorize]
public class SubscriptionsController : BaseApiController
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionsController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans(CancellationToken cancellationToken)
    {
        var plans = await _subscriptionService.GetPlansAsync(cancellationToken);
        return Ok(plans);
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentSubscription(CancellationToken cancellationToken)
    {
        var sub = await _subscriptionService.GetCurrentSubscriptionAsync(CurrentUserId, cancellationToken);
        return Ok(sub);
    }

    [HttpPost("checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutSessionRequest request, CancellationToken cancellationToken)
    {
        var response = await _subscriptionService.CreateCheckoutSessionAsync(CurrentUserId, request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("customer-portal")]
    public async Task<IActionResult> CreateCustomerPortal([FromBody] CreateCustomerPortalRequest request, CancellationToken cancellationToken)
    {
        var response = await _subscriptionService.CreateCustomerPortalSessionAsync(CurrentUserId, request, cancellationToken);
        return Ok(response);
    }
}
