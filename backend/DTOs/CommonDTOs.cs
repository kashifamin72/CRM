namespace CRM.Api.DTOs;

public record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);

public record ApiResponse<T>(bool Success, string Message, T? Data);
