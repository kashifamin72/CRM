using System.Text.Json;

namespace CRM.Api.Services;

public class WhatsAppService : IWhatsAppService
{
    private readonly HttpClient _httpClient;
    private readonly string _webhookUrl;
    private readonly ILogger<WhatsAppService> _logger;

    public WhatsAppService(HttpClient httpClient, IConfiguration configuration, ILogger<WhatsAppService> logger)
    {
        _httpClient = httpClient;
        _webhookUrl = configuration["WhatsApp:WebhookUrl"] ?? "";
        _logger = logger;
    }

    public async Task<(bool Success, string Response)> SendMessageAsync(string phone, string message)
    {
        try
        {
            var payload = new { chatId = $"{phone}@s.whatsapp.net", text = message };
            var content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(_webhookUrl, content);
            response.EnsureSuccessStatusCode();
            var responseText = await response.Content.ReadAsStringAsync();
            return (true, responseText);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send WhatsApp message to {Phone}", phone);
            return (false, ex.Message);
        }
    }
}
