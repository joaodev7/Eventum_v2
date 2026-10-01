using Eventum.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eventum.Infrastructure.Persistence.Configurations;

public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> builder)
    {
        builder.ToTable("subscription_plans");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(50).IsRequired();
        builder.HasIndex(x => x.Name).IsUnique();

        builder.Property(x => x.DisplayName).HasColumnName("display_name").HasMaxLength(100).IsRequired();
        builder.Property(x => x.PriceMonthly).HasColumnName("price_monthly").HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.PriceYearly).HasColumnName("price_yearly").HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.StripePriceIdMonthly).HasColumnName("stripe_price_id_monthly").HasMaxLength(100);
        builder.Property(x => x.StripePriceIdYearly).HasColumnName("stripe_price_id_yearly").HasMaxLength(100);
        builder.Property(x => x.FeaturesJson).HasColumnName("features").HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.LimitsJson).HasColumnName("limits").HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.PlatformFeePercent).HasColumnName("platform_fee_percent").HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(x => x.SortOrder).HasColumnName("sort_order").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
    }
}

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.ToTable("subscriptions");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.PlanId).HasColumnName("plan_id").IsRequired();
        builder.Property(x => x.StripeCustomerId).HasColumnName("stripe_customer_id").HasMaxLength(100);
        builder.Property(x => x.StripeSubscriptionId).HasColumnName("stripe_subscription_id").HasMaxLength(100);
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().IsRequired();
        builder.Property(x => x.BillingCycle).HasColumnName("billing_cycle").HasMaxLength(20).IsRequired();
        builder.Property(x => x.CurrentPeriodStart).HasColumnName("current_period_start");
        builder.Property(x => x.CurrentPeriodEnd).HasColumnName("current_period_end");
        builder.Property(x => x.CancelAtPeriodEnd).HasColumnName("cancel_at_period_end").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

        builder.HasOne(x => x.Plan)
            .WithMany(x => x.Subscriptions)
            .HasForeignKey(x => x.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Status);
    }
}

public class FeatureFlagConfiguration : IEntityTypeConfiguration<FeatureFlag>
{
    public void Configure(EntityTypeBuilder<FeatureFlag> builder)
    {
        builder.ToTable("feature_flags");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.FeatureKey).HasColumnName("feature_key").HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.FeatureKey).IsUnique();

        builder.Property(x => x.DisplayName).HasColumnName("display_name").HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasColumnName("description");
        builder.Property(x => x.MinPlan).HasColumnName("min_plan").HasMaxLength(50).IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
    }
}

public class WebhookEventConfiguration : IEntityTypeConfiguration<WebhookEvent>
{
    public void Configure(EntityTypeBuilder<WebhookEvent> builder)
    {
        builder.ToTable("webhook_events");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.Provider).HasColumnName("provider").HasMaxLength(50).IsRequired();
        builder.Property(x => x.ExternalEventId).HasColumnName("external_event_id").HasMaxLength(255).IsRequired();
        builder.HasIndex(x => new { x.Provider, x.ExternalEventId }).IsUnique();

        builder.Property(x => x.EventType).HasColumnName("event_type").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Payload).HasColumnName("payload").IsRequired();
        builder.Property(x => x.ReceivedAt).HasColumnName("received_at").IsRequired();
        builder.Property(x => x.ProcessedAt).HasColumnName("processed_at");
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
        builder.Property(x => x.ErrorMessage).HasColumnName("error_message");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
    }
}
