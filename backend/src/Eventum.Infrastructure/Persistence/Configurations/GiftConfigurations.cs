using Eventum.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eventum.Infrastructure.Persistence.Configurations;

public class GiftConfiguration : IEntityTypeConfiguration<Gift>
{
    public void Configure(EntityTypeBuilder<Gift> builder)
    {
        builder.ToTable("gifts");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.EventId).HasColumnName("event_id").IsRequired();
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
        builder.Property(x => x.Description).HasColumnName("description");
        builder.Property(x => x.Value).HasColumnName("value").HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.ImageUrl).HasColumnName("image_url");
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
        builder.Property(x => x.IsFlexibleValue).HasColumnName("is_flexible_value").IsRequired();
        builder.Property(x => x.MinValue).HasColumnName("min_value").HasPrecision(10, 2);
        builder.Property(x => x.ReservedAt).HasColumnName("reserved_at");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

        builder.HasOne(x => x.Event)
            .WithMany(x => x.Gifts)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.EventId);
        builder.HasIndex(x => x.Status);
    }
}

public class GiftPaymentConfiguration : IEntityTypeConfiguration<GiftPayment>
{
    public void Configure(EntityTypeBuilder<GiftPayment> builder)
    {
        builder.ToTable("gift_payments");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.GiftId).HasColumnName("gift_id").IsRequired();
        builder.Property(x => x.EventId).HasColumnName("event_id");
        builder.Property(x => x.GuestName).HasColumnName("guest_name").HasMaxLength(255);
        builder.Property(x => x.Message).HasColumnName("message");
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
        builder.Property(x => x.ConfirmedAt).HasColumnName("confirmed_at");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

        builder.HasOne(x => x.Gift)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.GiftId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Event)
            .WithMany(x => x.GiftPayments)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.GiftId);
        builder.HasIndex(x => x.EventId);
    }
}

public class PixConfigConfiguration : IEntityTypeConfiguration<PixConfig>
{
    public void Configure(EntityTypeBuilder<PixConfig> builder)
    {
        builder.ToTable("pix_config");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.EventId).HasColumnName("event_id").IsRequired();
        builder.HasIndex(x => x.EventId).IsUnique();

        builder.Property(x => x.PixKey).HasColumnName("pix_key").HasMaxLength(255);
        builder.Property(x => x.RecipientName).HasColumnName("recipient_name").HasMaxLength(255);
        builder.Property(x => x.QrCodeUrl).HasColumnName("qr_code_url");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

        builder.HasOne(x => x.Event)
            .WithOne(x => x.PixConfig)
            .HasForeignKey<PixConfig>(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MercadoPagoConnectionConfiguration : IEntityTypeConfiguration<MercadoPagoConnection>
{
    public void Configure(EntityTypeBuilder<MercadoPagoConnection> builder)
    {
        builder.ToTable("mercadopago_connections");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.EventId).HasColumnName("event_id").IsRequired();
        builder.HasIndex(x => x.EventId).IsUnique();

        builder.Property(x => x.MpUserId).HasColumnName("mp_user_id").HasMaxLength(100).IsRequired();
        builder.Property(x => x.MpEmail).HasColumnName("mp_email").HasMaxLength(255);
        builder.Property(x => x.MpPublicKey).HasColumnName("mp_public_key");
        builder.Property(x => x.AccessTokenEncrypted).HasColumnName("access_token_encrypted").IsRequired();
        builder.Property(x => x.RefreshTokenEncrypted).HasColumnName("refresh_token_encrypted").IsRequired();
        builder.Property(x => x.TokenExpiresAt).HasColumnName("token_expires_at").IsRequired();
        builder.Property(x => x.ConnectedAt).HasColumnName("connected_at");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

        builder.HasOne(x => x.Event)
            .WithOne(x => x.MercadoPagoConnection)
            .HasForeignKey<MercadoPagoConnection>(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
