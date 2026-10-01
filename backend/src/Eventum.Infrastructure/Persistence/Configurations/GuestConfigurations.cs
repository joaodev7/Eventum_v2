using Eventum.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eventum.Infrastructure.Persistence.Configurations;

public class TableConfiguration : IEntityTypeConfiguration<Table>
{
    public void Configure(EntityTypeBuilder<Table> builder)
    {
        builder.ToTable("tables");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.EventId).HasColumnName("event_id").IsRequired();
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Capacity).HasColumnName("capacity").IsRequired();
        builder.Property(x => x.Description).HasColumnName("description");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

        builder.HasOne(x => x.Event)
            .WithMany(x => x.Tables)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.EventId);
    }
}

public class GuestConfiguration : IEntityTypeConfiguration<Guest>
{
    public void Configure(EntityTypeBuilder<Guest> builder)
    {
        builder.ToTable("guests");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.EventId).HasColumnName("event_id").IsRequired();
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
        builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(255);
        builder.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(50);
        builder.Property(x => x.GuestGroup).HasColumnName("guest_group").HasConversion<string>().IsRequired();
        builder.Property(x => x.TableId).HasColumnName("table_id");
        builder.Property(x => x.Token).HasColumnName("token").HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.Token).IsUnique();

        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().IsRequired();
        builder.Property(x => x.Companions).HasColumnName("companions").IsRequired();
        builder.Property(x => x.HasViewed).HasColumnName("has_viewed").IsRequired();
        builder.Property(x => x.ViewedAt).HasColumnName("viewed_at");
        builder.Property(x => x.RespondedAt).HasColumnName("responded_at");
        builder.Property(x => x.Notes).HasColumnName("notes");
        builder.Property(x => x.InviteEmailSentAt).HasColumnName("invite_email_sent_at");

        // Reconfirmation
        builder.Property(x => x.SecondConfirmationSent).HasColumnName("second_confirmation_sent").IsRequired();
        builder.Property(x => x.SecondConfirmationStatus).HasColumnName("second_confirmation_status").HasMaxLength(50);
        builder.Property(x => x.SecondConfirmationRespondedAt).HasColumnName("second_confirmation_responded_at");
        builder.Property(x => x.SecondConfirmationCompanions).HasColumnName("second_confirmation_companions").IsRequired();
        builder.Property(x => x.ReconfirmationToken).HasColumnName("reconfirmation_token").HasMaxLength(100);
        builder.HasIndex(x => x.ReconfirmationToken).IsUnique();

        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

        builder.HasOne(x => x.Event)
            .WithMany(x => x.Guests)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Table)
            .WithMany(x => x.Guests)
            .HasForeignKey(x => x.TableId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.EventId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.TableId);
    }
}

public class GuestCompanionConfiguration : IEntityTypeConfiguration<GuestCompanion>
{
    public void Configure(EntityTypeBuilder<GuestCompanion> builder)
    {
        builder.ToTable("guest_companions");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.EventId).HasColumnName("event_id").IsRequired();
        builder.Property(x => x.GuestId).HasColumnName("guest_id").IsRequired();
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
        builder.Property(x => x.WillAttend).HasColumnName("will_attend");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

        builder.HasOne(x => x.Event)
            .WithMany(x => x.Companions)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Guest)
            .WithMany(x => x.CompanionsList)
            .HasForeignKey(x => x.GuestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.EventId);
        builder.HasIndex(x => x.GuestId);
    }
}

public class InviteEmailConfiguration : IEntityTypeConfiguration<InviteEmail>
{
    public void Configure(EntityTypeBuilder<InviteEmail> builder)
    {
        builder.ToTable("invite_emails");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.EventId).HasColumnName("event_id").IsRequired();
        builder.Property(x => x.GuestId).HasColumnName("guest_id").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
        builder.Property(x => x.ResendId).HasColumnName("resend_id").HasMaxLength(100);
        builder.Property(x => x.ErrorMessage).HasColumnName("error_message");
        builder.Property(x => x.SentAt).HasColumnName("sent_at").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

        builder.HasOne(x => x.Event)
            .WithMany(x => x.InviteEmails)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Guest)
            .WithMany(x => x.InviteEmails)
            .HasForeignKey(x => x.GuestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.EventId);
        builder.HasIndex(x => x.GuestId);
    }
}
