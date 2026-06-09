namespace CRM.Api.DTOs;

public class EmployeeResponse
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ProfilePicture { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Role { get; set; } = string.Empty;
}

public class CreateEmployeeRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Role { get; set; } = "SalesOfficer";
    public string? PhoneNumber { get; set; }
}

public class UpdateEmployeeRequest
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Role { get; set; } = "SalesOfficer";
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;
}
