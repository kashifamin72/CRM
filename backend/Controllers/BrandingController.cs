using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.Api.Data;
using CRM.Api.Models;
using CRM.Api.DTOs;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/settings/branding")]
public class BrandingController : ControllerBase
{
    private const long MaxLogoBytes = 2 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExts = new(StringComparer.OrdinalIgnoreCase)
        { ".jpg", ".jpeg", ".png", ".webp", ".svg" };

    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IWebHostEnvironment _env;

    public BrandingController(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        IWebHostEnvironment env)
    {
        _db = db;
        _userManager = userManager;
        _env = env;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get()
    {
        var s = await GetOrCreateAsync();
        return Ok(MapToResponse(s));
    }

    [HttpPut]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update([FromBody] UpdateTenantBrandingRequest request)
    {
        var s = await GetOrCreateAsync();
        var userId = _userManager.GetUserId(User);

        s.CompanyName = request.CompanyName.Trim();
        s.Tagline = string.IsNullOrWhiteSpace(request.Tagline) ? null : request.Tagline.Trim();
        s.PrimaryColor = string.IsNullOrWhiteSpace(request.PrimaryColor) ? null : request.PrimaryColor.Trim();
        s.SupportEmail = string.IsNullOrWhiteSpace(request.SupportEmail) ? null : request.SupportEmail.Trim();
        s.SupportPhone = string.IsNullOrWhiteSpace(request.SupportPhone) ? null : request.SupportPhone.Trim();
        s.UpdatedAt = DateTime.UtcNow;
        s.UpdatedById = userId;

        await _db.SaveChangesAsync();
        return Ok(MapToResponse(s));
    }

    [HttpPost("logo")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> UploadLogo(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });
        if (file.Length > MaxLogoBytes)
            return BadRequest(new { message = "File size must be less than 2MB" });

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExts.Contains(ext))
            return BadRequest(new { message = "Invalid file format. Allowed: JPG, JPEG, PNG, WebP, SVG" });

        var brandingDir = Path.Combine(_env.WebRootPath, "uploads", "branding");
        Directory.CreateDirectory(brandingDir);

        // Remove any existing logo files with different extensions so we don't keep stale copies
        foreach (var existing in Directory.GetFiles(brandingDir))
        {
            try { System.IO.File.Delete(existing); } catch { /* ignore */ }
        }

        var fileName = $"logo{ext.ToLowerInvariant()}";
        var filePath = Path.Combine(brandingDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var s = await GetOrCreateAsync();
        s.LogoPath = $"/uploads/branding/{fileName}";
        s.UpdatedAt = DateTime.UtcNow;
        s.UpdatedById = _userManager.GetUserId(User);
        await _db.SaveChangesAsync();

        return Ok(MapToResponse(s));
    }

    [HttpDelete("logo")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> RemoveLogo()
    {
        var s = await GetOrCreateAsync();

        if (!string.IsNullOrEmpty(s.LogoPath))
        {
            var filePath = Path.Combine(_env.WebRootPath, s.LogoPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(filePath))
            {
                try { System.IO.File.Delete(filePath); } catch { /* ignore */ }
            }
            s.LogoPath = null;
            s.UpdatedAt = DateTime.UtcNow;
            s.UpdatedById = _userManager.GetUserId(User);
            await _db.SaveChangesAsync();
        }

        return Ok(MapToResponse(s));
    }

    private async Task<TenantSetting> GetOrCreateAsync()
    {
        var s = await _db.TenantSettings.FirstOrDefaultAsync(x => x.Id == 1);
        if (s == null)
        {
            s = new TenantSetting { Id = 1 };
            _db.TenantSettings.Add(s);
            await _db.SaveChangesAsync();
        }
        return s;
    }

    private static TenantBrandingResponse MapToResponse(TenantSetting s) => new()
    {
        CompanyName = s.CompanyName,
        Tagline = s.Tagline,
        LogoUrl = s.LogoPath,
        PrimaryColor = s.PrimaryColor,
        SupportEmail = s.SupportEmail,
        SupportPhone = s.SupportPhone,
        UpdatedAt = s.UpdatedAt
    };
}
