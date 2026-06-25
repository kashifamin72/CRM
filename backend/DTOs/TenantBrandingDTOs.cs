using System.ComponentModel.DataAnnotations;

namespace CRM.Api.DTOs;

public class TenantBrandingResponse
{
    public string CompanyName { get; set; } = "CRM System";
    public string? Tagline { get; set; }
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SupportEmail { get; set; }
    public string? SupportPhone { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateTenantBrandingRequest
{
    [Required]
    [StringLength(80, MinimumLength = 1)]
    public string CompanyName { get; set; } = string.Empty;

    [StringLength(150)]
    public string? Tagline { get; set; }

    [StringLength(20)]
    public string? PrimaryColor { get; set; }

    [EmailAddress]
    [StringLength(200)]
    public string? SupportEmail { get; set; }

    [StringLength(50)]
    public string? SupportPhone { get; set; }
}
