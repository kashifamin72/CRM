using CRM.Api.Models;

namespace CRM.Api.DTOs;

public class DashboardResponse
{
    public int TotalLeads { get; set; }
    public int NewLeads { get; set; }
    public int ClosedWon { get; set; }
    public decimal EstimatedValue { get; set; }
    public List<PipelineStage> Pipeline { get; set; } = new();
    public List<SourceBreakdown> SourceBreakdown { get; set; } = new();
    public List<FollowUpResponse> TodaysFollowUps { get; set; } = new();
    public List<FollowUpResponse> TomorrowsFollowUps { get; set; } = new();
    public List<LeadResponse> RecentLeads { get; set; } = new();
    public List<OfficerOpenLeads> OpenLeadsByOfficer { get; set; } = new();
}

public class PipelineStage
{
    public LeadStatus Status { get; set; }
    public int Count { get; set; }
}

public class SourceBreakdown
{
    public string SourceName { get; set; } = string.Empty;
    public string? SourceColor { get; set; }
    public int Count { get; set; }
    public decimal EstValue { get; set; }
}

public class OfficerOpenLeads
{
    public string? OfficerId { get; set; }
    public string OfficerName { get; set; } = string.Empty;
    public string? OfficerPicture { get; set; }
    public int LeadCount { get; set; }
    public decimal TotalEstimatedValue { get; set; }
    public List<OpenLeadItem> Leads { get; set; } = new();
}

public class OpenLeadItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public LeadStatus Status { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? LeadSourceName { get; set; }
    public string? LeadSourceColor { get; set; }
    public string? LeadSourceIcon { get; set; }
    public DateTime UpdatedAt { get; set; }
}
