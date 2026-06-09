using Microsoft.AspNetCore.Identity;
using CRM.Api.Models;

namespace CRM.Api.Data;

public static class SeedDataService
{
    private static readonly string[] Roles = ["Administrator", "Manager", "SalesOfficer"];

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        var users = new (string Email, string Password, string Role, string FirstName, string LastName, string Designation)[]
        {
            ("amin.kashif@gmail.com", "Admin@123", "Administrator", "Kashif", "Admin", "Administrator"),
            ("kashif@visionplus.com.pk", "Manager@123", "Manager", "Kashif", "Khan", "Manager"),
            ("sumer@visionplus.com.pk", "Manager@123", "Manager", "Umer", "Khan", "Manager"),
            ("salman@visionplus.com.pk", "Sales@123", "SalesOfficer", "Salman", "Ahmed", "Sales Officer"),
            ("abdullah@visionplus.com.pk", "Sales@123", "SalesOfficer", "Abdullah", "Ali", "Sales Officer"),
            ("faisal@visionplus.com.pk", "Sales@123", "SalesOfficer", "Faisal", "Malik", "Sales Officer")
        };

        foreach (var (email, password, role, firstName, lastName, designation) in users)
        {
            if (await userManager.FindByEmailAsync(email) != null) continue;

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                Designation = designation,
                EmailConfirmed = true,
                PhoneNumberConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(user, role);
        }
    }
}
