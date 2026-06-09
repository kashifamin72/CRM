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
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string Color { get; set; } = "#6366f1";
}

public class UpdateLeadSourceRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string Color { get; set; } = "#6366f1";
    public bool IsActive { get; set; } = true;
}
