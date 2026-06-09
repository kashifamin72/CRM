namespace CRM.Api.Models;

public class MessageLog
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public string ToPhoneNumber { get; set; } = string.Empty;
    public string MessageBody { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Response { get; set; }
    public string SentById { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public Lead Lead { get; set; } = null!;
    public ApplicationUser SentBy { get; set; } = null!;
}
