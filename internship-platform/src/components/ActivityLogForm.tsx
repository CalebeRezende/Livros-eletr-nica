"use client";

import { useState } from "react";

import { addActivityLog } from "@/lib/actions/activityLogs";

export function ActivityLogForm({ applicationId }: { applicationId: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function captureLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoStatus("done");
      },
      () => setGeoStatus("error"),
    );
  }

  return (
    <form action={addActivityLog} className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5">
      <input type="hidden" name="applicationId" value={applicationId} />
      {coords && <input type="hidden" name="checkInLat" value={coords.lat} />}
      {coords && <input type="hidden" name="checkInLng" value={coords.lng} />}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Data
          <input type="date" name="date" required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Horas
          <input type="number" name="hours" min={0.5} step={0.5} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Atividade realizada
        <textarea name="description" required rows={3} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>

      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={captureLocation}
          className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
        >
          Marcar localização (opcional)
        </button>
        {geoStatus === "loading" && <span className="text-slate-500">Obtendo localização…</span>}
        {geoStatus === "done" && <span className="text-green-700">Localização capturada.</span>}
        {geoStatus === "error" && (
          <span className="text-red-600">Não foi possível obter a localização.</span>
        )}
      </div>

      <button type="submit" className="w-fit rounded-lg bg-slate-900 px-5 py-2 text-sm text-white">
        Registrar
      </button>
    </form>
  );
}
