using System.Text.Json;
using Eventum.Application.Common.Interfaces;
using Eventum.Application.Gifts.DTOs;
using Eventum.Domain.Entities;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Eventum.Application.Gifts.Services;

public class GiftService : IGiftService
{
    private readonly IRepository<Gift> _giftRepository;
    private readonly IRepository<PixConfig> _pixConfigRepository;
    private readonly IRepository<GiftPayment> _paymentRepository;
    private readonly IRepository<MercadoPagoConnection> _mpConnectionRepository;
    private readonly IEventAuthorizationService _authorizationService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public GiftService(
        IRepository<Gift> giftRepository,
        IRepository<PixConfig> pixConfigRepository,
        IRepository<GiftPayment> paymentRepository,
        IRepository<MercadoPagoConnection> mpConnectionRepository,
        IEventAuthorizationService authorizationService,
        IUnitOfWork unitOfWork,
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _giftRepository = giftRepository;
        _pixConfigRepository = pixConfigRepository;
        _paymentRepository = paymentRepository;
        _mpConnectionRepository = mpConnectionRepository;
        _authorizationService = authorizationService;
        _unitOfWork = unitOfWork;
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<IReadOnlyList<GiftDto>> GetGiftsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var gifts = await _giftRepository.FindAsync(g => g.EventId == eventId, cancellationToken);
        return gifts.OrderBy(g => g.Name).Select(g => new GiftDto(
            g.Id, g.EventId, g.Name, g.Description, g.Value, g.ImageUrl, g.Status,
            g.IsFlexibleValue, g.MinValue, g.ReservedAt, g.CreatedAt, g.UpdatedAt
        )).ToList();
    }

