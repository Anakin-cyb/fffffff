/** ResQSync - remaining application pages.
 * These pages intentionally use the stable endpoints already provided by the
 * integrated backend, so every route remains useful even without extra APIs.
 */
(function () {
    "use strict";

    const esc = (v) => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
    const api = () => window.RESQ_API;
    const unwrap = r => r && Object.prototype.hasOwnProperty.call(r, "data") ? r.data : r;
    const page = path => document.querySelector(`[data-route-container="/${path}"]`);
    const table = (headers, rows) => `<div class="table-wrapper"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${headers.length}"><div class="empty-state">No records found</div></td></tr>`}</tbody></table></div>`;
    const shell = (title, subtitle, body) => `<div class="page-header"><div><h1 class="page-title">${esc(title)}</h1><p class="page-subtitle">${esc(subtitle)}</p></div></div><div class="page-content">${body}</div>`;
    const card = (title, value, hint="") => `<div class="card"><div class="card-header"><div><div class="card-title">${esc(title)}</div><div class="card-subtitle">${esc(hint)}</div></div></div><div class="stat-value">${esc(value)}</div></div>`;

    async function load(path, renderer) {
        const c = page(path); if (!c) return;
        c.innerHTML = shell("Loading…", "", `<div class="loading-state">Loading data…</div>`);
        try { await renderer(c); } catch (e) { console.error(e); c.innerHTML = shell("Error", "Could not load this page", `<div class="alert alert-danger">${esc(e.message || e)}</div>`); }
    }

    async function vehicles(c) {
        const data = unwrap(await api().get("/api/vehicles"));
        c.innerHTML = shell("Vehicles", "Ambulance fleet and live status", table(["Vehicle","Type","Driver","Status","GPS","Location"], data.map(v=>`<tr><td>${esc(v.vehicleNumber)}</td><td>${esc(v.vehicleType)}</td><td>${esc(v.driverName||"—")}</td><td>${esc(v.status)}</td><td>${esc(v.gpsStatus||"OFFLINE")}</td><td>${v.latitude!=null?`${Number(v.latitude).toFixed(5)}, ${Number(v.longitude).toFixed(5)}`:"—"}</td></tr>`)));
    }
    async function traffic(c) {
        const data = unwrap(await api().get("/api/traffic-nodes"));
        c.innerHTML = shell("Traffic Nodes", "Junction health and congestion", table(["Node","Status","Connection","Congestion","Coordinates"], data.map(n=>`<tr><td>${esc(n.nodeName)}</td><td>${esc(n.status)}</td><td>${esc(n.connectionStatus||"OFFLINE")}</td><td>${esc(n.congestionLevel||"—")}</td><td>${n.latitude!=null?`${Number(n.latitude).toFixed(5)}, ${Number(n.longitude).toFixed(5)}`:"—"}</td></tr>`)));
    }
    async function signals(c) {
        const data = unwrap(await api().get("/api/traffic-signals"));
        c.innerHTML = shell("Signal Control", "Emergency corridor signal states", table(["Signal","State","Override","Node"], data.map(s=>`<tr><td>${esc(s.name)}</td><td><span class="status-badge">${esc(s.signalState||s.status)}</span></td><td>${s.emergencyOverride?"ACTIVE":"Normal"}</td><td>${esc(s.nodeId||"—")}</td></tr>`)));
    }
    async function logs(c) {
        const data = unwrap(await api().get("/api/events", {limit: 200}));
        c.innerHTML = shell("Event Logs", "System and emergency activity", table(["Time","Type","Title","Severity","Emergency"], data.map(e=>`<tr><td>${esc(e.createdAt||"—")}</td><td>${esc(e.event_type||e.eventType)}</td><td>${esc(e.title||"—")}</td><td>${esc(e.severity||"—")}</td><td>${esc(e.emergencyId||"—")}</td></tr>`)));
    }
    async function analytics(c) {
        const [d0,a0] = await Promise.all([api().get("/api/analytics/dashboard"), api().get("/api/analytics")]);
        const d=unwrap(d0), a=unwrap(a0);
        c.innerHTML = shell("Analytics", "Operational overview", `<div class="dashboard-grid">${card("Total Emergencies",d.totalEmergencies??d.summary?.totalEmergencies??a.emergencies?.total,"All recorded incidents")}${card("Active Emergencies",d.activeEmergencies??d.summary?.activeEmergencies??a.emergencies?.active,"Currently open")}${card("Available Vehicles",d.availableVehicles??d.summary?.availableVehicles??a.vehicles?.available,"Ready for dispatch")}${card("Traffic Nodes",d.totalTrafficNodes??d.summary?.totalTrafficNodes??a.traffic?.nodes,"Registered junctions")}</div>`);
    }
    async function emergencyDetails(c) {
        const id=new URLSearchParams(location.hash.split("?")[1]||"").get("id");
        if(!id){c.innerHTML=shell("Emergency Details","Select an emergency",`<div class="empty-state">Open an emergency from the Emergencies page.</div>`);return;}
        const [e0,events0]=await Promise.all([api().get(`/api/emergencies/${encodeURIComponent(id)}`),api().get(`/api/events`,{emergency_id:id,limit:100})]);
        const e=unwrap(e0), events=unwrap(events0);
        c.innerHTML=shell(`Emergency #${id}`,"Incident details",`<div class="card"><p><strong>Status:</strong> ${esc(e.status)}</p><p><strong>Type:</strong> ${esc(e.type)}</p><p><strong>Location:</strong> ${esc(e.location)}</p><p><strong>Priority:</strong> ${esc(e.priority)}</p><p><strong>Vehicle:</strong> ${esc(e.vehicleNumber||e.assignedVehicleId||"Unassigned")}</p></div><br>${table(["Time","Event","Description"],events.map(x=>`<tr><td>${esc(x.createdAt)}</td><td>${esc(x.event_type||x.eventType)}</td><td>${esc(x.description||x.title||"—")}</td></tr>`))}`);
    }
    async function vehicleDetails(c) {
        const id=new URLSearchParams(location.hash.split("?")[1]||"").get("id"); if(!id){c.innerHTML=shell("Vehicle Details","Select a vehicle",`<div class="empty-state">Open a vehicle from the Vehicles page.</div>`);return;}
        const [v0,t0]=await Promise.all([api().get(`/api/vehicles/${encodeURIComponent(id)}`),api().get(`/api/telemetry`,{vehicle_id:id,limit:30})]);
        const v=unwrap(v0), t=unwrap(t0);
        c.innerHTML=shell(`Vehicle ${v.vehicleNumber||id}`,"Fleet detail",`<div class="card"><p><strong>Status:</strong> ${esc(v.status)}</p><p><strong>Driver:</strong> ${esc(v.driverName||"—")}</p><p><strong>GPS:</strong> ${esc(v.gpsStatus||"OFFLINE")}</p></div><br>${table(["Time","Latitude","Longitude","Speed","Fuel","Temperature"],t.map(x=>`<tr><td>${esc(x.createdAt)}</td><td>${esc(x.latitude)}</td><td>${esc(x.longitude)}</td><td>${esc(x.speed)}</td><td>${esc(x.fuelLevel)}</td><td>${esc(x.temperature)}</td></tr>`))}`);
    }
    async function settings(c){c.innerHTML=shell("Settings","Runtime configuration",`<div class="card"><p><strong>API:</strong> ${esc(window.RESQ_CONFIG?.API_BASE_URL||"http://127.0.0.1:5000")}</p><p><strong>Authentication:</strong> ${window.RESQ_CONFIG?.FEATURES?.REQUIRE_AUTH===false?"Disabled for local demo":"Enabled"}</p><p><strong>Polling:</strong> ${esc(window.RESQ_CONFIG?.POLLING?.LIVE_MAP_MS||3000)} ms</p></div>`);}
    async function citizenHome(c){c.innerHTML=shell("Citizen Home","Request emergency assistance",`<div class="card"><h2>Need emergency assistance?</h2><p>Create an emergency request and track it from this dashboard.</p><button class="btn btn-primary" data-go-request>Request Emergency</button></div>`);c.querySelector("[data-go-request]")?.addEventListener("click",()=>RESQ_ROUTER.navigate("request-emergency"));}
    async function requestEmergency(c){c.innerHTML=shell("Request Emergency","Create an emergency incident",`<form class="form" data-request-form><label class="form-label">Type<input class="form-input" name="type" value="MEDICAL" required></label><label class="form-label">Location<input class="form-input" name="location" placeholder="Address or landmark" required></label><label class="form-label">Latitude<input class="form-input" name="latitude" inputmode="decimal"></label><label class="form-label">Longitude<input class="form-input" name="longitude" inputmode="decimal"></label><button class="btn btn-primary" type="submit">Submit Emergency</button></form><div data-request-result></div>`);c.querySelector("form").addEventListener("submit",async ev=>{ev.preventDefault();const d=Object.fromEntries(new FormData(ev.currentTarget));for(const k of ["latitude","longitude"]) if(d[k]==="") delete d[k];try{const r=unwrap(await api().post("/api/emergencies",d));c.querySelector("[data-request-result]").innerHTML=`<div class="alert alert-success">Emergency #${esc(r.id)} created.</div>`;RESQ_ROUTER.navigate("emergency-status",{id:r.id});}catch(e){c.querySelector("[data-request-result]").innerHTML=`<div class="alert alert-danger">${esc(e.message||e)}</div>`;}});}
    async function emergencyStatus(c){const id=new URLSearchParams(location.hash.split("?")[1]||"").get("id");if(!id){c.innerHTML=shell("Emergency Status","No incident selected",`<div class="empty-state">Use ?id=EMERGENCY_ID.</div>`);return;}const e=unwrap(await api().get(`/api/emergencies/${encodeURIComponent(id)}`));c.innerHTML=shell(`Emergency #${id}`,"Current status",`<div class="card"><div class="stat-value">${esc(e.status)}</div><p>${esc(e.location)}</p><p>Priority: ${esc(e.priority)}</p><p>Assigned vehicle: ${esc(e.vehicleNumber||"Pending")}</p></div>`);}
    async function vehicleDashboard(c){const d=unwrap(await api().get("/api/live/snapshot"));const mine=(d.vehicles||[])[0];c.innerHTML=shell("Vehicle Dashboard","Live ambulance telemetry",`<div class="dashboard-grid">${card("Vehicle",mine?.vehicleNumber||"—")}${card("Status",mine?.status||"—")}${card("GPS",mine?.gpsStatus||"—")}${card("Speed",mine?.speed!=null?`${mine.speed} km/h`:"—")}</div>`);}

    const defs={
        vehicles, "vehicle-details":vehicleDetails, "traffic-nodes":traffic, "signal-control":signals, "event-logs":logs, analytics, settings,
        "emergency-details":emergencyDetails, "citizen-home":citizenHome, "request-emergency":requestEmergency, "emergency-status":emergencyStatus, "vehicle-dashboard":vehicleDashboard
    };
    const modules={};
    Object.keys(defs).forEach(path=>{modules[path]={initialize:()=>load(path,defs[path]),activate:()=>load(path,defs[path]),deactivate:()=>{}};});
    Object.assign(window, Object.fromEntries(Object.entries(modules).map(([k,v])=>[`RESQ_${k.toUpperCase().replace(/-/g,"_")}_PAGE`,v])));
})();
