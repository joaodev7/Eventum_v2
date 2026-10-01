using Eventum.Application.Common.Interfaces;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Eventum.Infrastructure.Persistence.Context;

public static class EventumDbSeeder
{
    public static async Task SeedAsync(EventumDbContext context, IPasswordHasher passwordHasher)
    {
        // 1. Seed Subscription Plans
        if (!await context.SubscriptionPlans.AnyAsync())
        {
            var plans = new List<SubscriptionPlan>
            {
                new()
                {
                    Name = "free",
                    DisplayName = "Gratuito",
                    PriceMonthly = 0m,
                    PriceYearly = 0m,
                    FeaturesJson = "[\"eventos_basicos\",\"lista_convidados_50\"]",
                    LimitsJson = "{\"max_events\":1,\"max_guests\":50,\"max_gallery_images\":5}",
                    PlatformFeePercent = 5.0m,
                    IsActive = true,
                    SortOrder = 0
                },
                new()
                {
                    Name = "essentia",
                    DisplayName = "Essentia",
                    PriceMonthly = 49.00m,
                    PriceYearly = 490.00m,
                    FeaturesJson = "[\"eventos_ilimitados\",\"area_cliente_personalizada\",\"checklist_avancado\",\"lista_convidados\"]",
                    LimitsJson = "{\"max_events\":5,\"max_guests\":250,\"max_gallery_images\":20}",
                    PlatformFeePercent = 4.0m,
                    IsActive = true,
                    SortOrder = 1
                },
                new()
                {
                    Name = "atelier",
                    DisplayName = "Atelier",
                    PriceMonthly = 99.00m,
                    PriceYearly = 990.00m,
                    FeaturesJson = "[\"eventos_ilimitados\",\"area_cliente_personalizada\",\"checklist_avancado\",\"lista_convidados\",\"usuarios_extra\",\"relatorios_financeiros\",\"exportacao_dados\",\"personalizacao_visual\",\"suporte_prioritario\"]",
                    LimitsJson = "{\"max_events\":20,\"max_guests\":1000,\"max_gallery_images\":50}",
                    PlatformFeePercent = 3.0m,
                    IsActive = true,
                    SortOrder = 2
                },
                new()
                {
                    Name = "signature",
                    DisplayName = "Signature",
                    PriceMonthly = 199.00m,
                    PriceYearly = 1990.00m,
                    FeaturesJson = "[\"eventos_ilimitados\",\"area_cliente_personalizada\",\"checklist_avancado\",\"lista_convidados\",\"usuarios_extra\",\"relatorios_financeiros\",\"exportacao_dados\",\"personalizacao_visual\",\"suporte_prioritario\",\"onboarding\",\"consultoria\",\"customizacoes_avancadas\",\"dominio_personalizado\"]",
                    LimitsJson = "{\"max_events\":100,\"max_guests\":5000,\"max_gallery_images\":200}",
                    PlatformFeePercent = 2.0m,
                    IsActive = true,
                    SortOrder = 3
                }
            };

            await context.SubscriptionPlans.AddRangeAsync(plans);
            await context.SaveChangesAsync();
        }

        // 2. Seed Default SuperAdmin if no users exist
        if (!await context.Users.AnyAsync())
        {
            var adminUser = new User
            {
                Email = "admin@eventum.com.br",
                FullName = "Administrador Eventum",
                PasswordHash = passwordHasher.Hash("EventumAdmin2026!"),
            };

            adminUser.UserRoles.Add(new UserRole
            {
                Role = AppRole.Superadmin,
                User = adminUser
            });

            await context.Users.AddAsync(adminUser);
            await context.SaveChangesAsync();
        }
    }
}
