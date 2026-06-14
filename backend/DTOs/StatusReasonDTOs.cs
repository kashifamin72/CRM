using System.ComponentModel.DataAnnotations;

namespace CRM.Api.DTOs;

public class StatusReasonResponse
{
    public int Id { get; set; }
    public int Status { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateStatusReasonRequest
{
    [Required(ErrorMessage = "Status is required")]
    [Range(4, 5, ErrorMessage = "Status must be ClosedWon (4) or ClosedLost (5)")]
    public int Status { get; set; }

    [Required(ErrorMessage = "Reason is required")]
    [MaxLength(100, ErrorMessage = "Reason cannot exceed 100 characters")]
    public string Reason { get; set; } = string.Empty;

    public int SortOrder { get; set; } = 0;
}

public class UpdateStatusReasonRequest
{
    [Required(ErrorMessage = "Reason is required")]
    [MaxLength(100, ErrorMessage = "Reason cannot exceed 100 characters")]
    public string Reason { get; set; } = string.Empty;

    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

public class UpdateStatusWithReasonRequest
{
    [Required(ErrorMessage = "Status is required")]
    [Range(0, 5, ErrorMessage = "Invalid status value")]
    public int Status { get; set; }

    public string? Reason { get; set; }

    [MaxLength(2000, ErrorMessage = "Remark cannot exceed 2000 characters")]
    public string? Remark { get; set; }
}
