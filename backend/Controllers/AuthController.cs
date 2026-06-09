using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using CRM.Api.Models;
using CRM.Api.DTOs;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
            return Unauthorized(new { message = "Invalid credentials" });

        var valid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!valid)
            return Unauthorized(new { message = "Invalid credentials" });

        var role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "SalesOfficer";
        var token = GenerateJwtToken(user, role);

        return Ok(new LoginResponse
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Designation = user.Designation,
            Role = role,
            ProfilePicture = user.ProfilePicture
        });
    }

    [HttpPost("register")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var exists = await _userManager.FindByEmailAsync(request.Email);
        if (exists != null)
            return Conflict(new { message = "Email already registered" });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Designation = request.Designation,
            PhoneNumber = request.PhoneNumber,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(user, request.Role);

        return Created($"/api/employees/{user.Id}", new { user.Id, user.Email });
    }

    private string GenerateJwtToken(ApplicationUser user, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured")));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? ""),
            new("FirstName", user.FirstName),
            new("LastName", user.LastName),
            new(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:ExpirationInMinutes"] ?? "60")),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
