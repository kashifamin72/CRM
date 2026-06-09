namespace CRM.Api.Models;

public enum LeadActivityType
{
    Created = 0,
    StatusChanged = 1,
    Forwarded = 2,
    Updated = 3,
}

public class LeadActivity
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public LeadActivityType Type { get; set; }
    public LeadStatus? FromStatus { get; set; }
    public LeadStatus? ToStatus { get; set; }
    public string? FromUserId { get; set; }
    public string? ToUserId { get; set; }
    public string PerformedById { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Lead Lead { get; set; } = null!;
    public ApplicationUser PerformedBy { get; set; } = null!;
    public ApplicationUser? FromUser { get; set; }
    public ApplicationUser? ToUser { get; set; }
}
