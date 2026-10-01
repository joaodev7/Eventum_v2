using System.Text.Json;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Eventum.Application.Webhooks.Services;

public class WebhookService : IWebhookService
{
    private readonly IRepository<WebhookEvent> _webhookRepository;
    private readonly IRepository<Subscription> _subscriptionRepository;
    private readonly IRepository<SubscriptionPlan> _planRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Gift> _giftRepository;
    private readonly IRepository<GiftPayment> _paymentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhookService> _logger;

    public WebhookService(
        IRepository<WebhookEvent> webhookRepository,
        IRepository<Subscription> subscriptionRepository,
        IRepository<SubscriptionPlan> planRepository,
        IRepository<User> userRepository,
        IRepository<Gift> giftRepository,
        IRepository<GiftPayment> paymentRepository,
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        ILogger<WebhookService> logger)
    {
        _webhookRepository = webhookRepository;
        _subscriptionRepository = subscriptionRepository;
        _planRepository = planRepository;
        _userRepository = userRepository;
        _giftRepository = giftRepository;
        _paymentRepository = paymentRepository;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> HandleStripeWebhookAsync(string jsonPayload, string? signatureHeader, CancellationToken cancellationToken = default)
    {
        try
        {
            using var doc = JsonDocument.Parse(jsonPayload);
            var root = doc.RootElement;

            var eventId = root.GetProperty("id").GetString() ?? Guid.NewGuid().ToString();
            var eventType = root.GetProperty("type").GetString() ?? "";

            // 1. Idempotência
            var existing = (await _webhookRepository.FindAsync(w => w.Provider == "stripe" && w.ExternalEventId == eventId, cancellationToken)).FirstOrDefault();
            if (existing != null)
            {
                _logger.LogInformation("Stripe webhook {EventId} já processado anteriormente (idempotente).", eventId);
                return true;
            }

            var webhookLog = new WebhookEvent
            {
                Provider = "stripe",
                ExternalEventId = eventId,
                EventType = eventType,
                Payload = jsonPayload,
                Status = "processing",
                ReceivedAt = DateTime.UtcNow
            };
            await _webhookRepository.AddAsync(webhookLog, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var dataObj = root.GetProperty("data").GetProperty("object");

            switch (eventType)
            {
                case "checkout.session.completed":
                    await HandleStripeCheckoutCompletedAsync(dataObj, cancellationToken);
                    break;

                case "customer.subscription.updated":
                case "customer.subscription.deleted":
                    await HandleStripeSubscriptionUpdatedAsync(dataObj, eventType, cancellationToken);
                    break;

                case "invoice.paid":
                    await HandleStripeInvoicePaidAsync(dataObj, cancellationToken);
                    break;

                case "invoice.payment_failed":
                    await HandleStripeInvoicePaymentFailedAsync(dataObj, cancellationToken);
                    break;
            }

            webhookLog.Status = "processed";
            webhookLog.ProcessedAt = DateTime.UtcNow;
            await _webhookRepository.UpdateAsync(webhookLog, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar Stripe Webhook");
            return false;
        }
    }

    private async Task HandleStripeCheckoutCompletedAsync(JsonElement dataObj, CancellationToken cancellationToken)
    {
        var customerId = dataObj.TryGetProperty("customer", out var c) ? c.GetString() : null;
        var subscriptionId = dataObj.TryGetProperty("subscription", out var s) ? s.GetString() : null;

        if (dataObj.TryGetProperty("metadata", out var meta))
        {
            if (meta.TryGetProperty("user_id", out var uIdProp) && Guid.TryParse(uIdProp.GetString(), out var userId) &&
                meta.TryGetProperty("plan_id", out var pIdProp) && Guid.TryParse(pIdProp.GetString(), out var planId))
            {
                var cycle = meta.TryGetProperty("billing_cycle", out var b) ? b.GetString() ?? "monthly" : "monthly";

                var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
                if (user != null && !string.IsNullOrEmpty(customerId))
                {
                    user.StripeCustomerId = customerId;
                    await _userRepository.UpdateAsync(user, cancellationToken);
                }

                var existingSub = (await _subscriptionRepository.FindAsync(x => x.UserId == userId, cancellationToken)).FirstOrDefault();
                if (existingSub == null)
                {
                    var newSub = new Subscription
                    {
                        UserId = userId,
                        PlanId = planId,
                        StripeCustomerId = customerId,
                        StripeSubscriptionId = subscriptionId,
                        Status = SubscriptionStatus.Active,
                        BillingCycle = cycle,
                        CurrentPeriodStart = DateTime.UtcNow,
                        CurrentPeriodEnd = cycle == "yearly" ? DateTime.UtcNow.AddYears(1) : DateTime.UtcNow.AddMonths(1)
                    };
                    await _subscriptionRepository.AddAsync(newSub, cancellationToken);
                }
                else
                {
                    existingSub.PlanId = planId;
                    existingSub.StripeCustomerId = customerId;
                    existingSub.StripeSubscriptionId = subscriptionId;
                    existingSub.Status = SubscriptionStatus.Active;
                    existingSub.BillingCycle = cycle;
                    existingSub.CurrentPeriodStart = DateTime.UtcNow;
                    existingSub.CurrentPeriodEnd = cycle == "yearly" ? DateTime.UtcNow.AddYears(1) : DateTime.UtcNow.AddMonths(1);
                    existingSub.CancelAtPeriodEnd = false;
                    await _subscriptionRepository.UpdateAsync(existingSub, cancellationToken);
                }
            }
        }
    }

    private async Task HandleStripeSubscriptionUpdatedAsync(JsonElement dataObj, string eventType, CancellationToken cancellationToken)
    {
        var subscriptionId = dataObj.TryGetProperty("id", out var sId) ? sId.GetString() : null;
        if (string.IsNullOrEmpty(subscriptionId)) return;

        var sub = (await _subscriptionRepository.FindAsync(x => x.StripeSubscriptionId == subscriptionId, cancellationToken)).FirstOrDefault();
        if (sub == null) return;

        if (eventType == "customer.subscription.deleted")
        {
            sub.Status = SubscriptionStatus.Canceled;
        }
        else
        {
            var statusStr = dataObj.TryGetProperty("status", out var st) ? st.GetString() : null;
            if (statusStr == "active") sub.Status = SubscriptionStatus.Active;
            else if (statusStr == "past_due") sub.Status = SubscriptionStatus.PastDue;
            else if (statusStr == "canceled") sub.Status = SubscriptionStatus.Canceled;

            if (dataObj.TryGetProperty("cancel_at_period_end", out var cEnd))
            {
                sub.CancelAtPeriodEnd = cEnd.GetBoolean();
            }

            if (dataObj.TryGetProperty("current_period_end", out var pEnd))
            {
                sub.CurrentPeriodEnd = DateTimeOffset.FromUnixTimeSeconds(pEnd.GetInt64()).UtcDateTime;
            }
        }

        await _subscriptionRepository.UpdateAsync(sub, cancellationToken);
    }

    private async Task HandleStripeInvoicePaidAsync(JsonElement dataObj, CancellationToken cancellationToken)
    {
        var subscriptionId = dataObj.TryGetProperty("subscription", out var sId) ? sId.GetString() : null;
        if (string.IsNullOrEmpty(subscriptionId)) return;

        var sub = (await _subscriptionRepository.FindAsync(x => x.StripeSubscriptionId == subscriptionId, cancellationToken)).FirstOrDefault();
        if (sub != null)
        {
            sub.Status = SubscriptionStatus.Active;
            await _subscriptionRepository.UpdateAsync(sub, cancellationToken);
        }
    }

    private async Task HandleStripeInvoicePaymentFailedAsync(JsonElement dataObj, CancellationToken cancellationToken)
    {
        var subscriptionId = dataObj.TryGetProperty("subscription", out var sId) ? sId.GetString() : null;
        if (string.IsNullOrEmpty(subscriptionId)) return;

        var sub = (await _subscriptionRepository.FindAsync(x => x.StripeSubscriptionId == subscriptionId, cancellationToken)).FirstOrDefault();
        if (sub != null)
        {
            sub.Status = SubscriptionStatus.PastDue;
            await _subscriptionRepository.UpdateAsync(sub, cancellationToken);
        }
    }

    public async Task<bool> HandleMercadoPagoWebhookAsync(string jsonPayload, string? xSignature, string? xRequestId, string? topic, string? id, CancellationToken cancellationToken = default)
    {
        try
        {
            using var doc = JsonDocument.Parse(jsonPayload);
            var root = doc.RootElement;

            var action = root.TryGetProperty("action", out var a) ? a.GetString() : null;
            var type = root.TryGetProperty("type", out var t) ? t.GetString() : topic;
            var paymentId = root.TryGetProperty("data", out var d) && d.TryGetProperty("id", out var dId)
                ? dId.GetString()
                : id;

            if (string.IsNullOrEmpty(paymentId))
            {
                return true; // Notificação informativa sem ID de transação
            }

            var externalEventId = $"{type}:{paymentId}:{action}";

            // Idempotência
            var existing = (await _webhookRepository.FindAsync(w => w.Provider == "mercadopago" && w.ExternalEventId == externalEventId, cancellationToken)).FirstOrDefault();
            if (existing != null)
            {
                return true;
            }

            var webhookLog = new WebhookEvent
            {
                Provider = "mercadopago",
                ExternalEventId = externalEventId,
                EventType = type ?? "payment",
                Payload = jsonPayload,
                Status = "processing",
                ReceivedAt = DateTime.UtcNow
            };
            await _webhookRepository.AddAsync(webhookLog, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Processamento do pagamento
            if (type == "payment" || action == "payment.created" || action == "payment.updated")
            {
                // Se payload contiver external_reference direta ou metadata
                if (root.TryGetProperty("external_reference", out var extRef))
                {
                    try
                    {
                        var extJson = extRef.GetString();
                        if (!string.IsNullOrEmpty(extJson))
                        {
                            using var extDoc = JsonDocument.Parse(extJson);
                            var extRoot = extDoc.RootElement;
                            if (extRoot.TryGetProperty("gift_id", out var gIdProp) && Guid.TryParse(gIdProp.GetString(), out var giftId) &&
                                extRoot.TryGetProperty("event_id", out var eIdProp) && Guid.TryParse(eIdProp.GetString(), out var eventId))
                            {
                                var guestName = extRoot.TryGetProperty("guest_name", out var gn) ? gn.GetString() : null;
                                var message = extRoot.TryGetProperty("message", out var msg) ? msg.GetString() : null;

                                var payment = new GiftPayment
                                {
                                    GiftId = giftId,
                                    EventId = eventId,
                                    GuestName = guestName,
                                    Message = message,
                                    Status = "confirmed",
                                    ConfirmedAt = DateTime.UtcNow,
                                    CreatedAt = DateTime.UtcNow
                                };
                                await _paymentRepository.AddAsync(payment, cancellationToken);

                                var gift = await _giftRepository.GetByIdAsync(giftId, cancellationToken);
                                if (gift != null)
                                {
                                    gift.Status = "received";
                                    await _giftRepository.UpdateAsync(gift, cancellationToken);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Não foi possível extrair external_reference do payload MP");
                    }
                }
            }

            webhookLog.Status = "processed";
            webhookLog.ProcessedAt = DateTime.UtcNow;
            await _webhookRepository.UpdateAsync(webhookLog, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar Mercado Pago Webhook");
            return false;
        }
    }
}
