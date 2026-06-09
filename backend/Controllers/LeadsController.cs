using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.Api.Data;
using CRM.Api.Models;
using CRM.Api.DTOs;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public LeadsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] LeadStatus? status,
        [FromQuery] string? search,
        [FromQuery] string? assignedTo,
        [FromQuery] int? sourceId,
        [FromQuery] int? businessTypeId,
        [FromQuery] string? winLostFilter)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        IQueryable<Lead> query = _db.Leads
            .Include(l => l.LeadSource)
            .Include(l => l.BusinessType)
            .Include(l => l.CityRef)
            .Include(l => l.AssignedTo)
            .Include(l => l.CreatedBy)
            .Include(l => l.FollowUps);

        if (role == "SalesOfficer")
            query = query.Where(l => l.AssignedToId == userId || l.CreatedById == userId);

        if (status.HasValue)
            query = query.Where(l => l.Status == status.Value);

        if (sourceId.HasValue)
            query = query.Where(l => l.LeadSourceId == sourceId.Value);

        if (businessTypeId.HasValue)
            query = query.Where(l => l.BusinessTypeId == businessTypeId.Value);

        if (!string.IsNullOrEmpty(assignedTo))
        {
            if (assignedTo == "unassigned")
                query = query.Where(l => l.AssignedToId == null);
            else
                query = query.Where(l => l.AssignedToId == assignedTo);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(l =>
                l.Title.ToLower().Contains(s) ||
                l.CustomerName.ToLower().Contains(s) ||
                l.CustomerEmail.ToLower().Contains(s));
        }

        // Win/Lost filter — only affects leads with status ClosedWon or ClosedLost
        if (!string.IsNullOrEmpty(winLostFilter))
        {
            var now = DateTime.UtcNow;
            switch (winLostFilter.ToLower())
            {
                case "last30":
                    var cutoff30 = now.AddDays(-30);
                    query = query.Where(l =>
                        (l.Status == LeadStatus.ClosedWon || l.Status == LeadStatus.ClosedLost)
                        && l.UpdatedAt >= cutoff30);
                    break;
                case "lastmonth":
                    var firstOfLastMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-1);
                    var firstOfThisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                    query = query.Where(l =>
                        (l.Status == LeadStatus.ClosedWon || l.Status == LeadStatus.ClosedLost)
                        && l.UpdatedAt >= firstOfLastMonth && l.UpdatedAt < firstOfThisMonth);
                    break;
                case "exclude":
                    query = query.Where(l => l.Status != LeadStatus.ClosedWon && l.Status != LeadStatus.ClosedLost);
                    break;
                case "all":
                default:
                    // No win/lost filter
                    break;
            }
        }

        var leads = await query.OrderByDescending(l => l.LeadDate).ToListAsync();
        return Ok(leads.Select(MapToLeadResponse));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var lead = await _db.Leads
            .Include(l => l.LeadSource)
            .Include(l => l.BusinessType)
            .Include(l => l.CityRef)
            .Include(l => l.AssignedTo)
            .Include(l => l.CreatedBy)
            .Include(l => l.FollowUps).ThenInclude(f => f.CreatedBy)
            .Include(l => l.MessageLogs).ThenInclude(m => m.SentBy)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lead == null) return NotFound();
        if (!CanAccessLead(lead)) return Forbid();

        return Ok(MapToLeadResponse(lead));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeadRequest request)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        // Auto-assign to creator for SalesOfficer
        var assignedToId = request.AssignedToId;
        if (role == "SalesOfficer")
            assignedToId = userId;

        var lead = new Lead
        {
            Title = request.Title,
            Description = request.Description,
            CustomerName = request.CustomerName,
            CustomerEmail = request.CustomerEmail,
            CustomerPhone = request.CustomerPhone,
            ContactPerson = request.ContactPerson,
            ContactDesignation = request.ContactDesignation,
            ContactMobile = request.ContactMobile,
            Address = request.Address,
            City = request.City,
            CityId = request.CityId,
            Status = request.Status,
            EstimatedValue = request.EstimatedValue,
            Notes = request.Notes,
            LeadSourceId = request.LeadSourceId,
            BusinessTypeId = request.BusinessTypeId,
            LeadDate = request.LeadDate ?? DateTime.UtcNow,
            AssignedToId = assignedToId,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();

        // Log "Created" activity
        _db.LeadActivities.Add(new LeadActivity
        {
            LeadId = lead.Id,
            Type = LeadActivityType.Created,
            ToStatus = lead.Status,
            FromUserId = null,
            ToUserId = lead.AssignedToId,
            PerformedById = userId,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        var created = await _db.Leads
            .Include(l => l.LeadSource)
            .Include(l => l.BusinessType)
            .Include(l => l.CityRef)
            .Include(l => l.AssignedTo)
            .Include(l => l.CreatedBy)
            .Include(l => l.FollowUps)
            .FirstAsync(l => l.Id == lead.Id);

        return Created($"/api/leads/{lead.Id}", MapToLeadResponse(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLeadRequest request)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();
        if (!CanAccessLead(lead)) return Forbid();

        lead.Title = request.Title;
        lead.Description = request.Description;
        lead.CustomerName = request.CustomerName;
        lead.CustomerEmail = request.CustomerEmail;
        lead.CustomerPhone = request.CustomerPhone;
        lead.ContactPerson = request.ContactPerson;
        lead.ContactDesignation = request.ContactDesignation;
        lead.ContactMobile = request.ContactMobile;
        lead.Address = request.Address;
        lead.City = request.City;
        lead.CityId = request.CityId;
        lead.Status = request.Status;
        lead.EstimatedValue = request.EstimatedValue;
        lead.Notes = request.Notes;
        lead.LeadSourceId = request.LeadSourceId;
        lead.BusinessTypeId = request.BusinessTypeId;
        if (request.LeadDate.HasValue)
            lead.LeadDate = request.LeadDate.Value;
        lead.AssignedToId = request.AssignedToId;
        lead.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Lead updated" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();

        _db.Leads.Remove(lead);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Lead deleted" });
    }

    [HttpPost("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var userId = GetUserId();
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();
        if (!CanAccessLead(lead)) return Forbid();

        var fromStatus = lead.Status;
        var toStatus = (LeadStatus)request.Status;
        lead.Status = toStatus;
        lead.UpdatedAt = DateTime.UtcNow;

        if (fromStatus != toStatus)
        {
            _db.LeadActivities.Add(new LeadActivity
            {
                LeadId = lead.Id,
                Type = LeadActivityType.StatusChanged,
                FromStatus = fromStatus,
                ToStatus = toStatus,
                PerformedById = userId,
                CreatedAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Status updated", status = lead.Status });
    }

    [HttpPost("{id}/forward")]
    [Authorize(Roles = "Administrator,Manager,SalesOfficer")]
    public async Task<IActionResult> Forward(int id, [FromBody] ForwardLeadRequest request)
    {
        var userId = GetUserId();
        var lead = await _db.Leads
            .Include(l => l.AssignedTo)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();

        // SalesOfficer may only forward leads they currently own
        var role = GetUserRole();
        if (role == "SalesOfficer" && lead.AssignedToId != userId)
            return Forbid();

        // Verify target user exists and is a SalesOfficer
        var newAssignee = await _db.Users.FindAsync(request.AssignedToId);
        if (newAssignee == null) return BadRequest(new { message = "Target user not found" });
        if (!await _db.UserRoles.AnyAsync(ur => ur.UserId == request.AssignedToId && ur.RoleId ==
            _db.Roles.First(r => r.Name == "SalesOfficer").Id))
            return BadRequest(new { message = "Target user is not a Sales Officer" });

        if (lead.AssignedToId == request.AssignedToId)
            return BadRequest(new { message = "Lead is already assigned to this user" });

        var fromUserId = lead.AssignedToId;
        lead.AssignedToId = request.AssignedToId;
        lead.UpdatedAt = DateTime.UtcNow;

        _db.LeadActivities.Add(new LeadActivity
        {
            LeadId = lead.Id,
            Type = LeadActivityType.Forwarded,
            FromUserId = fromUserId,
            ToUserId = request.AssignedToId,
            PerformedById = userId,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync();
        return Ok(new { message = "Lead forwarded", assignedToId = request.AssignedToId });
    }

    [HttpGet("{id}/activities")]
    public async Task<IActionResult> GetActivities(int id)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();
        if (!CanAccessLead(lead)) return Forbid();

        var activities = await _db.LeadActivities
            .Where(a => a.LeadId == id)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new LeadActivityResponse
            {
                Id = a.Id,
                LeadId = a.LeadId,
                Type = a.Type,
                FromStatus = a.FromStatus,
                ToStatus = a.ToStatus.HasValue ? (LeadStatus?)a.ToStatus.Value : null,
                FromUserId = a.FromUserId,
                FromUserName = a.FromUser != null ? a.FromUser.FirstName + " " + a.FromUser.LastName : null,
                FromUserPicture = a.FromUser != null ? a.FromUser.ProfilePicture : null,
                ToUserId = a.ToUserId,
                ToUserName = a.ToUser != null ? a.ToUser.FirstName + " " + a.ToUser.LastName : null,
                ToUserPicture = a.ToUser != null ? a.ToUser.ProfilePicture : null,
                PerformedById = a.PerformedById,
                PerformedByName = a.PerformedBy.FirstName + " " + a.PerformedBy.LastName,
                PerformedByPicture = a.PerformedBy.ProfilePicture,
                Notes = a.Notes,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(activities);
    }

    [HttpGet("{id}/followups")]
    public async Task<IActionResult> GetFollowUps(int id)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();
        if (!CanAccessLead(lead)) return Forbid();

        var followUps = await _db.FollowUps
            .Where(f => f.LeadId == id)
            .OrderByDescending(f => f.FollowUpDate)
            .Select(f => new
            {
                f.Id,
                f.Title,
                f.Description,
                f.FollowUpDate,
                f.IsCompleted,
                f.CompletedAt,
                f.CreatedAt,
                CreatedByName = f.CreatedBy.FirstName + " " + f.CreatedBy.LastName,
                CreatedByPicture = f.CreatedBy.ProfilePicture
            })
            .ToListAsync();

        return Ok(followUps);
    }

    [HttpPost("{id}/followups")]
    public async Task<IActionResult> AddFollowUp(int id, [FromBody] AddFollowUpRequest request)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();
        if (!CanAccessLead(lead)) return Forbid();

        var followUp = new FollowUp
        {
            LeadId = id,
            Title = request.Title,
            Description = request.Description,
            FollowUpDate = DateTime.SpecifyKind(request.FollowUpDate, DateTimeKind.Utc),
            CreatedById = GetUserId(),
            CreatedAt = DateTime.UtcNow
        };

        _db.FollowUps.Add(followUp);
        await _db.SaveChangesAsync();

        return Ok(new { followUp.Id, followUp.Title, followUp.FollowUpDate });
    }

    [HttpPut("followups/{id}/complete")]
    public async Task<IActionResult> CompleteFollowUp(int id)
    {
        var followUp = await _db.FollowUps.Include(f => f.Lead).FirstOrDefaultAsync(f => f.Id == id);
        if (followUp == null) return NotFound();
        if (!CanAccessLead(followUp.Lead)) return Forbid();

        followUp.IsCompleted = true;
        followUp.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Follow-up completed" });
    }

    [HttpDelete("followups/{id}")]
    public async Task<IActionResult> DeleteFollowUp(int id)
    {
        var followUp = await _db.FollowUps.Include(f => f.Lead).FirstOrDefaultAsync(f => f.Id == id);
        if (followUp == null) return NotFound();
        if (!CanAccessLead(followUp.Lead)) return Forbid();

        _db.FollowUps.Remove(followUp);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Follow-up deleted" });
    }

    private bool CanAccessLead(Lead lead)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        return role == "Administrator" || role == "Manager"
            || lead.AssignedToId == userId || lead.CreatedById == userId;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    private string GetUserRole() =>
        User.FindFirstValue(ClaimTypes.Role) ?? "";

    private static LeadResponse MapToLeadResponse(Lead l) => new()
    {
        Id = l.Id,
        Title = l.Title,
        Description = l.Description,
        CustomerName = l.CustomerName,
        CustomerEmail = l.CustomerEmail,
        CustomerPhone = l.CustomerPhone,
        ContactPerson = l.ContactPerson,
        ContactDesignation = l.ContactDesignation,
        ContactMobile = l.ContactMobile,
        Address = l.Address,
        City = l.City,
        CityId = l.CityId,
        CityName = l.CityRef?.Name,
        Status = l.Status,
        EstimatedValue = l.EstimatedValue,
        Notes = l.Notes,
        LeadSourceId = l.LeadSourceId,
        LeadSourceName = l.LeadSource?.Name,
        LeadSourceColor = l.LeadSource?.Color,
        LeadSourceIcon = l.LeadSource?.Icon,
        BusinessTypeId = l.BusinessTypeId,
        BusinessTypeName = l.BusinessType?.Name,
        BusinessTypeColor = l.BusinessType?.Color,
        LeadDate = l.LeadDate,
        CreatedById = l.CreatedById,
        CreatedByName = l.CreatedBy != null ? $"{l.CreatedBy.FirstName} {l.CreatedBy.LastName}" : null,
        CreatedByPicture = l.CreatedBy?.ProfilePicture,
        AssignedToId = l.AssignedToId,
        AssignedToName = l.AssignedTo != null ? $"{l.AssignedTo.FirstName} {l.AssignedTo.LastName}" : null,
        AssignedToPicture = l.AssignedTo?.ProfilePicture,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt,
        FollowUpCount = l.FollowUps?.Count ?? 0
    };
}
