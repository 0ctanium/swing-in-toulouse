type VenuesGoogleMapsAlertProps = {
  configured: boolean;
};

export function VenuesGoogleMapsAlert({ configured }: VenuesGoogleMapsAlertProps) {
  if (configured) {
    return null;
  }

  return (
    <div className="rounded-lg border px-4 py-3 text-sm">
      <p className="font-medium">Google Maps requis pour confirmer les adresses</p>
      <p className="text-muted-foreground mt-1">
        Ajoutez <code>GOOGLE_MAPS_API_KEY</code> dans{" "}
        <code>.env.local</code> (Places API + Geocoding API activées).
      </p>
    </div>
  );
}
