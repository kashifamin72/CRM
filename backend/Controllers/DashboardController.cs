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
public class DashboardController : BaseApiController
{
    private readonly ApplicationDbContext _db;

    public DashboardController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? assignedTo, CancellationToken ct = default)
    {
        var userId = GetUserId();

        IQueryable<Lead> leadQuery = _db.Leads
            .Include(l => l.LeadSource)
            .Include(l => l.AssignedTo)
            .Include(l => l.CreatedBy);

        if (IsSalesOfficer)
            leadQuery = leadQuery.Where(l => l.AssignedToId == userId || l.CreatedById == userId);

        if (!string.IsNullOrEmpty(assignedTo) && IsAdminOrManager)
            leadQuery = leadQuery.Where(l => l.AssignedToId == assignedTo);

        var allLeads = await leadQuery.ToListAsync(ct);
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var followUpQuery = _db.FollowUps
            .Include(f => f.Lead)
            .Include(f => f.CreatedBy)
            .Where(f => !f.IsCompleted);

        if (IsSalesOfficer)
            followUpQuery = followUpQuery.Where(f => f.CreatedById == userId);

        if (!string.IsNullOrEmpty(assignedTo) && IsAdminOrManager)
        {
            if (assignedTo == "unassigned")
                followUpQuery = followUpQuery.Where(f => f.Lead != null && f.Lead.AssignedToId == null);
            else
                followUpQuery = followUpQuery.Where(f => f.Lead != null && f.Lead.AssignedToId == assignedTo);
        }

        var allFollowUps = await followUpQuery.ToListAsync(ct);

        var overdue = allFollowUps
            .Where(f => f.FollowUpDate.Date < today)
            .OrderBy(f => f.FollowUpDate)
            .Select(f => new FollowUpResponse
            {
                Id = f.Id,
                LeadId = f.LeadId,
                LeadTitle = f.Lead?.Title,
                Title = f.Title,
                Description = f.Description,
                FollowUpDate = f.FollowUpDate,
                IsCompleted = f.IsCompleted,
                IsOverdue = true,
                CreatedById = f.CreatedById,
                CreatedByName = f.CreatedBy != null ? $"{f.CreatedBy.FirstName} {f.CreatedBy.LastName}" : null,
                CreatedByPicture = f.CreatedBy != null ? f.CreatedBy.ProfilePicture : null,
                CreatedAt = f.CreatedAt,
                CompletedAt = f.CompletedAt
            })
            .ToList();

        var todaysFollowUps = allFollowUps
            .Where(f => f.FollowUpDate.Date == today)
            .OrderBy(f => f.FollowUpDate)
            .Select(f => new FollowUpResponse
            {
                Id = f.Id,
                LeadId = f.LeadId,
                LeadTitle = f.Lead?.Title,
                Title = f.Title,
                Description = f.Description,
                FollowUpDate = f.FollowUpDate,
                IsCompleted = f.IsCompleted,
                IsOverdue = false,
                CreatedById = f.CreatedById,
                CreatedByName = f.CreatedBy != null ? $"{f.CreatedBy.FirstName} {f.CreatedBy.LastName}" : null,
                CreatedByPicture = f.CreatedBy != null ? f.CreatedBy.ProfilePicture : null,
                CreatedAt = f.CreatedAt,
                CompletedAt = f.CompletedAt
            })
            .ToList();

        var tomorrowsFollowUps = allFollowUps
            .Where(f => f.FollowUpDate.Date == tomorrow)
            .OrderBy(f => f.FollowUpDate)
            .Select(f => new FollowUpResponse
            {
                Id = f.Id,
                LeadId = f.LeadId,
                LeadTitle = f.Lead?.Title,
                Title = f.Title,
                Description = f.Description,
                FollowUpDate = f.FollowUpDate,
                IsCompleted = f.IsCompleted,
                IsOverdue = false,
                CreatedById = f.CreatedById,
                CreatedByName = f.CreatedBy != null ? $"{f.CreatedBy.FirstName} {f.CreatedBy.LastName}" : null,
                CreatedByPicture = f.CreatedBy != null ? f.CreatedBy.ProfilePicture : null,
                CreatedAt = f.CreatedAt,
                CompletedAt = f.CompletedAt
            })
            .ToList();

        var pipeline = Enum.GetValues<LeadStatus>()
            .Select(s => new PipelineStage
            {
                Status = s,
                Count = allLeads.Count(l => l.Status == s)
            })
            .ToList();

        var sourceBreakdown = allLeads
            .GroupBy(l => l.LeadSource?.Name ?? "Unassigned")
            .Select(g => new SourceBreakdown
            {
                SourceName = g.Key,
                SourceColor = g.First().LeadSource?.Color,
                Count = g.Count(),
                EstValue = g.Where(l => l.EstimatedValue.HasValue).Sum(l => l.EstimatedValue!.Value)
            })
            .OrderByDescending(s => s.Count)
            .ToList();

        var recentLeads = allLeads
            .OrderByDescending(l => l.UpdatedAt)
            .Take(10)
            .Select(l => new LeadResponse
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
            })
            .ToList();

        var openLeadsQuery = _db.Leads
            .Include(l => l.AssignedTo)
            .Include(l => l.LeadSource)
            .Where(l => l.Status != LeadStatus.ClosedWon && l.Status != LeadStatus.ClosedLost);

        if (IsSalesOfficer)
            openLeadsQuery = openLeadsQuery.Where(l => l.AssignedToId == userId || l.CreatedById == userId);

        var openLeads = await openLeadsQuery
            .OrderByDescending(l => l.UpdatedAt)
            .ToListAsync(ct);

        var openLeadsByOfficer = openLeads
            .GroupBy(l => l.AssignedToId ?? "unassigned")
            .Select(g =>
            {
                var firstLead = g.First();
                var officer = firstLead.AssignedTo;
                return new OfficerOpenLeads
                {
                    OfficerId = g.Key == "unassigned" ? null : g.Key,
                    OfficerName = officer != null ? $"{officer.FirstName} {officer.LastName}" : "Unassigned",
                    OfficerPicture = officer?.ProfilePicture,
                    LeadCount = g.Count(),
                    TotalEstimatedValue = g.Where(l => l.EstimatedValue.HasValue).Sum(l => l.EstimatedValue!.Value),
                    Leads = g.Select(l => new OpenLeadItem
                    {
                        Id = l.Id,
                        Title = l.Title,
                        CustomerName = l.CustomerName,
                        CustomerPhone = l.CustomerPhone,
                        Status = l.Status,
                        EstimatedValue = l.EstimatedValue,
                        LeadSourceName = l.LeadSource?.Name,
                        LeadSourceColor = l.LeadSource?.Color,
                        LeadSourceIcon = l.LeadSource?.Icon,
                        UpdatedAt = l.UpdatedAt
                    }).ToList()
                };
            })
            .OrderByDescending(o => o.LeadCount)
            .ToList();

        return Ok(new DashboardResponse
        {
            TotalLeads = allLeads.Count,
            NewLeads = allLeads.Count(l => l.Status == LeadStatus.New),
            ClosedWon = allLeads.Count(l => l.Status == LeadStatus.ClosedWon),
            EstimatedValue = allLeads.Where(l => l.EstimatedValue.HasValue).Sum(l => l.EstimatedValue!.Value),
            Pipeline = pipeline,
            SourceBreakdown = sourceBreakdown,
            TodaysFollowUps = overdue.Concat(todaysFollowUps).ToList(),
            TomorrowsFollowUps = tomorrowsFollowUps,
            RecentLeads = recentLeads,
            OpenLeadsByOfficer = openLeadsByOfficer
        });
    }
}
