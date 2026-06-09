using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.Api.Data;
using CRM.Api.DTOs;
using CRM.Api.Models;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BusinessTypesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public BusinessTypesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly)
    {
        var query = _db.BusinessTypes.AsQueryable();
        if (activeOnly == true)
            query = query.Where(b => b.IsActive);

        var items = await query
            .OrderBy(b => b.Name)
            .Select(b => new BusinessTypeResponse
            {
                Id = b.Id,
                Name = b.Name,
                Color = b.Color,
                IsActive = b.IsActive,
                UsageCount = _db.Leads.Count(l => l.BusinessTypeId == b.Id),
                CreatedAt = b.CreatedAt,
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateBusinessTypeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Name is required" });

        var name = request.Name.Trim();
        var existing = await _db.BusinessTypes.AnyAsync(b => b.Name.ToLower() == name.ToLower());
        if (existing)
            return BadRequest(new { message = "A business type with this name already exists" });

        var bt = new BusinessType
        {
            Name = name,
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#6366f1" : request.Color,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        _db.BusinessTypes.Add(bt);
        await _db.SaveChangesAsync();

        return Ok(new BusinessTypeResponse
        {
            Id = bt.Id,
            Name = bt.Name,
            Color = bt.Color,
            IsActive = bt.IsActive,
            UsageCount = 0,
            CreatedAt = bt.CreatedAt,
        });
    }

    [HttpPut]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> Update([FromBody] UpdateBusinessTypeRequest request)
    {
        var bt = await _db.BusinessTypes.FindAsync(request.Id);
        if (bt == null) return NotFound();

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Name is required" });

        var duplicate = await _db.BusinessTypes.AnyAsync(b => b.Id != request.Id && b.Name.ToLower() == name.ToLower());
        if (duplicate)
            return BadRequest(new { message = "A business type with this name already exists" });

        bt.Name = name;
        bt.Color = string.IsNullOrWhiteSpace(request.Color) ? "#6366f1" : request.Color;
        bt.IsActive = request.IsActive;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Business type updated" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var bt = await _db.BusinessTypes.FindAsync(id);
        if (bt == null) return NotFound();

        var usageCount = await _db.Leads.CountAsync(l => l.BusinessTypeId == id);
        if (usageCount > 0)
        {
            bt.IsActive = false;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Business type archived (in use)", softDelete = true });
        }

        _db.BusinessTypes.Remove(bt);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Business type deleted", softDelete = false });
    }
}
