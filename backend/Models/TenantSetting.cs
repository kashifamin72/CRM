namespace CRM.Api.Models;

public class TenantSetting
{
    public int Id { get; set; } = 1;
    public string CompanyName { get; set; } = "CRM System";
    public string? Tagline { get; set; } = "Customer Relationship Management";
    public string? LogoPath { get; set; }
    public string? PrimaryColor { get; set; } = "#2563eb";
    public string? SupportEmail { get; set; }
    public string? SupportPhone { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedById { get; set; }

    public ApplicationUser? UpdatedBy { get; set; }
}
