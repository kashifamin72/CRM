using System.ComponentModel.DataAnnotations;
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
    [Required(ErrorMessage = "Title is required")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(5000, ErrorMessage = "Description cannot exceed 5000 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Customer name is required")]
    [MaxLength(200, ErrorMessage = "Customer name cannot exceed 200 characters")]
    public string CustomerName { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(200)]
    public string? CustomerEmail { get; set; }

    [MaxLength(50)]
    public string? CustomerPhone { get; set; }

    [MaxLength(200)]
    public string? ContactPerson { get; set; }

    [MaxLength(100)]
    public string? ContactDesignation { get; set; }

    [Phone]
    [MaxLength(50)]
    public string? ContactMobile { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    public int? CityId { get; set; }

    public LeadStatus Status { get; set; } = LeadStatus.New;

    [Range(0, 1000000000, ErrorMessage = "Estimated value must be between 0 and 1,000,000,000")]
    public decimal? EstimatedValue { get; set; }

    [MaxLength(5000)]
    public string? Notes { get; set; }

    public int? LeadSourceId { get; set; }
    public int? BusinessTypeId { get; set; }
    public DateTime? LeadDate { get; set; }
    public string? AssignedToId { get; set; }
}

public class UpdateLeadRequest
{
    [Required(ErrorMessage = "Title is required")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(5000, ErrorMessage = "Description cannot exceed 5000 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Customer name is required")]
    [MaxLength(200, ErrorMessage = "Customer name cannot exceed 200 characters")]
    public string CustomerName { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(200)]
    public string? CustomerEmail { get; set; }

    [MaxLength(50)]
    public string? CustomerPhone { get; set; }

    [MaxLength(200)]
    public string? ContactPerson { get; set; }

    [MaxLength(100)]
    public string? ContactDesignation { get; set; }

    [Phone]
    [MaxLength(50)]
    public string? ContactMobile { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    public int? CityId { get; set; }

    public LeadStatus Status { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Estimated value must be between 0 and 1,000,000,000")]
    public decimal? EstimatedValue { get; set; }

    [MaxLength(5000)]
    public string? Notes { get; set; }

    public int? LeadSourceId { get; set; }
    public int? BusinessTypeId { get; set; }
    public DateTime? LeadDate { get; set; }
    public string? AssignedToId { get; set; }
}

public class UpdateStatusRequest
{
    [Range(0, 5, ErrorMessage = "Invalid status value")]
    public int Status { get; set; }
}

public class AddFollowUpRequest
{
    [Required(ErrorMessage = "Title is required")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Follow-up date is required")]
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
    [Required(ErrorMessage = "Target user ID is required")]
    public string AssignedToId { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Notes { get; set; }
}
