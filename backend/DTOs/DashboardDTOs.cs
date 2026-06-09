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
