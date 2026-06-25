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
public class LeadSourcesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public LeadSourcesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sources = await _db.LeadSources
            .OrderBy(s => s.Name)
            .Select(s => new LeadSourceResponse
            {
                Id = s.Id,
                Name = s.Name,
                Icon = s.Icon,
                Color = s.Color,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt,
                UsageCount = s.Leads.Count
            })
            .ToListAsync();

        return Ok(sources);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateLeadSourceRequest request)
    {
        var exists = await _db.LeadSources.AnyAsync(s =>
            s.Name.ToLower() == request.Name.ToLower());
        if (exists)
            return Conflict(new { message = "Source name already exists" });

        var source = new LeadSource
        {
            Name = request.Name,
            Icon = request.Icon,
            Color = request.Color,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.LeadSources.Add(source);
        await _db.SaveChangesAsync();

        return Created($"/api/leadsources/{source.Id}", new LeadSourceResponse
        {
            Id = source.Id,
            Name = source.Name,
            Icon = source.Icon,
            Color = source.Color,
            IsActive = source.IsActive,
            CreatedAt = source.CreatedAt,
            UsageCount = 0
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLeadSourceRequest request)
    {
        var source = await _db.LeadSources.FindAsync(id);
        if (source == null) return NotFound();

        var nameExists = await _db.LeadSources.AnyAsync(s =>
            s.Name.ToLower() == request.Name.ToLower() && s.Id != id);
        if (nameExists)
            return Conflict(new { message = "Source name already exists" });

        source.Name = request.Name;
        source.Icon = request.Icon;
        source.Color = request.Color;
        source.IsActive = request.IsActive;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Source updated" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var source = await _db.LeadSources.Include(s => s.Leads).FirstOrDefaultAsync(s => s.Id == id);
        if (source == null) return NotFound();

        if (source.Leads.Any())
        {
            source.IsActive = false;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Source deactivated (has leads)" });
        }

        _db.LeadSources.Remove(source);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Source deleted" });
    }
}
