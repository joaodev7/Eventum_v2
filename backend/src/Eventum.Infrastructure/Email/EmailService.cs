using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Eventum.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Eventum.Infrastructure.Email;

public class EmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(HttpClient httpClient, IConfiguration configuration, ILogger<EmailService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string recipient, string subject, string html, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Resend:ApiKey"];
        var from = _configuration["Resend:FromEmail"] ?? "Eventum <onboarding@resend.dev>";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogInformation("[DEVELOPMENT EMAIL] To: {Recipient}, Subject: {Subject}", recipient, subject);
            return;
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                from,
                to = new[] { recipient },
                subject,
                html
            };

            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to send email via Resend API: {Error}", error);
                throw new Exception($"Failed to send email: {error}");
            }

            _logger.LogInformation("Email sent successfully to {Recipient}", recipient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while sending email to {Recipient}", recipient);
            throw;
        }
    }
}
