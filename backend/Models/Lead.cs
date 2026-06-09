namespace CRM.Api.Models;

public class Lead
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? ContactDesignation { get; set; }
    public string? ContactMobile { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public int? CityId { get; set; }
    public LeadStatus Status { get; set; } = LeadStatus.New;
    public decimal? EstimatedValue { get; set; }
    public string? Notes { get; set; }
    public int? LeadSourceId { get; set; }
    public int? BusinessTypeId { get; set; }
    public DateTime LeadDate { get; set; } = DateTime.UtcNow;
    public string CreatedById { get; set; } = string.Empty;
    public string? AssignedToId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public LeadSource? LeadSource { get; set; }
    public BusinessType? BusinessType { get; set; }
    public City? CityRef { get; set; }
    public ApplicationUser CreatedBy { get; set; } = null!;
    public ApplicationUser? AssignedTo { get; set; }
    public ICollection<FollowUp> FollowUps { get; set; } = new List<FollowUp>();
    public ICollection<MessageLog> MessageLogs { get; set; } = new List<MessageLog>();
    public ICollection<LeadActivity> Activities { get; set; } = new List<LeadActivity>();
}
