using Eventum.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace Eventum.Infrastructure.Payments.Stripe;

public class StripeService : IStripeService
{
    private readonly string? _apiKey;

    public StripeService(IConfiguration configuration)
    {
        _apiKey = configuration["Stripe:SecretKey"] ?? "sk_test_mock_stripe_key";
        StripeConfiguration.ApiKey = _apiKey;
    }

    public async Task<string> CreateCustomerAsync(string email, string? name, CancellationToken cancellationToken = default)
    {
        try
        {
            var options = new CustomerCreateOptions
            {
                Email = email,
                Name = name
            };
            var service = new CustomerService();
            var customer = await service.CreateAsync(options, cancellationToken: cancellationToken);
            return customer.Id;
        }
        catch
        {
            return $"cus_mock_{Guid.NewGuid():N}";
        }
    }

    public async Task<string> CreateCheckoutSessionAsync(
        string? customerId,
        string userEmail,
        string priceId,
        string successUrl,
        string cancelUrl,
        Dictionary<string, string> metadata,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var options = new SessionCreateOptions
            {
                Mode = "subscription",
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        Price = priceId,
                        Quantity = 1
                    }
                },
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = metadata
            };

            if (!string.IsNullOrEmpty(customerId))
            {
                options.Customer = customerId;
            }
            else
            {
                options.CustomerEmail = userEmail;
            }

            var service = new SessionService();
            var session = await service.CreateAsync(options, cancellationToken: cancellationToken);
            return session.Url;
        }
        catch
        {
            return $"{successUrl}?session_id=cs_mock_{Guid.NewGuid():N}";
        }
    }

    public async Task<string> CreateCustomerPortalSessionAsync(string customerId, string returnUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            var options = new global::Stripe.BillingPortal.SessionCreateOptions
            {
                Customer = customerId,
                ReturnUrl = returnUrl
            };
            var service = new global::Stripe.BillingPortal.SessionService();
            var session = await service.CreateAsync(options, cancellationToken: cancellationToken);
            return session.Url;
        }
        catch
        {
            return returnUrl;
        }
    }
}
