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
[Authorize(Roles = "Administrator,Manager")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ReportsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? assignedTo,
        [FromQuery] int? sourceId)
    {
        IQueryable<Lead> query = _db.Leads
            .Include(l => l.LeadSource)
            .Include(l => l.BusinessType)
            .Include(l => l.AssignedTo)
            .Include(l => l.CreatedBy);

        if (fromDate.HasValue)
            query = query.Where(l => l.CreatedAt >= DateTime.SpecifyKind(fromDate.Value, DateTimeKind.Utc));

        if (toDate.HasValue)
            query = query.Where(l => l.CreatedAt <= DateTime.SpecifyKind(toDate.Value, DateTimeKind.Utc).AddDays(1));

        if (!string.IsNullOrEmpty(assignedTo))
        {
            if (assignedTo == "unassigned")
                query = query.Where(l => l.AssignedToId == null);
            else
                query = query.Where(l => l.AssignedToId == assignedTo);
        }

        if (sourceId.HasValue)
            query = query.Where(l => l.LeadSourceId == sourceId.Value);

        var leads = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();

        var statusLabels = new Dictionary<LeadStatus, string>
        {
            { LeadStatus.New, "New" },
            { LeadStatus.Contacted, "Contacted" },
            { LeadStatus.Qualified, "Qualified" },
            { LeadStatus.Proposal, "Proposal" },
            { LeadStatus.ClosedWon, "Closed Won" },
            { LeadStatus.ClosedLost, "Closed Lost" }
        };

        var statusDistribution = leads
            .GroupBy(l => l.Status)
            .Select(g => new StatusDistributionItem
            {
                Status = statusLabels.GetValueOrDefault(g.Key, g.Key.ToString()),
                Count = g.Count()
            })
            .ToList();

        var sourceBreakdown = leads
            .Where(l => l.LeadSource != null)
            .GroupBy(l => new { l.LeadSource!.Name, l.LeadSource.Color })
            .Select(g => new SourceBreakdownItem
            {
                SourceName = g.Key.Name,
                SourceColor = g.Key.Color,
                Count = g.Count(),
                EstValue = g.Where(l => l.EstimatedValue.HasValue).Sum(l => l.EstimatedValue!.Value)
            })
            .ToList();

        var leadDtos = leads.Select(l => new LeadResponse
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
            UpdatedAt = l.UpdatedAt
        }).ToList();

        var response = new ReportResponse
        {
            TotalLeads = leads.Count,
            NewLeads = leads.Count(l => l.Status == LeadStatus.New),
            ContactedLeads = leads.Count(l => l.Status == LeadStatus.Contacted),
            QualifiedLeads = leads.Count(l => l.Status == LeadStatus.Qualified),
            ProposalLeads = leads.Count(l => l.Status == LeadStatus.Proposal),
            ClosedWon = leads.Count(l => l.Status == LeadStatus.ClosedWon),
            ClosedLost = leads.Count(l => l.Status == LeadStatus.ClosedLost),
            EstimatedValue = leads.Where(l => l.EstimatedValue.HasValue).Sum(l => l.EstimatedValue!.Value),
            StatusDistribution = statusDistribution,
            SourceBreakdown = sourceBreakdown,
            Leads = leadDtos
        };

        return Ok(response);
    }
}
