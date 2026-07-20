'use client'

interface TenantBrandingProps {
  customization: any
  tenant: any
}

export function TenantBranding({ customization, tenant }: TenantBrandingProps) {
  if (!customization?.custom_logo_url && !tenant?.company_name) return null

  const phone = customization?.custom_phone
  const whatsapp = customization?.custom_whatsapp
  const placeId = customization?.custom_place_id

  const waLink = whatsapp 
    ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}` 
    : null

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="py-3 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {customization.custom_logo_url && (
            <img 
              src={customization.custom_logo_url} 
              alt={tenant.company_name} 
              className="h-12 w-auto object-contain"
            />
          )}
          <div className="flex-1">
            <p className="font-bold text-slate-900">
              {customization.custom_company_name || tenant.company_name}
            </p>
            <p className="text-xs text-slate-500">
              Offizieller Partner auf fachschmiede.de
            </p>
          </div>
          <div className="flex items-center gap-3">
            {waLink && (
              <a 
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Aktiv</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Google Maps Component
export function GoogleMap({ placeId, address }: { placeId?: string; address?: string }) {
  if (!placeId && !address) return null

  let embedUrl: string
  if (placeId) {
    embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100000!2d10!3d50!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s${placeId}!2s!5e0!3m2!1sde!2sde!4v1700000000000`
  } else {
    embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100000!2d10!3d50!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${encodeURIComponent(address || '')}!5e0!3m2!1sde!2sde!4v1700000000000`
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
      <iframe
        src={embedUrl}
        width="100%"
        height="400"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Standort"
        className="w-full"
      />
    </div>
  )
}
