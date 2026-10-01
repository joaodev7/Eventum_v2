using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Eventum.Application.Events.DTOs;
using Eventum.Application.Gifts.DTOs;
using Eventum.Application.Guests.DTOs;
using Eventum.Application.Public.DTOs;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;

namespace Eventum.Application.Public.Services;

public class PublicService : IPublicService
{
    private readonly IRepository<Guest> _guestRepository;
    private readonly IRepository<GuestCompanion> _companionRepository;
    private readonly IRepository<Table> _tableRepository;
    private readonly IRepository<Event> _eventRepository;
    private readonly IRepository<Gift> _giftRepository;
    private readonly IRepository<GiftPayment> _paymentRepository;
    private readonly IRepository<PixConfig> _pixConfigRepository;
    private readonly IRepository<MercadoPagoConnection> _mpConnectionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly HttpClient _httpClient;

    public PublicService(
        IRepository<Guest> guestRepository,
        IRepository<GuestCompanion> companionRepository,
        IRepository<Table> tableRepository,
        IRepository<Event> eventRepository,
        IRepository<Gift> giftRepository,
        IRepository<GiftPayment> paymentRepository,
        IRepository<PixConfig> pixConfigRepository,
        IRepository<MercadoPagoConnection> mpConnectionRepository,
        IUnitOfWork unitOfWork,
        HttpClient httpClient)
    {
        _guestRepository = guestRepository;
        _companionRepository = companionRepository;
        _tableRepository = tableRepository;
        _eventRepository = eventRepository;
        _giftRepository = giftRepository;
        _paymentRepository = paymentRepository;
        _pixConfigRepository = pixConfigRepository;
        _mpConnectionRepository = mpConnectionRepository;
        _unitOfWork = unitOfWork;
        _httpClient = httpClient;
    }

    public async Task<PublicInviteResponse> GetInviteByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        var guest = (await _guestRepository.FindAsync(g => g.Token == token, cancellationToken)).FirstOrDefault();
        if (guest == null)
        {
            throw new EntityNotFoundException("Convite", token);
        }

