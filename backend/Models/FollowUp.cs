namespace CRM.Api.Models;

public class FollowUp
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime FollowUpDate { get; set; }
    public bool IsCompleted { get; set; }
    public string CreatedById { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public Lead Lead { get; set; } = null!;
    public ApplicationUser CreatedBy { get; set; } = null!;
}
