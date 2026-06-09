namespace CRM.Api.DTOs;

public class MessageLogResponse
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public string? LeadTitle { get; set; }
    public string ToPhoneNumber { get; set; } = string.Empty;
    public string MessageBody { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Response { get; set; }
    public string SentById { get; set; } = string.Empty;
    public string? SentByName { get; set; }
    public string? SentByPicture { get; set; }
    public DateTime SentAt { get; set; }
}

public class SendMessageRequest
{
    public int LeadId { get; set; }
    public string MessageBody { get; set; } = string.Empty;
}
