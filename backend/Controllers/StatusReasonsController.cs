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
public class StatusReasonsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public StatusReasonsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetReasons([FromQuery] int? status)
    {
        var query = _db.StatusReasons
            .Where(s => s.IsActive);

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        var reasons = await query
            .OrderBy(s => s.SortOrder)
            .Select(s => new StatusReasonResponse
            {
                Id = s.Id,
                Status = s.Status,
                Reason = s.Reason,
                SortOrder = s.SortOrder,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        return Ok(reasons);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] CreateStatusReasonRequest request)
    {
        var exists = await _db.StatusReasons.AnyAsync(s =>
            s.Status == request.Status &&
            s.Reason.ToLower() == request.Reason.ToLower());

        if (exists)
            return Conflict(new { message = "Reason already exists for this status" });

        var reason = new StatusReason
        {
            Status = request.Status,
            Reason = request.Reason,
            SortOrder = request.SortOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.StatusReasons.Add(reason);
        await _db.SaveChangesAsync();

        return Created($"/api/statusreasons/{reason.Id}", new StatusReasonResponse
        {
            Id = reason.Id,
            Status = reason.Status,
            Reason = reason.Reason,
            SortOrder = reason.SortOrder,
            IsActive = reason.IsActive,
            CreatedAt = reason.CreatedAt
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateStatusReasonRequest request)
    {
        var reason = await _db.StatusReasons.FindAsync(id);
        if (reason == null) return NotFound();

        var exists = await _db.StatusReasons.AnyAsync(s =>
            s.Status == reason.Status &&
            s.Reason.ToLower() == request.Reason.ToLower() &&
            s.Id != id);

        if (exists)
            return Conflict(new { message = "Reason already exists for this status" });

        reason.Reason = request.Reason;
        reason.SortOrder = request.SortOrder;
        reason.IsActive = request.IsActive;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Reason updated" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var reason = await _db.StatusReasons.FindAsync(id);
        if (reason == null) return NotFound();

        // Soft delete - just mark as inactive
        reason.IsActive = false;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Reason deleted" });
    }

    [HttpPut("{id}/reorder")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Reorder(int id, [FromBody] ReorderRequest request)
    {
        var reason = await _db.StatusReasons.FindAsync(id);
        if (reason == null) return NotFound();

        reason.SortOrder = request.SortOrder;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Reason reordered" });
    }
}

public class ReorderRequest
{
    public int SortOrder { get; set; }
}
