using Eventum.Application.Auth.Services;
using Eventum.Application.Events.Services;
using Eventum.Application.Finance.Services;
using Eventum.Application.Gifts.Services;
using Eventum.Application.Guests.Services;
using Eventum.Application.Public.Services;
using Eventum.Application.Subscriptions.Services;
using Eventum.Application.SuperAdmin.Services;
using Eventum.Application.Suppliers.Services;
using Eventum.Application.Tables.Services;
using Eventum.Application.Webhooks.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Eventum.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddHttpClient();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<IGuestService, GuestService>();
        services.AddScoped<ITableService, TableService>();
        services.AddScoped<IGiftService, GiftService>();
        services.AddScoped<IFinanceService, FinanceService>();
        services.AddScoped<ISupplierService, SupplierService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<ISuperAdminService, SuperAdminService>();
        services.AddScoped<IPublicService, PublicService>();
        services.AddScoped<IWebhookService, WebhookService>();

        return services;
    }
}