    public async Task<GiftDto> GetGiftByIdAsync(Guid eventId, Guid giftId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var gift = (await _giftRepository.FindAsync(g => g.Id == giftId && g.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (gift == null)
        {
            throw new EntityNotFoundException(nameof(Gift), giftId);
        }

        return new GiftDto(
            gift.Id, gift.EventId, gift.Name, gift.Description, gift.Value, gift.ImageUrl,
            gift.Status, gift.IsFlexibleValue, gift.MinValue, gift.ReservedAt, gift.CreatedAt, gift.UpdatedAt
        );
    }

    public async Task<GiftDto> CreateGiftAsync(Guid eventId, Guid userId, CreateGiftRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome do presente é obrigatório.");
        }

        if (request.Value < 0)
        {
            throw new DomainException("O valor do presente não pode ser negativo.");
        }

        var gift = new Gift
        {
            EventId = eventId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Value = request.Value,
            ImageUrl = request.ImageUrl?.Trim(),
            Status = "available",
            IsFlexibleValue = request.IsFlexibleValue,
            MinValue = request.MinValue
        };

        await _giftRepository.AddAsync(gift, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new GiftDto(
            gift.Id, gift.EventId, gift.Name, gift.Description, gift.Value, gift.ImageUrl,
            gift.Status, gift.IsFlexibleValue, gift.MinValue, gift.ReservedAt, gift.CreatedAt, gift.UpdatedAt
        );
    }

    public async Task<GiftDto> UpdateGiftAsync(Guid eventId, Guid giftId, Guid userId, UpdateGiftRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var gift = (await _giftRepository.FindAsync(g => g.Id == giftId && g.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (gift == null)
        {
            throw new EntityNotFoundException(nameof(Gift), giftId);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome do presente é obrigatório.");
        }

        gift.Name = request.Name.Trim();
        gift.Description = request.Description?.Trim();
        gift.Value = request.Value;
        gift.ImageUrl = request.ImageUrl?.Trim();
        gift.Status = request.Status;
        gift.IsFlexibleValue = request.IsFlexibleValue;
        gift.MinValue = request.MinValue;

        await _giftRepository.UpdateAsync(gift, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new GiftDto(
            gift.Id, gift.EventId, gift.Name, gift.Description, gift.Value, gift.ImageUrl,
            gift.Status, gift.IsFlexibleValue, gift.MinValue, gift.ReservedAt, gift.CreatedAt, gift.UpdatedAt
        );
    }

    public async Task<bool> DeleteGiftAsync(Guid eventId, Guid giftId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var gift = (await _giftRepository.FindAsync(g => g.Id == giftId && g.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (gift == null)
        {
            throw new EntityNotFoundException(nameof(Gift), giftId);
        }

        await _giftRepository.DeleteAsync(gift, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<PixConfigDto> GetPixConfigAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var config = (await _pixConfigRepository.FindAsync(p => p.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (config == null)
        {
            return new PixConfigDto(Guid.Empty, eventId, null, null, null);
        }

        return new PixConfigDto(config.Id, config.EventId, config.PixKey, config.RecipientName, config.QrCodeUrl);
    }

    public async Task<PixConfigDto> UpdatePixConfigAsync(Guid eventId, Guid userId, UpdatePixConfigRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var config = (await _pixConfigRepository.FindAsync(p => p.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (config == null)
        {
            config = new PixConfig
            {
                EventId = eventId,
                PixKey = request.PixKey?.Trim(),
                RecipientName = request.RecipientName?.Trim(),
                QrCodeUrl = request.QrCodeUrl?.Trim()
            };
            await _pixConfigRepository.AddAsync(config, cancellationToken);
        }
        else
        {
            config.PixKey = request.PixKey?.Trim();
            config.RecipientName = request.RecipientName?.Trim();
            config.QrCodeUrl = request.QrCodeUrl?.Trim();
            await _pixConfigRepository.UpdateAsync(config, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new PixConfigDto(config.Id, config.EventId, config.PixKey, config.RecipientName, config.QrCodeUrl);
    }

    public async Task<IReadOnlyList<GiftPaymentDto>> GetGiftPaymentsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var payments = await _paymentRepository.FindAsync(p => p.EventId == eventId, cancellationToken);
        var gifts = (await _giftRepository.FindAsync(g => g.EventId == eventId, cancellationToken)).ToDictionary(g => g.Id);

        return payments.OrderByDescending(p => p.CreatedAt).Select(p =>
        {
            var gift = gifts.TryGetValue(p.GiftId, out var g) ? g : null;
            return new GiftPaymentDto(
                p.Id, p.GiftId, p.EventId, p.GuestName, p.Message, p.Status,
                p.ConfirmedAt, p.CreatedAt, gift?.Name, gift?.Value
            );
        }).ToList();
    }

    public async Task<bool> ApprovePaymentAsync(Guid eventId, Guid paymentId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var payment = (await _paymentRepository.FindAsync(p => p.Id == paymentId && p.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (payment == null)
        {
            throw new EntityNotFoundException(nameof(GiftPayment), paymentId);
        }

        payment.Status = "confirmed";
        payment.ConfirmedAt = DateTime.UtcNow;
        await _paymentRepository.UpdateAsync(payment, cancellationToken);

        var gift = await _giftRepository.GetByIdAsync(payment.GiftId, cancellationToken);
        if (gift != null)
        {
            gift.Status = "received";
            await _giftRepository.UpdateAsync(gift, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<MercadoPagoStatusDto> GetMercadoPagoStatusAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var connection = (await _mpConnectionRepository.FindAsync(m => m.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (connection == null)
        {
            return new MercadoPagoStatusDto(false, null, null);
        }

        return new MercadoPagoStatusDto(true, connection.MpEmail, connection.MpPublicKey);
    }

    public async Task<string> GetMercadoPagoOAuthStartUrlAsync(Guid eventId, Guid userId, string redirectUri, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var appId = _configuration["MercadoPago:AppId"] ?? "TEST-APP-ID";
        var state = $"{eventId}:{Guid.NewGuid():N}";

        return $"https://auth.mercadopago.com.br/authorization?client_id={appId}&response_type=code&platform_id=mp&state={state}&redirect_uri={Uri.EscapeDataString(redirectUri)}";
    }

    public async Task<bool> HandleMercadoPagoOAuthCallbackAsync(Guid eventId, string code, string redirectUri, CancellationToken cancellationToken = default)
    {
        var clientSecret = _configuration["MercadoPago:ClientSecret"] ?? "TEST-SECRET";
        var appId = _configuration["MercadoPago:AppId"] ?? "TEST-APP-ID";

        var body = new Dictionary<string, string>
        {
            { "client_secret", clientSecret },
            { "client_id", appId },
            { "grant_type", "authorization_code" },
            { "code", code },
            { "redirect_uri", redirectUri }
        };

        var response = await _httpClient.PostAsync("https://api.mercadopago.com/oauth/token", new FormUrlEncodedContent(body), cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new DomainException("Falha ao autenticar com o Mercado Pago.");
        }

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        var accessToken = root.GetProperty("access_token").GetString() ?? "";
        var refreshToken = root.GetProperty("refresh_token").GetString() ?? "";
        var userId = root.GetProperty("user_id").GetInt64().ToString();
        var publicKey = root.TryGetProperty("public_key", out var pk) ? pk.GetString() : null;
        var expiresIn = root.GetProperty("expires_in").GetInt32();

        var existing = (await _mpConnectionRepository.FindAsync(m => m.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (existing == null)
        {
            existing = new MercadoPagoConnection
            {
                EventId = eventId,
                MpUserId = userId,
                MpPublicKey = publicKey,
                AccessTokenEncrypted = accessToken,
                RefreshTokenEncrypted = refreshToken,
                TokenExpiresAt = DateTime.UtcNow.AddSeconds(expiresIn),
                ConnectedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _mpConnectionRepository.AddAsync(existing, cancellationToken);
        }
        else
        {
            existing.MpUserId = userId;
            existing.MpPublicKey = publicKey;
            existing.AccessTokenEncrypted = accessToken;
            existing.RefreshTokenEncrypted = refreshToken;
            existing.TokenExpiresAt = DateTime.UtcNow.AddSeconds(expiresIn);
            existing.UpdatedAt = DateTime.UtcNow;
            await _mpConnectionRepository.UpdateAsync(existing, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DisconnectMercadoPagoAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var connection = (await _mpConnectionRepository.FindAsync(m => m.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (connection != null)
        {
            await _mpConnectionRepository.DeleteAsync(connection, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
