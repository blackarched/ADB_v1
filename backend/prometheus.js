import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Enable default metrics collection (e.g., CPU, memory, event loop lag)
client.collectDefaultMetrics({ register });

// --- Define Custom Metrics ---

// Counter for total ADB commands executed
export const adbCommandsTotal = new client.Counter({
  name: 'adb_commands_total',
  help: 'Total number of ADB commands executed, partitioned by command type and status.',
  labelNames: ['command_type', 'status'], // e.g., command_type='shell', status='success'/'failure'
  registers: [register],
});

// Counter for total Pentest jobs started
export const pentestJobsStartedTotal = new client.Counter({
  name: 'pentest_jobs_started_total',
  help: 'Total number of pentest jobs started, partitioned by scan type.',
  labelNames: ['scan_type'], // e.g., scan_type='nmap_discovery'
  registers: [register],
});

// Counter for total Pentest jobs completed
export const pentestJobsCompletedTotal = new client.Counter({
  name: 'pentest_jobs_completed_total',
  help: 'Total number of pentest jobs completed, partitioned by scan type and status.',
  labelNames: ['scan_type', 'status'], // e.g., status='success'/'failure'
  registers: [register],
});

// Gauge for active WebSocket connections
export const activeWebSocketConnections = new client.Gauge({
  name: 'active_websocket_connections',
  help: 'Number of currently active WebSocket connections.',
  registers: [register],
});


// --- Expose Metrics Endpoint ---

/**
 * Middleware to expose metrics for Prometheus scraping.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function metricsEndpoint(req, res) {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
}

// Example of how to increment a counter:
// adbCommandsTotal.labels('shell', 'success').inc();
// pentestJobsStartedTotal.labels('nmap_scan').inc();
// activeWebSocketConnections.inc();
// activeWebSocketConnections.dec();

export default register;
