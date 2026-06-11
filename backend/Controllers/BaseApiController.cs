using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace CRM.Api.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    protected string GetUserRole() =>
        User.FindFirstValue(ClaimTypes.Role) ?? "";

    protected bool IsAdmin => GetUserRole() == "Administrator";
    protected bool IsManager => GetUserRole() == "Manager";
    protected bool IsSalesOfficer => GetUserRole() == "SalesOfficer";
    protected bool IsAdminOrManager => IsAdmin || IsManager;
}
