using System.ComponentModel.DataAnnotations;

namespace CRM.Api.Models;

public class StatusReason
{
    public int Id { get; set; }
    
    [Required]
    public int Status { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Reason { get; set; } = string.Empty;
    
    public int SortOrder { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
