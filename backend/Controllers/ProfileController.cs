using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.Api.Data;
using CRM.Api.Models;
using CRM.Api.DTOs;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ProfileController(UserManager<ApplicationUser> userManager, ApplicationDbContext db, IWebHostEnvironment env)
    {
        _userManager = userManager;
        _db = db;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new ProfileResponse
        {
            Id = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Designation = user.Designation,
            PhoneNumber = user.PhoneNumber,
            ProfilePicture = user.ProfilePicture,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Role = roles.FirstOrDefault() ?? ""
        });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.PhoneNumber = request.PhoneNumber;

        if (user.Email != request.Email)
        {
            var exists = await _userManager.FindByEmailAsync(request.Email);
            if (exists != null && exists.Id != user.Id)
                return Conflict(new { message = "Email already in use" });

            user.Email = request.Email;
            user.UserName = request.Email;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new
        {
            message = "Profile updated",
            user = new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.Designation,
                user.PhoneNumber,
                user.ProfilePicture,
                user.IsActive,
                user.CreatedAt
            }
        });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new { message = "Password changed" });
    }

    [HttpPost("upload-picture")]
    public async Task<IActionResult> UploadPicture(IFormFile file)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext))
            return BadRequest(new { message = "Invalid file format. Allowed: JPG, PNG, WebP" });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File size must be less than 5MB" });

        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "profiles");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{user.Id}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.ProfilePicture = $"/uploads/profiles/{fileName}";
        await _userManager.UpdateAsync(user);

        return Ok(new { pictureUrl = user.ProfilePicture });
    }

    [HttpPost("remove-picture")]
    public async Task<IActionResult> RemovePicture()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        if (!string.IsNullOrEmpty(user.ProfilePicture))
        {
            var filePath = Path.Combine(_env.WebRootPath, user.ProfilePicture.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            user.ProfilePicture = null;
            await _userManager.UpdateAsync(user);
        }

        return Ok(new { message = "Picture removed" });
    }
}
