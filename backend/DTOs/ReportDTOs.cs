namespace CRM.Api.DTOs;

public class ReportResponse
{
    public int TotalLeads { get; set; }
    public int NewLeads { get; set; }
    public int ContactedLeads { get; set; }
    public int QualifiedLeads { get; set; }
    public int ProposalLeads { get; set; }
    public int ClosedWon { get; set; }
    public int ClosedLost { get; set; }
    public decimal EstimatedValue { get; set; }
    public List<StatusDistributionItem> StatusDistribution { get; set; } = new();
    public List<SourceBreakdownItem> SourceBreakdown { get; set; } = new();
    public List<LeadResponse> Leads { get; set; } = new();
}

public class StatusDistributionItem
{
    public string Status { get; set; } = "";
    public int Count { get; set; }
}

public class SourceBreakdownItem
{
    public string SourceName { get; set; } = "";
    public string SourceColor { get; set; } = "";
    public int Count { get; set; }
    public decimal EstValue { get; set; }
}
