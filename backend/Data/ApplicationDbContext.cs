using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CRM.Api.Models;

namespace CRM.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<LeadSource> LeadSources => Set<LeadSource>();
    public DbSet<BusinessType> BusinessTypes => Set<BusinessType>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<FollowUp> FollowUps => Set<FollowUp>();
    public DbSet<MessageLog> MessageLogs => Set<MessageLog>();
    public DbSet<LeadActivity> LeadActivities => Set<LeadActivity>();
    public DbSet<StatusReason> StatusReasons => Set<StatusReason>();
    public DbSet<TenantSetting> TenantSettings => Set<TenantSetting>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Lead>(e =>
        {
            e.HasOne(l => l.LeadSource).WithMany(s => s.Leads)
                .HasForeignKey(l => l.LeadSourceId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(l => l.BusinessType).WithMany(b => b.Leads)
                .HasForeignKey(l => l.BusinessTypeId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(l => l.CityRef).WithMany()
                .HasForeignKey(l => l.CityId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(l => l.CreatedBy).WithMany()
                .HasForeignKey(l => l.CreatedById).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(l => l.AssignedTo).WithMany()
                .HasForeignKey(l => l.AssignedToId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<City>(e =>
        {
            e.HasIndex(c => c.Name).IsUnique();
        });

        builder.Entity<FollowUp>(e =>
        {
            e.HasOne(f => f.Lead).WithMany(l => l.FollowUps)
                .HasForeignKey(f => f.LeadId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(f => f.CreatedBy).WithMany()
                .HasForeignKey(f => f.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<MessageLog>(e =>
        {
            e.HasOne(m => m.Lead).WithMany(l => l.MessageLogs)
                .HasForeignKey(m => m.LeadId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.SentBy).WithMany()
                .HasForeignKey(m => m.SentById).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<LeadActivity>(e =>
        {
            e.HasOne(a => a.Lead).WithMany(l => l.Activities)
                .HasForeignKey(a => a.LeadId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.PerformedBy).WithMany()
                .HasForeignKey(a => a.PerformedById).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.FromUser).WithMany()
                .HasForeignKey(a => a.FromUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.ToUser).WithMany()
                .HasForeignKey(a => a.ToUserId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<LeadSource>(e =>
        {
            e.HasIndex(s => s.Name).IsUnique();
        });

        builder.Entity<BusinessType>(e =>
        {
            e.HasIndex(b => b.Name).IsUnique();
        });

        builder.Entity<StatusReason>(e =>
        {
            e.HasIndex(s => new { s.Status, s.Reason }).IsUnique();
        });

        builder.Entity<TenantSetting>(e =>
        {
            e.HasOne(t => t.UpdatedBy).WithMany()
                .HasForeignKey(t => t.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });

        SeedData(builder);
    }

    private static void SeedData(ModelBuilder builder)
    {
        builder.Entity<LeadSource>().HasData(
            new LeadSource { Id = 1, Name = "Website", Icon = "bi-globe", Color = "#0ea5e9" },
            new LeadSource { Id = 2, Name = "Reference", Icon = "bi-people", Color = "#8b5cf6" },
            new LeadSource { Id = 3, Name = "Old Client", Icon = "bi-person-check", Color = "#10b981" },
            new LeadSource { Id = 4, Name = "Facebook", Icon = "bi-facebook", Color = "#1877f2" },
            new LeadSource { Id = 5, Name = "Instagram", Icon = "bi-instagram", Color = "#e11d48" },
            new LeadSource { Id = 6, Name = "LinkedIn", Icon = "bi-linkedin", Color = "#0a66c2" },
            new LeadSource { Id = 7, Name = "Google Ads", Icon = "bi-google", Color = "#ea4335" },
            new LeadSource { Id = 8, Name = "Walk-in", Icon = "bi-door-open", Color = "#f59e0b" },
            new LeadSource { Id = 9, Name = "Phone Call", Icon = "bi-telephone", Color = "#14b8a6" },
            new LeadSource { Id = 10, Name = "Email Campaign", Icon = "bi-envelope", Color = "#6366f1" },
            new LeadSource { Id = 11, Name = "Trade Show", Icon = "bi-shop", Color = "#f43f5e" },
            new LeadSource { Id = 12, Name = "Other", Icon = "bi-three-dots", Color = "#64748b" }
        );

        builder.Entity<BusinessType>().HasData(
            new BusinessType { Id = 1, Name = "Manufacturing", Color = "#0ea5e9" },
            new BusinessType { Id = 2, Name = "Retailer", Color = "#10b981" },
            new BusinessType { Id = 3, Name = "Hospitals", Color = "#ef4444" },
            new BusinessType { Id = 4, Name = "Goods Trading", Color = "#f59e0b" },
            new BusinessType { Id = 5, Name = "Pharmaceutical Manufacturing", Color = "#8b5cf6" }
        );

        builder.Entity<City>().HasData(
            new City { Id = 1, Name = "Karachi" },
            new City { Id = 2, Name = "Lahore" },
            new City { Id = 3, Name = "Islamabad" },
            new City { Id = 4, Name = "Rawalpindi" },
            new City { Id = 5, Name = "Faisalabad" },
            new City { Id = 6, Name = "Multan" },
            new City { Id = 7, Name = "Peshawar" },
            new City { Id = 8, Name = "Quetta" },
            new City { Id = 9, Name = "Sialkot" },
            new City { Id = 10, Name = "Gujranwala" },
            new City { Id = 11, Name = "Hyderabad" },
            new City { Id = 12, Name = "Bahawalpur" },
            new City { Id = 13, Name = "Sargodha" },
            new City { Id = 14, Name = "Sukkur" },
            new City { Id = 15, Name = "Larkana" },
            new City { Id = 16, Name = "Sheikhupura" },
            new City { Id = 17, Name = "Rahim Yar Khan" },
            new City { Id = 18, Name = "Jhang" },
            new City { Id = 19, Name = "Dera Ghazi Khan" },
            new City { Id = 20, Name = "Gujrat" },
            new City { Id = 21, Name = "Sahiwal" },
            new City { Id = 22, Name = "Wah Cantonment" },
            new City { Id = 23, Name = "Mardan" },
            new City { Id = 24, Name = "Kasur" },
            new City { Id = 25, Name = "Mingora" },
            new City { Id = 26, Name = "Nawabshah" },
            new City { Id = 27, Name = "Chiniot" },
            new City { Id = 28, Name = "Kotri" },
            new City { Id = 29, Name = "Bannu" },
            new City { Id = 30, Name = "Abbottabad" },
            new City { Id = 31, Name = "Muzaffargarh" },
            new City { Id = 32, Name = "Mirpur Khas" },
            new City { Id = 33, Name = "Turbat" },
            new City { Id = 34, Name = "Jacobabad" },
            new City { Id = 35, Name = "Shikarpur" },
            new City { Id = 36, Name = "Kohat" },
            new City { Id = 37, Name = "Khuzdar" },
            new City { Id = 38, Name = "Dera Ismail Khan" },
            new City { Id = 39, Name = "Charsadda" },
            new City { Id = 40, Name = "Nowshera" }
        );

        // Seed Status Reasons
        builder.Entity<StatusReason>().HasData(
            // Closed Lost reasons (Status = 5)
            new StatusReason { Id = 1, Status = 5, Reason = "Price too high", SortOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 2, Status = 5, Reason = "Chose competitor", SortOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 3, Status = 5, Reason = "No budget/timing", SortOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 4, Status = 5, Reason = "Product doesn't fit", SortOrder = 4, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 5, Status = 5, Reason = "Decision maker unavailable", SortOrder = 5, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 6, Status = 5, Reason = "Other", SortOrder = 6, IsActive = true, CreatedAt = DateTime.UtcNow },
            // Closed Won reasons (Status = 4)
            new StatusReason { Id = 7, Status = 4, Reason = "Good price/value", SortOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 8, Status = 4, Reason = "Best solution fit", SortOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 9, Status = 4, Reason = "Strong relationship", SortOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 10, Status = 4, Reason = "Quick implementation", SortOrder = 4, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 11, Status = 4, Reason = "Good reviews/referral", SortOrder = 5, IsActive = true, CreatedAt = DateTime.UtcNow },
            new StatusReason { Id = 12, Status = 4, Reason = "Other", SortOrder = 6, IsActive = true, CreatedAt = DateTime.UtcNow }
        );
    }
}
