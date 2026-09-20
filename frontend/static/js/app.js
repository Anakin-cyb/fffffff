async function refreshStatus(){
  const r = await fetch('/api/status');
  if(!r.ok) return;
  const s = await r.json();
  document.querySelector('#vehicle-status').textContent = s.vehicle_node;
  document.querySelector('#traffic-status').textContent = s.traffic_node;
  document.querySelector('#signal-status').textContent = s.signal;
  document.querySelector('#recording-status').textContent = s.recording ? 'YES' : 'NO';
}
setInterval(refreshStatus, 1000);
refreshStatus();
