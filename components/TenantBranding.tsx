'use client'

interface TenantBrandingProps {
  customization: any
  tenant: any
}

export function TenantBranding({ customization, tenant }: TenantBrandingProps) {
  if (!customization?.custom_logo_url && !tenant?.company_name) return null

  return (
    <div className="bg-white border-b border-slate-200 py-3 px-6">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {customization.custom_logo_url && (
          <img 
            src={customization.custom_logo_url} 
            alt={tenant.company_name} 
            className="h-12 w-auto object-contain"
          />
        )}
        <div>
          <p className="font-bold text-slate-900">
            {customization.custom_company_name || tenant.company_name}
          </p>
          <p className="text-xs text-slate-500">
            Offizieller Partner auf fachschmiede.de
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Aktiv</span>
        </div>
      </div>
    </div>
  )
}
