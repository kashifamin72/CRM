namespace CRM.Api.DTOs;

public class BusinessTypeResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";
    public bool IsActive { get; set; } = true;
    public int UsageCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBusinessTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
}

public class UpdateBusinessTypeRequest
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";
    public bool IsActive { get; set; } = true;
}
