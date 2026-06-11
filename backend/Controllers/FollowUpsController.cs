using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.Api.Data;
using CRM.Api.Models;

using Microsoft.AspNetCore.Identity;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowUpsController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public FollowUpsController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet("calendar")]
    public async Task<IActionResult> GetCalendar([FromQuery] string? assignedTo, CancellationToken ct = default)
    {
        var userId = GetUserId();

        var query = _db.FollowUps
            .Include(f => f.Lead)
            .Include(f => f.CreatedBy)
            .AsQueryable();

        if (IsSalesOfficer)
            query = query.Where(f => f.CreatedById == userId);

        if (!string.IsNullOrEmpty(assignedTo) && IsAdminOrManager)
            query = query.Where(f => f.CreatedById == assignedTo);

        var followUps = await query
            .OrderBy(f => f.FollowUpDate)
            .Select(f => new
            {
                f.Id,
                f.LeadId,
                LeadTitle = f.Lead.Title,
                f.Title,
                f.Description,
                f.FollowUpDate,
                f.IsCompleted,
                f.CreatedById,
                CreatedByName = f.CreatedBy != null ? f.CreatedBy.FirstName + " " + f.CreatedBy.LastName : null,
                CreatedByPicture = f.CreatedBy != null ? f.CreatedBy.ProfilePicture : null,
                f.CreatedAt,
                f.CompletedAt
            })
            .ToListAsync(ct);

        return Ok(followUps);
    }

    [HttpGet("officers")]
    public async Task<IActionResult> GetOfficers(CancellationToken ct = default)
    {
        var users = await _userManager.GetUsersInRoleAsync("SalesOfficer");
        var result = users
            .Where(u => u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.ProfilePicture
            })
            .OrderBy(u => u.FirstName)
            .ToList();
        return Ok(result);
    }
}
