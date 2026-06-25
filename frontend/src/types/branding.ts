export interface TenantBranding {
  companyName: string;
  tagline: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  updatedAt: string;
}

export interface UpdateBrandingRequest {
  companyName: string;
  tagline?: string | null;
  primaryColor?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
}
