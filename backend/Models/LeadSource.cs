namespace CRM.Api.Models;

public class LeadSource
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string Color { get; set; } = "#6366f1";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
}
