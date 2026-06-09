using Microsoft.AspNetCore.Identity;

namespace CRM.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string? ProfilePicture { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