        if (!guest.HasViewed)
        {
            guest.HasViewed = true;
            guest.ViewedAt = DateTime.UtcNow;
            await _guestRepository.UpdateAsync(guest, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var ev = await _eventRepository.GetByIdAsync(guest.EventId, cancellationToken);
        if (ev == null)
        {
            throw new EntityNotFoundException(nameof(Event), guest.EventId);
        }

        string? tableName = null;
        if (guest.TableId.HasValue)
        {
            var table = await _tableRepository.GetByIdAsync(guest.TableId.Value, cancellationToken);
            tableName = table?.Name;
        }

        var companions = await _companionRepository.FindAsync(c => c.GuestId == guest.Id, cancellationToken);
        var compDtos = companions.Select(c => new GuestCompanionDto(c.Id, c.GuestId, c.Name, c.WillAttend)).ToList();

        var guestDto = new PublicInviteGuestDto(
            guest.Id, guest.Name, guest.Status, guest.Companions, tableName, compDtos
        );

        var eventDto = new PublicEventDto(
            ev.Id, ev.Slug, ev.EventType, ev.EventName, ev.EventDate, ev.EventTime,
            ev.VenueName, ev.VenueAddress, ev.VenueMapsLink, ev.HeroImageUrl,
            ev.WelcomeMessage, ev.GalleryImages, ev.ThemeConfigJson, ev.SettingsJson
        );

        return new PublicInviteResponse(guestDto, eventDto);
    }

    public async Task<bool> RespondInviteAsync(string token, RespondInviteRequest request, CancellationToken cancellationToken = default)
    {
        var guest = (await _guestRepository.FindAsync(g => g.Token == token, cancellationToken)).FirstOrDefault();
        if (guest == null)
        {
            throw new EntityNotFoundException("Convite", token);
        }

        guest.Status = request.Status;
        guest.RespondedAt = DateTime.UtcNow;

        var companions = (await _companionRepository.FindAsync(c => c.GuestId == guest.Id, cancellationToken)).ToList();
        var selectedIds = (request.CompanionIds ?? new List<Guid>()).ToHashSet();

        foreach (var comp in companions)
        {
            comp.WillAttend = selectedIds.Contains(comp.Id);
            await _companionRepository.UpdateAsync(comp, cancellationToken);
        }

        guest.Companions = companions.Count(c => c.WillAttend == true);
        await _guestRepository.UpdateAsync(guest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<PublicReconfirmationResponse> GetReconfirmationByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        var guest = (await _guestRepository.FindAsync(g => g.ReconfirmationToken == token, cancellationToken)).FirstOrDefault();
        if (guest == null)
        {
            throw new EntityNotFoundException("Reconfirmação", token);
        }

        var ev = await _eventRepository.GetByIdAsync(guest.EventId, cancellationToken);
        if (ev == null)
        {
            throw new EntityNotFoundException(nameof(Event), guest.EventId);
        }

        var companions = await _companionRepository.FindAsync(c => c.GuestId == guest.Id, cancellationToken);
        var compDtos = companions.Select(c => new GuestCompanionDto(c.Id, c.GuestId, c.Name, c.WillAttend)).ToList();

        var guestDto = new PublicReconfirmationGuestDto(
            guest.Id, guest.Name, guest.Status, guest.SecondConfirmationStatus,
            guest.SecondConfirmationCompanions, compDtos
        );

        var eventDto = new PublicEventDto(
            ev.Id, ev.Slug, ev.EventType, ev.EventName, ev.EventDate, ev.EventTime,
            ev.VenueName, ev.VenueAddress, ev.VenueMapsLink, ev.HeroImageUrl,
            ev.WelcomeMessage, ev.GalleryImages, ev.ThemeConfigJson, ev.SettingsJson
        );

        return new PublicReconfirmationResponse(guestDto, eventDto);
    }

    public async Task<bool> RespondReconfirmationAsync(string token, RespondReconfirmationRequest request, CancellationToken cancellationToken = default)
    {
        var guest = (await _guestRepository.FindAsync(g => g.ReconfirmationToken == token, cancellationToken)).FirstOrDefault();
        if (guest == null)
        {
            throw new EntityNotFoundException("Reconfirmação", token);
        }

        guest.SecondConfirmationStatus = request.Status.ToLower();
        guest.SecondConfirmationRespondedAt = DateTime.UtcNow;

        var companions = (await _companionRepository.FindAsync(c => c.GuestId == guest.Id, cancellationToken)).ToList();
        var selectedIds = (request.CompanionIds ?? new List<Guid>()).ToHashSet();

        foreach (var comp in companions)
        {
            comp.WillAttend = selectedIds.Contains(comp.Id);
            await _companionRepository.UpdateAsync(comp, cancellationToken);
        }

        guest.SecondConfirmationCompanions = companions.Count(c => c.WillAttend == true);
        await _guestRepository.UpdateAsync(guest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<PublicEventDto> GetPublicEventBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var ev = (await _eventRepository.FindAsync(e => e.Slug == slug, cancellationToken)).FirstOrDefault();
        if (ev == null)
        {
            throw new EntityNotFoundException(nameof(Event), slug);
        }

        return new PublicEventDto(
            ev.Id, ev.Slug, ev.EventType, ev.EventName, ev.EventDate, ev.EventTime,
            ev.VenueName, ev.VenueAddress, ev.VenueMapsLink, ev.HeroImageUrl,
            ev.WelcomeMessage, ev.GalleryImages, ev.ThemeConfigJson, ev.SettingsJson
        );
    }

    public async Task<PublicGiftsResponse> GetPublicGiftsBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var ev = (await _eventRepository.FindAsync(e => e.Slug == slug, cancellationToken)).FirstOrDefault();
        if (ev == null)
        {
            throw new EntityNotFoundException(nameof(Event), slug);
        }

        var gifts = await _giftRepository.FindAsync(g => g.EventId == ev.Id, cancellationToken);
        var giftDtos = gifts.OrderBy(g => g.Name).Select(g => new GiftDto(
            g.Id, g.EventId, g.Name, g.Description, g.Value, g.ImageUrl, g.Status,
            g.IsFlexibleValue, g.MinValue, g.ReservedAt, g.CreatedAt, g.UpdatedAt
        )).ToList();

        var pix = (await _pixConfigRepository.FindAsync(p => p.EventId == ev.Id, cancellationToken)).FirstOrDefault();
        var pixDto = pix != null ? new PixConfigDto(pix.Id, pix.EventId, pix.PixKey, pix.RecipientName, pix.QrCodeUrl) : null;

        return new PublicGiftsResponse(giftDtos, pixDto);
    }

    public async Task<bool> ReserveGiftAsync(Guid giftId, CancellationToken cancellationToken = default)
    {
        var gift = await _giftRepository.GetByIdAsync(giftId, cancellationToken);
        if (gift == null)
        {
            throw new EntityNotFoundException(nameof(Gift), giftId);
        }

        gift.Status = "reserved";
        gift.ReservedAt = DateTime.UtcNow;
        await _giftRepository.UpdateAsync(gift, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<GiftPaymentDto> PayPixGiftAsync(Guid giftId, PayPixRequest request, CancellationToken cancellationToken = default)
    {
        var gift = await _giftRepository.GetByIdAsync(giftId, cancellationToken);
        if (gift == null)
        {
            throw new EntityNotFoundException(nameof(Gift), giftId);
        }

        var payment = new GiftPayment
        {
            GiftId = giftId,
            EventId = request.EventId,
            GuestName = request.GuestName.Trim(),
            Message = request.Message?.Trim(),
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        await _paymentRepository.AddAsync(payment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new GiftPaymentDto(
            payment.Id, payment.GiftId, payment.EventId, payment.GuestName,
            payment.Message, payment.Status, payment.ConfirmedAt, payment.CreatedAt,
            gift.Name, gift.Value
        );
    }

    public async Task<MercadoPagoPaymentResult> CreateMercadoPagoPaymentAsync(CreateMercadoPagoPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var connection = (await _mpConnectionRepository.FindAsync(m => m.EventId == request.EventId, cancellationToken)).FirstOrDefault();
        var accessToken = connection?.AccessTokenEncrypted;

        if (string.IsNullOrEmpty(accessToken))
        {
            // Retorna checkout mock para desenvolvimento ou caso o organizador não tenha conectado
            return new MercadoPagoPaymentResult($"pref_mock_{Guid.NewGuid():N}", "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock");
        }

        try
        {
            var preferencePayload = new
            {
                items = new[]
                {
                    new
                    {
                        title = request.GiftName,
                        quantity = 1,
                        currency_id = "BRL",
                        unit_price = request.GiftValue
                    }
                },
                payer = new
                {
                    name = request.GuestName
                },
                metadata = new
                {
                    gift_id = request.GiftId.ToString(),
                    event_id = request.EventId.ToString(),
                    guest_name = request.GuestName,
                    message = request.Message
                },
                external_reference = JsonSerializer.Serialize(new
                {
                    gift_id = request.GiftId,
                    event_id = request.EventId,
                    guest_name = request.GuestName,
                    message = request.Message
                })
            };

            var json = JsonSerializer.Serialize(preferencePayload);
            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.mercadopago.com/checkout/preferences");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var res = await _httpClient.SendAsync(req, cancellationToken);
            if (res.IsSuccessStatusCode)
            {
                var content = await res.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                var id = root.GetProperty("id").GetString() ?? "";
                var initPoint = root.GetProperty("init_point").GetString() ?? "";
                return new MercadoPagoPaymentResult(id, initPoint);
            }
        }
        catch
        {
            // Fallback gracioso
        }

        return new MercadoPagoPaymentResult($"pref_mock_{Guid.NewGuid():N}", "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock");
    }
}
