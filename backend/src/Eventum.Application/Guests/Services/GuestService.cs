using Eventum.Application.Common.Interfaces;
using Eventum.Application.Guests.DTOs;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;

namespace Eventum.Application.Guests.Services;

public class GuestService : IGuestService
{
    private readonly IRepository<Guest> _guestRepository;
    private readonly IRepository<GuestCompanion> _companionRepository;
    private readonly IRepository<Table> _tableRepository;
    private readonly IRepository<Event> _eventRepository;
    private readonly IRepository<InviteEmail> _inviteEmailRepository;
    private readonly IEventAuthorizationService _authorizationService;
    private readonly IEmailService _emailService;
    private readonly IUnitOfWork _unitOfWork;

    public GuestService(
        IRepository<Guest> guestRepository,
        IRepository<GuestCompanion> companionRepository,
        IRepository<Table> tableRepository,
        IRepository<Event> eventRepository,
        IRepository<InviteEmail> inviteEmailRepository,
        IEventAuthorizationService authorizationService,
        IEmailService emailService,
        IUnitOfWork unitOfWork)
    {
        _guestRepository = guestRepository;
        _companionRepository = companionRepository;
        _tableRepository = tableRepository;
        _eventRepository = eventRepository;
        _inviteEmailRepository = inviteEmailRepository;
        _authorizationService = authorizationService;
        _emailService = emailService;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<GuestDto>> GetGuestsAsync(
        Guid eventId,
        Guid userId,
        InviteStatus? status = null,
        GuestGroup? group = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var guests = await _guestRepository.FindAsync(g => g.EventId == eventId, cancellationToken);
        var tables = (await _tableRepository.FindAsync(t => t.EventId == eventId, cancellationToken))
            .ToDictionary(t => t.Id, t => t.Name);
        var companions = await _companionRepository.FindAsync(c => c.EventId == eventId, cancellationToken);
        var companionsByGuest = companions.GroupBy(c => c.GuestId).ToDictionary(g => g.Key, g => g.ToList());

        var query = guests.AsEnumerable();

        if (status.HasValue)
        {
            query = query.Where(g => g.Status == status.Value);
        }

        if (group.HasValue)
        {
            query = query.Where(g => g.GuestGroup == group.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(g =>
                g.Name.ToLower().Contains(term) ||
                (g.Email != null && g.Email.ToLower().Contains(term)) ||
                (g.Phone != null && g.Phone.Contains(term)));
        }

        return query.OrderBy(g => g.Name).Select(g =>
        {
            var tableName = g.TableId.HasValue && tables.TryGetValue(g.TableId.Value, out var name) ? name : null;
            var comps = companionsByGuest.TryGetValue(g.Id, out var compList)
                ? compList.Select(c => new GuestCompanionDto(c.Id, c.GuestId, c.Name, c.WillAttend)).ToList()
                : new List<GuestCompanionDto>();

            return new GuestDto(
                g.Id, g.EventId, g.Name, g.Email, g.Phone, g.GuestGroup, g.TableId, tableName,
                g.Token, g.Status, g.Companions, g.HasViewed, g.ViewedAt, g.RespondedAt, g.Notes,
                g.InviteEmailSentAt, g.SecondConfirmationSent, g.SecondConfirmationStatus,
                g.SecondConfirmationRespondedAt, g.SecondConfirmationCompanions, g.ReconfirmationToken,
                comps, g.CreatedAt, g.UpdatedAt
            );
        }).ToList();
    }

    public async Task<GuestMetricsDto> GetMetricsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var guests = (await _guestRepository.FindAsync(g => g.EventId == eventId, cancellationToken)).ToList();
        var companions = (await _companionRepository.FindAsync(c => c.EventId == eventId, cancellationToken)).ToList();

        var totalGuests = guests.Count;
        var totalCompanions = companions.Count;

        var acceptedGuests = guests.Count(g => g.Status == InviteStatus.Accepted);
        var acceptedCompanions = companions.Count(c => c.WillAttend == true);

        var declinedGuests = guests.Count(g => g.Status == InviteStatus.Declined);
        var declinedCompanions = companions.Count(c => c.WillAttend == false);

        var pendingGuests = guests.Count(g => g.Status == InviteStatus.Pending);
        var pendingCompanions = companions.Count(c => c.WillAttend == null);

        var viewedGuestIds = guests.Where(g => g.Status == InviteStatus.Pending && g.HasViewed).Select(g => g.Id).ToHashSet();
        var viewedGuests = viewedGuestIds.Count;
        var viewedCompanions = companions.Count(c => viewedGuestIds.Contains(c.GuestId));

        return new GuestMetricsDto(
            Total: totalGuests + totalCompanions,
            TotalGuests: totalGuests,
            TotalCompanions: totalCompanions,
            Accepted: acceptedGuests + acceptedCompanions,
            AcceptedGuests: acceptedGuests,
            AcceptedCompanions: acceptedCompanions,
            Declined: declinedGuests + declinedCompanions,
            DeclinedGuests: declinedGuests,
            DeclinedCompanions: declinedCompanions,
            Pending: pendingGuests + pendingCompanions,
            PendingGuests: pendingGuests,
            PendingCompanions: pendingCompanions,
            Viewed: viewedGuests + viewedCompanions,
            ViewedGuests: viewedGuests,
            ViewedCompanions: viewedCompanions
        );
    }

    public async Task<GuestDto> GetGuestByIdAsync(Guid eventId, Guid guestId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureHasAccessAsync(eventId, userId, cancellationToken);

        var guest = (await _guestRepository.FindAsync(g => g.Id == guestId && g.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (guest == null)
        {
            throw new EntityNotFoundException(nameof(Guest), guestId);
        }

        string? tableName = null;
        if (guest.TableId.HasValue)
        {
            var table = await _tableRepository.GetByIdAsync(guest.TableId.Value, cancellationToken);
            tableName = table?.Name;
        }

        var companions = await _companionRepository.FindAsync(c => c.GuestId == guest.Id, cancellationToken);
        var compDtos = companions.Select(c => new GuestCompanionDto(c.Id, c.GuestId, c.Name, c.WillAttend)).ToList();

        return new GuestDto(
            guest.Id, guest.EventId, guest.Name, guest.Email, guest.Phone, guest.GuestGroup,
            guest.TableId, tableName, guest.Token, guest.Status, guest.Companions, guest.HasViewed,
            guest.ViewedAt, guest.RespondedAt, guest.Notes, guest.InviteEmailSentAt,
            guest.SecondConfirmationSent, guest.SecondConfirmationStatus, guest.SecondConfirmationRespondedAt,
            guest.SecondConfirmationCompanions, guest.ReconfirmationToken, compDtos,
            guest.CreatedAt, guest.UpdatedAt
        );
    }

    public async Task<GuestDto> CreateGuestAsync(Guid eventId, Guid userId, CreateGuestRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome do convidado é obrigatório.");
        }

        if (request.TableId.HasValue)
        {
            var table = (await _tableRepository.FindAsync(t => t.Id == request.TableId.Value && t.EventId == eventId, cancellationToken)).FirstOrDefault();
            if (table == null)
            {
                throw new DomainException("Mesa informada não pertence ao evento.");
            }
        }

        var guest = new Guest
        {
            EventId = eventId,
            Name = request.Name.Trim(),
            Email = request.Email?.Trim().ToLowerInvariant(),
            Phone = request.Phone?.Trim(),
            GuestGroup = request.GuestGroup,
            TableId = request.TableId,
            Notes = request.Notes,
            Token = Guid.NewGuid().ToString(),
            Status = InviteStatus.Pending,
            Companions = request.Companions?.Count ?? 0
        };

        await _guestRepository.AddAsync(guest, cancellationToken);

        var compDtos = new List<GuestCompanionDto>();
        if (request.Companions != null && request.Companions.Any())
        {
            foreach (var compReq in request.Companions)
            {
                if (string.IsNullOrWhiteSpace(compReq.Name)) continue;
                var comp = new GuestCompanion
                {
                    EventId = eventId,
                    GuestId = guest.Id,
                    Name = compReq.Name.Trim(),
                    WillAttend = null
                };
                await _companionRepository.AddAsync(comp, cancellationToken);
                compDtos.Add(new GuestCompanionDto(comp.Id, comp.GuestId, comp.Name, comp.WillAttend));
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        string? tableName = null;
        if (guest.TableId.HasValue)
        {
            var table = await _tableRepository.GetByIdAsync(guest.TableId.Value, cancellationToken);
            tableName = table?.Name;
        }

        return new GuestDto(
            guest.Id, guest.EventId, guest.Name, guest.Email, guest.Phone, guest.GuestGroup,
            guest.TableId, tableName, guest.Token, guest.Status, guest.Companions, guest.HasViewed,
            guest.ViewedAt, guest.RespondedAt, guest.Notes, guest.InviteEmailSentAt,
            guest.SecondConfirmationSent, guest.SecondConfirmationStatus, guest.SecondConfirmationRespondedAt,
            guest.SecondConfirmationCompanions, guest.ReconfirmationToken, compDtos,
            guest.CreatedAt, guest.UpdatedAt
        );
    }

    public async Task<GuestDto> UpdateGuestAsync(Guid eventId, Guid guestId, Guid userId, UpdateGuestRequest request, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var guest = (await _guestRepository.FindAsync(g => g.Id == guestId && g.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (guest == null)
        {
            throw new EntityNotFoundException(nameof(Guest), guestId);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException("O nome do convidado é obrigatório.");
        }

        if (request.TableId.HasValue && request.TableId != guest.TableId)
        {
            var table = (await _tableRepository.FindAsync(t => t.Id == request.TableId.Value && t.EventId == eventId, cancellationToken)).FirstOrDefault();
            if (table == null)
            {
                throw new DomainException("Mesa informada não pertence ao evento.");
            }
        }

        guest.Name = request.Name.Trim();
        guest.Email = request.Email?.Trim().ToLowerInvariant();
        guest.Phone = request.Phone?.Trim();
        guest.GuestGroup = request.GuestGroup;
        guest.TableId = request.TableId;
        guest.Status = request.Status;
        guest.Notes = request.Notes;

        // Atualizar lista de acompanhantes se enviada
        var compDtos = new List<GuestCompanionDto>();
        if (request.Companions != null)
        {
            var existingCompanions = await _companionRepository.FindAsync(c => c.GuestId == guestId, cancellationToken);
            foreach (var oldComp in existingCompanions)
            {
                await _companionRepository.DeleteAsync(oldComp, cancellationToken);
            }

            foreach (var compReq in request.Companions)
            {
                if (string.IsNullOrWhiteSpace(compReq.Name)) continue;
                var comp = new GuestCompanion
                {
                    EventId = eventId,
                    GuestId = guest.Id,
                    Name = compReq.Name.Trim(),
                    WillAttend = null
                };
                await _companionRepository.AddAsync(comp, cancellationToken);
                compDtos.Add(new GuestCompanionDto(comp.Id, comp.GuestId, comp.Name, comp.WillAttend));
            }

            guest.Companions = compDtos.Count;
        }
        else
        {
            var existingCompanions = await _companionRepository.FindAsync(c => c.GuestId == guestId, cancellationToken);
            compDtos = existingCompanions.Select(c => new GuestCompanionDto(c.Id, c.GuestId, c.Name, c.WillAttend)).ToList();
        }

        await _guestRepository.UpdateAsync(guest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        string? tableName = null;
        if (guest.TableId.HasValue)
        {
            var table = await _tableRepository.GetByIdAsync(guest.TableId.Value, cancellationToken);
            tableName = table?.Name;
        }

        return new GuestDto(
            guest.Id, guest.EventId, guest.Name, guest.Email, guest.Phone, guest.GuestGroup,
            guest.TableId, tableName, guest.Token, guest.Status, guest.Companions, guest.HasViewed,
            guest.ViewedAt, guest.RespondedAt, guest.Notes, guest.InviteEmailSentAt,
            guest.SecondConfirmationSent, guest.SecondConfirmationStatus, guest.SecondConfirmationRespondedAt,
            guest.SecondConfirmationCompanions, guest.ReconfirmationToken, compDtos,
            guest.CreatedAt, guest.UpdatedAt
        );
    }

    public async Task<bool> DeleteGuestAsync(Guid eventId, Guid guestId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var guest = (await _guestRepository.FindAsync(g => g.Id == guestId && g.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (guest == null)
        {
            throw new EntityNotFoundException(nameof(Guest), guestId);
        }

        var companions = await _companionRepository.FindAsync(c => c.GuestId == guestId, cancellationToken);
        foreach (var c in companions)
        {
            await _companionRepository.DeleteAsync(c, cancellationToken);
        }

        await _guestRepository.DeleteAsync(guest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<string> RegenerateTokenAsync(Guid eventId, Guid guestId, Guid userId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var guest = (await _guestRepository.FindAsync(g => g.Id == guestId && g.EventId == eventId, cancellationToken)).FirstOrDefault();
        if (guest == null)
        {
            throw new EntityNotFoundException(nameof(Guest), guestId);
        }

        guest.Token = Guid.NewGuid().ToString();
        await _guestRepository.UpdateAsync(guest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return guest.Token;
    }

    public async Task<int> SendEmailsAsync(Guid eventId, Guid userId, List<Guid> guestIds, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var ev = await _eventRepository.GetByIdAsync(eventId, cancellationToken);
        if (ev == null)
        {
            throw new EntityNotFoundException(nameof(Event), eventId);
        }

        var guests = await _guestRepository.FindAsync(g => g.EventId == eventId && guestIds.Contains(g.Id), cancellationToken);
        var sentCount = 0;

        foreach (var guest in guests)
        {
            if (string.IsNullOrWhiteSpace(guest.Email)) continue;

            var inviteUrl = $"https://eventum.com.br/convite/{guest.Token}";
            var html = $@"
                <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;'>
                    <h2>Você foi convidado para: {ev.EventName}!</h2>
                    <p>Olá, {guest.Name}!</p>
                    <p>{ev.WelcomeMessage ?? "Estamos muito felizes em compartilhar este momento especial com você!"}</p>
                    <p><strong>Data:</strong> {ev.EventDate:dd/MM/yyyy} às {ev.EventTime}</p>
                    <p><strong>Local:</strong> {ev.VenueName} - {ev.VenueAddress}</p>
                    <div style='margin-top: 30px;'>
                        <a href='{inviteUrl}' style='background-color: #2D5A5A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                            Confirmar Presença (RSVP)
                        </a>
                    </div>
                </div>";

            try
            {
                await _emailService.SendAsync(guest.Email, $"Convite: {ev.EventName}", html, cancellationToken);
                guest.InviteEmailSentAt = DateTime.UtcNow;

                var log = new InviteEmail
                {
                    EventId = eventId,
                    GuestId = guest.Id,
                    Status = "sent",
                    SentAt = DateTime.UtcNow
                };
                await _inviteEmailRepository.AddAsync(log, cancellationToken);
                await _guestRepository.UpdateAsync(guest, cancellationToken);
                sentCount++;
            }
            catch (Exception ex)
            {
                var log = new InviteEmail
                {
                    EventId = eventId,
                    GuestId = guest.Id,
                    Status = "failed",
                    ErrorMessage = ex.Message,
                    SentAt = DateTime.UtcNow
                };
                await _inviteEmailRepository.AddAsync(log, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return sentCount;
    }

    public async Task<int> SendSecondConfirmationAsync(Guid eventId, Guid userId, bool all, Guid? guestId, CancellationToken cancellationToken = default)
    {
        await _authorizationService.EnsureCanManageAsync(eventId, userId, cancellationToken);

        var ev = await _eventRepository.GetByIdAsync(eventId, cancellationToken);
        if (ev == null)
        {
            throw new EntityNotFoundException(nameof(Event), eventId);
        }

        List<Guest> targetGuests;
        if (all)
        {
            targetGuests = (await _guestRepository.FindAsync(g => g.EventId == eventId && g.Status == InviteStatus.Accepted, cancellationToken)).ToList();
        }
        else if (guestId.HasValue)
        {
            var g = (await _guestRepository.FindAsync(x => x.Id == guestId.Value && x.EventId == eventId, cancellationToken)).FirstOrDefault();
            targetGuests = g != null ? new List<Guest> { g } : new List<Guest>();
        }
        else
        {
            return 0;
        }

        var sentCount = 0;
        foreach (var guest in targetGuests)
        {
            if (string.IsNullOrWhiteSpace(guest.Email)) continue;

            guest.ReconfirmationToken = Guid.NewGuid().ToString();
            guest.SecondConfirmationSent = true;

            var reconfUrl = $"https://eventum.com.br/reconfirmar/{guest.ReconfirmationToken}";
            var html = $@"
                <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;'>
                    <h2>Segunda Confirmação de Presença: {ev.EventName}</h2>
                    <p>Olá, {guest.Name}!</p>
                    <p>O grande dia está se aproximando! Para organizarmos os detalhes finais do buffet e assentos, pedimos por gentileza que reconfirme sua presença e de seus acompanhantes.</p>
                    <div style='margin-top: 30px;'>
                        <a href='{reconfUrl}' style='background-color: #C17F59; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                            Reconfirmar Minha Presença
                        </a>
                    </div>
                </div>";

            try
            {
                await _emailService.SendAsync(guest.Email, $"Reconfirmação de Presença: {ev.EventName}", html, cancellationToken);
                var log = new InviteEmail
                {
                    EventId = eventId,
                    GuestId = guest.Id,
                    Status = "sent",
                    SentAt = DateTime.UtcNow
                };
                await _inviteEmailRepository.AddAsync(log, cancellationToken);
                await _guestRepository.UpdateAsync(guest, cancellationToken);
                sentCount++;
            }
            catch (Exception ex)
            {
                var log = new InviteEmail
                {
                    EventId = eventId,
                    GuestId = guest.Id,
                    Status = "failed",
                    ErrorMessage = ex.Message,
                    SentAt = DateTime.UtcNow
                };
                await _inviteEmailRepository.AddAsync(log, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return sentCount;
    }
}
