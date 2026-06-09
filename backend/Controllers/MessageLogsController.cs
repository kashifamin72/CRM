using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.Api.Data;
using CRM.Api.DTOs;
using CRM.Api.Models;
using CRM.Api.Services;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessageLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWhatsAppService _whatsAppService;

    public MessageLogsController(ApplicationDbContext context, IWhatsAppService whatsAppService)
    {
        _context = context;
        _whatsAppService = whatsAppService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsSalesOfficer => User.IsInRole("SalesOfficer");

    [HttpGet]
    public async Task<ActionResult<List<MessageLogResponse>>> GetMessageLogs([FromQuery] int? leadId)
    {
        var query = _context.MessageLogs
            .Include(m => m.Lead).Include(m => m.SentBy)
            .AsNoTracking();

        if (IsSalesOfficer)
            query = query.Where(m => m.SentById == UserId);

        if (leadId.HasValue)
            query = query.Where(m => m.LeadId == leadId.Value);

        var logs = await query.OrderByDescending(m => m.SentAt)
            .Select(m => new MessageLogResponse
            {
                Id = m.Id,
                LeadId = m.LeadId,
                LeadTitle = m.Lead.Title,
                ToPhoneNumber = m.ToPhoneNumber,
                MessageBody = m.MessageBody,
                Status = m.Status,
                Response = m.Response,
                SentById = m.SentById,
                SentByName = m.SentBy != null ? $"{m.SentBy.FirstName} {m.SentBy.LastName}" : "",
                SentByPicture = m.SentBy != null ? m.SentBy.ProfilePicture : null,
                SentAt = m.SentAt
            })
            .ToListAsync();

        return Ok(logs);
    }

    [HttpPost("Send")]
    public async Task<ActionResult<MessageLogResponse>> SendMessage([FromBody] SendMessageRequest request)
    {
        var lead = await _context.Leads.FindAsync(request.LeadId);
        if (lead == null) return NotFound("Lead not found");

        if (IsSalesOfficer && lead.CreatedById != UserId && lead.AssignedToId != UserId)
            return Forbid();

        var (success, response) = await _whatsAppService.SendMessageAsync(lead.CustomerPhone, request.MessageBody);
        var status = success ? "Sent" : "Failed";

        var log = new MessageLog
        {
            LeadId = request.LeadId,
            ToPhoneNumber = lead.CustomerPhone,
            MessageBody = request.MessageBody,
            Status = status,
            Response = response,
            SentById = UserId,
            SentAt = DateTime.UtcNow
        };

        _context.MessageLogs.Add(log);
        await _context.SaveChangesAsync();

        var sender = await _context.Users.FindAsync(UserId);
        return Ok(new MessageLogResponse
        {
            Id = log.Id,
            LeadId = log.LeadId,
            LeadTitle = lead.Title,
            ToPhoneNumber = log.ToPhoneNumber,
            MessageBody = log.MessageBody,
            Status = log.Status,
            Response = log.Response,
            SentById = log.SentById,
            SentByName = sender != null ? $"{sender.FirstName} {sender.LastName}" : "",
            SentByPicture = sender?.ProfilePicture,
            SentAt = log.SentAt
        });
    }

    [HttpDelete("clear-all")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> ClearAll()
    {
        var count = await _context.MessageLogs.CountAsync();
        await _context.MessageLogs.ExecuteDeleteAsync();
        return Ok(new { message = $"Deleted {count} message log(s)" });
    }
}

public record SendMessageRequest(int LeadId, string MessageBody);
