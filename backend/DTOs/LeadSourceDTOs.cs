using System.ComponentModel.DataAnnotations;

namespace CRM.Api.DTOs;

public class LeadSourceResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string Color { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int UsageCount { get; set; }
}

public class CreateLeadSourceRequest
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(80, ErrorMessage = "Name cannot exceed 80 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Icon { get; set; }

    [MaxLength(20)]
    public string Color { get; set; } = "#6366f1";
}

public class UpdateLeadSourceRequest
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(80, ErrorMessage = "Name cannot exceed 80 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Icon { get; set; }

    [MaxLength(20)]
    public string Color { get; set; } = "#6366f1";
    public bool IsActive { get; set; } = true;
}
