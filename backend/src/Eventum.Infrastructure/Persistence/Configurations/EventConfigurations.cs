using Eventum.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eventum.Infrastructure.Persistence.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.ToTable("events");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.Slug).HasColumnName("slug").HasMaxLength(150).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();

        builder.Property(x => x.EventType).HasColumnName("event_type").HasConversion<string>().IsRequired();
        builder.Property(x => x.EventName).HasColumnName("event_name").HasMaxLength(255).IsRequired();
        builder.Property(x => x.EventDate).HasColumnName("event_date");
        builder.Property(x => x.EventTime).HasColumnName("event_time").HasMaxLength(50);
        builder.Property(x => x.VenueName).HasColumnName("venue_name").HasMaxLength(255);
        builder.Property(x => x.VenueAddress).HasColumnName("venue_address");
        builder.Property(x => x.VenueMapsLink).HasColumnName("venue_maps_link");
        builder.Property(x => x.HeroImageUrl).HasColumnName("hero_image_url");
        builder.Property(x => x.InviteImageUrl).HasColumnName("invite_image_url");
        builder.Property(x => x.WelcomeMessage).HasColumnName("welcome_message");
        builder.Property(x => x.GalleryImages).HasColumnName("gallery_images").HasColumnType("text[]");
        builder.Property(x => x.ThemeConfigJson).HasColumnName("theme_config").HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.SettingsJson).HasColumnName("settings").HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().IsRequired();
        builder.Property(x => x.CreatedBy).HasColumnName("created_by");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

        builder.HasOne(x => x.Creator)
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedBy);
    }
}

public class EventUserConfiguration : IEntityTypeConfiguration<EventUser>
{
    public void Configure(EntityTypeBuilder<EventUser> builder)
    {
        builder.ToTable("event_users");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.EventId).HasColumnName("event_id").IsRequired();
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.Role).HasColumnName("role").HasConversion<string>().IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

        builder.HasIndex(x => new { x.EventId, x.UserId }).IsUnique();
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.EventId);
    }
}
