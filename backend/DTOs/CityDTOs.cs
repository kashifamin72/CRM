namespace CRM.Api.DTOs;

public class CityResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int UsageCount { get; set; }
}

public class CreateCityRequest
{
    public string Name { get; set; } = string.Empty;
}
