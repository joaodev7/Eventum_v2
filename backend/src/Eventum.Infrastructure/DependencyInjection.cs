using System.Text;
using Eventum.Application.Common.Interfaces;
using Eventum.Domain.Interfaces;
using Eventum.Infrastructure.Authentication;
using Eventum.Infrastructure.Email;
using Eventum.Infrastructure.Payments.Stripe;
using Eventum.Infrastructure.Persistence.Context;
using Eventum.Infrastructure.Persistence.Repositories;
using Eventum.Infrastructure.Services;
using Eventum.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Eventum.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Host=localhost;Port=5432;Database=eventum_db;Username=eventum_user;Password=eventum_password";

        services.AddDbContext<EventumDbContext>(options =>
            options.UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(EventumDbContext).Assembly.FullName)));

        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<EventumDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IEventAuthorizationService, EventAuthorizationService>();
        services.AddScoped<IStorageService, StorageService>();
        services.AddScoped<IStripeService, StripeService>();
        services.AddHttpClient<IEmailService, EmailService>();

        // JWT Authentication
        var secret = configuration["Jwt:Secret"] ?? "EventumSuperSecretKeyForDevelopmentPurposes2026!";
        var issuer = configuration["Jwt:Issuer"] ?? "EventumApi";
        var audience = configuration["Jwt:Audience"] ?? "EventumClient";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        return services;
    }
}
