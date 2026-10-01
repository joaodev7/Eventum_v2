using Eventum.Domain.Entities;
using Eventum.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Eventum.Infrastructure.Persistence.Context;

public class EventumDbContext : DbContext, IUnitOfWork
{
    public EventumDbContext(DbContextOptions<EventumDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<FeatureFlag> FeatureFlags => Set<FeatureFlag>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventUser> EventUsers => Set<EventUser>();
    public DbSet<Table> Tables => Set<Table>();
    public DbSet<Guest> Guests => Set<Guest>();
    public DbSet<GuestCompanion> GuestCompanions => Set<GuestCompanion>();
    public DbSet<Gift> Gifts => Set<Gift>();
    public DbSet<GiftPayment> GiftPayments => Set<GiftPayment>();
    public DbSet<PixConfig> PixConfigs => Set<PixConfig>();
    public DbSet<MercadoPagoConnection> MercadoPagoConnections => Set<MercadoPagoConnection>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<InviteEmail> InviteEmails => Set<InviteEmail>();
    public DbSet<WebhookEvent> WebhookEvents => Set<WebhookEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(EventumDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
