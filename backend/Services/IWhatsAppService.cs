namespace CRM.Api.Services;

public interface IWhatsAppService
{
    Task<(bool Success, string Response)> SendMessageAsync(string phone, string message);
}
