import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';
import { TenantBranding } from '../types/branding';

interface BrandingContextType {
  branding: TenantBranding;
  loading: boolean;
  refresh: () => Promise<void>;
  update: (data: Partial<TenantBranding>) => Promise<TenantBranding>;
  uploadLogo: (file: File) => Promise<TenantBranding>;
  removeLogo: () => Promise<TenantBranding>;
}

const DEFAULT_BRANDING: TenantBranding = {
  companyName: 'CRM System',
  tagline: 'Customer Relationship Management',
  logoUrl: null,
  primaryColor: '#2563eb',
  supportEmail: null,
  supportPhone: null,
  updatedAt: new Date(0).toISOString(),
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

function applyFavicon(logoUrl: string | null) {
  // Swap or restore the document favicon. If a logo is set, use it as the icon;
  // otherwise remove any dynamic <link rel="icon"> we added so the default returns.
  const existing = document.querySelector("link[data-dynamic-favicon='true']") as HTMLLinkElement | null;
  if (logoUrl) {
    if (existing) {
      existing.href = logoUrl;
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = logoUrl;
      link.setAttribute('data-dynamic-favicon', 'true');
      document.head.appendChild(link);
    }
  } else if (existing) {
    existing.remove();
  }
}

function applyDocumentTitle(name: string) {
  const base = name?.trim() || 'CRM System';
  if (!document.title.startsWith(base)) {
    document.title = `${base} CRM`;
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<TenantBranding>('/settings/branding');
      setBranding(data);
      applyFavicon(data.logoUrl);
      applyDocumentTitle(data.companyName);
    } catch {
      // Fall back to defaults silently — login page can still render
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(async (data: Partial<TenantBranding>) => {
    const updated = await api.put<TenantBranding>('/settings/branding', data);
    setBranding(updated);
    applyFavicon(updated.logoUrl);
    applyDocumentTitle(updated.companyName);
    return updated;
  }, []);

  const uploadLogo = useCallback(async (file: File) => {
    const updated = await api.upload<TenantBranding>('/settings/branding/logo', file);
    setBranding(updated);
    applyFavicon(updated.logoUrl);
    return updated;
  }, []);

  const removeLogo = useCallback(async () => {
    const updated = await api.delete<TenantBranding>('/settings/branding/logo');
    setBranding(updated);
    applyFavicon(updated.logoUrl);
    return updated;
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh, update, uploadLogo, removeLogo }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (ctx === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return ctx;
}
