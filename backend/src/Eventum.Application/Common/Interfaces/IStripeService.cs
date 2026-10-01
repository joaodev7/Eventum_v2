namespace Eventum.Application.Common.Interfaces;

public interface IStripeService
{
    Task<string> CreateCustomerAsync(string email, string? name, CancellationToken cancellationToken = default);
    Task<string> CreateCheckoutSessionAsync(
        string? customerId,
        string userEmail,
        string priceId,
        string successUrl,
        string cancelUrl,
        Dictionary<string, string> metadata,
        CancellationToken cancellationToken = default);
    Task<string> CreateCustomerPortalSessionAsync(string customerId, string returnUrl, CancellationToken cancellationToken = default);
}
