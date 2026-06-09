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
public class CitiesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CitiesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cities = await _db.Cities
            .OrderBy(c => c.Name)
            .Select(c => new CityResponse
            {
                Id = c.Id,
                Name = c.Name,
                IsActive = c.IsActive,
                UsageCount = _db.Leads.Count(l => l.CityId == c.Id)
            })
            .ToListAsync();
        return Ok(cities);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateCityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Name is required" });

        var name = request.Name.Trim();
        var existing = await _db.Cities.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        if (existing != null) return Conflict(new { message = "City already exists", city = new CityResponse { Id = existing.Id, Name = existing.Name, IsActive = existing.IsActive } });

        var city = new City { Name = name };
        _db.Cities.Add(city);
        await _db.SaveChangesAsync();

        return Ok(new CityResponse
        {
            Id = city.Id,
            Name = city.Name,
            IsActive = city.IsActive,
            UsageCount = 0
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var city = await _db.Cities.FindAsync(id);
        if (city == null) return NotFound();
        var inUse = await _db.Leads.AnyAsync(l => l.CityId == id);
        if (inUse) return BadRequest(new { message = "City is in use and cannot be deleted" });
        _db.Cities.Remove(city);
        await _db.SaveChangesAsync();
        return Ok(new { message = "City deleted" });
    }
}
