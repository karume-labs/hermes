const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

const payloads = [
  {
    patientId: "patient-1",
    clinicId: "clinic-1",
    facilityId: "facility-1",
    markerCode: "ldl",
    markerValue: 195,
    unit: "mg/dL",
    takenAt: new Date().toISOString(),
  },
  {
    patientId: "patient-2",
    clinicId: "clinic-1",
    facilityId: "facility-1",
    markerCode: "glucose_fasting",
    markerValue: 220,
    unit: "mg/dL",
    takenAt: new Date().toISOString(),
  },
  {
    patientId: "patient-3",
    clinicId: "clinic-2",
    facilityId: "facility-2",
    markerCode: "hdl",
    markerValue: 55,
    unit: "mg/dL",
    takenAt: new Date().toISOString(),
  },
];

for (const p of payloads) {
  const res = await fetch(`${base}/webhooks/lab`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(p),
  });
  console.log(res.status, await res.text());
}
