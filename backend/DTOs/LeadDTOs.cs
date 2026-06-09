using CRM.Api.Models;

namespace CRM.Api.DTOs;

public class LeadResponse
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
    public string? CityName { get; set; }
    public LeadStatus Status { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? Notes { get; set; }
    public int? LeadSourceId { get; set; }
    public string? LeadSourceName { get; set; }
    public string? LeadSourceColor { get; set; }
    public string? LeadSourceIcon { get; set; }
    public int? BusinessTypeId { get; set; }
    public string? BusinessTypeName { get; set; }
    public string? BusinessTypeColor { get; set; }
    public DateTime LeadDate { get; set; }
    public string CreatedById { get; set; } = string.Empty;
    public string? CreatedByName { get; set; }
    public string? CreatedByPicture { get; set; }
    public string? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public string? AssignedToPicture { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int FollowUpCount { get; set; }
}

public class CreateLeadRequest
{
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
    public DateTime? LeadDate { get; set; }
    public string? AssignedToId { get; set; }
}

public class UpdateLeadRequest
{
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
    public LeadStatus Status { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? Notes { get; set; }
    public int? LeadSourceId { get; set; }
    public int? BusinessTypeId { get; set; }
    public DateTime? LeadDate { get; set; }
    public string? AssignedToId { get; set; }
}

public class UpdateStatusRequest
{
    public int Status { get; set; }
}

public class AddFollowUpRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime FollowUpDate { get; set; }
}

public class FollowUpResponse
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public string? LeadTitle { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime FollowUpDate { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsOverdue { get; set; }
    public string CreatedById { get; set; } = string.Empty;
    public string? CreatedByName { get; set; }
    public string? CreatedByPicture { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class LeadActivityResponse
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public LeadActivityType Type { get; set; }
    public LeadStatus? FromStatus { get; set; }
    public LeadStatus? ToStatus { get; set; }
    public string? FromUserId { get; set; }
    public string? FromUserName { get; set; }
    public string? FromUserPicture { get; set; }
    public string? ToUserId { get; set; }
    public string? ToUserName { get; set; }
    public string? ToUserPicture { get; set; }
    public string PerformedById { get; set; } = string.Empty;
    public string PerformedByName { get; set; } = string.Empty;
    public string? PerformedByPicture { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ForwardLeadRequest
{
    public string AssignedToId { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
