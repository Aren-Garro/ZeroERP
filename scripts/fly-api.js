#!/usr/bin/env node
/**
 * Fly.io API Integration Service
 * Provides programmatic access to Fly.io GraphQL and Machines APIs
 */

import { spawnSync } from 'child_process';

const GRAPHQL_URL = 'https://api.fly.io/graphql';
const MACHINES_URL = 'https://api.machines.dev/v1';

// Get token from environment
const getToken = () => {
  const token = process.env.FLY_API_TOKEN || process.env.FLY_API;
  if (!token) {
    throw new Error('FLY_API_TOKEN or FLY_API environment variable required');
  }
  return token;
};

/**
 * Make HTTP request using curl (more reliable in some environments)
 */
function curlRequest(url, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body;

  const args = ['-s', '-X', method];

  // Add headers
  for (const [key, value] of Object.entries(headers)) {
    args.push('-H', `${key}: ${value}`);
  }

  // Add body if present
  if (body) {
    args.push('-d', body);
  }

  args.push(url);

  const result = spawnSync('curl', args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error) {
    throw new Error(`HTTP request failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`curl failed: ${result.stderr || `exit code ${result.status}`}`);
  }
  return result.stdout;
}

/**
 * Execute a GraphQL query against Fly.io API
 */
async function graphql(query, variables = {}) {
  const body = JSON.stringify({ query, variables });

  const response = curlRequest(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  const result = JSON.parse(response);

  if (result.errors) {
    const errorMsg = result.errors.map(e => e.message).join(', ');
    throw new Error(`GraphQL Error: ${errorMsg}`);
  }

  return result.data;
}

/**
 * Execute a Machines API request
 */
async function machinesApi(path, options = {}) {
  const url = `${MACHINES_URL}${path}`;

  const response = curlRequest(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.startsWith('404') || response.includes('not found')) {
    throw new Error(`Machines API Error: ${response}`);
  }

  try {
    return JSON.parse(response);
  } catch {
    return response;
  }
}

// ============================================================================
// App Management
// ============================================================================

/**
 * Get app details
 */
async function getApp(appName) {
  const query = `
    query($name: String!) {
      app(name: $name) {
        id
        name
        status
        hostname
        appUrl
        organization { slug name }
        currentRelease { id version status createdAt }
        machines { nodes { id name state region } }
      }
    }
  `;
  const data = await graphql(query, { name: appName });
  return data.app;
}

/**
 * List all apps in organization
 */
async function listApps() {
  const query = `
    query {
      apps {
        nodes {
          id
          name
          status
          organization { slug }
        }
      }
    }
  `;
  const data = await graphql(query);
  return data.apps.nodes;
}

// ============================================================================
// Machine Management
// ============================================================================

/**
 * List machines for an app
 */
async function listMachines(appName) {
  return machinesApi(`/apps/${appName}/machines`);
}

/**
 * Get machine details
 */
async function getMachine(appName, machineId) {
  return machinesApi(`/apps/${appName}/machines/${machineId}`);
}

/**
 * Start a machine
 */
async function startMachine(appName, machineId) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/start`, {
    method: 'POST',
  });
}

/**
 * Stop a machine
 */
async function stopMachine(appName, machineId) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/stop`, {
    method: 'POST',
  });
}

/**
 * Get machine events
 */
async function getMachineEvents(appName, machineId) {
  const machine = await getMachine(appName, machineId);
  return machine.events || [];
}

/**
 * Suspend a machine (pause and snapshot state)
 */
async function suspendMachine(appName, machineId) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/suspend`, {
    method: 'POST',
  });
}

/**
 * Restart a machine (stop then start)
 */
async function restartMachine(appName, machineId, options = {}) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/restart`, {
    method: 'POST',
    body: {
      timeout: options.timeout || '30s',
      signal: options.signal,
    },
  });
}

/**
 * Delete a machine permanently
 */
async function deleteMachine(appName, machineId, force = false) {
  const params = force ? '?force=true' : '';
  return machinesApi(`/apps/${appName}/machines/${machineId}${params}`, {
    method: 'DELETE',
  });
}

/**
 * Cordon a machine (stop routing traffic to it)
 */
async function cordonMachine(appName, machineId) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/cordon`, {
    method: 'POST',
  });
}

/**
 * Uncordon a machine (resume routing traffic)
 */
async function uncordonMachine(appName, machineId) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/uncordon`, {
    method: 'POST',
  });
}

/**
 * Wait for machine to reach a specific state
 */
async function waitForMachine(appName, machineId, state = 'started', timeout = 60) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/wait?state=${state}&timeout=${timeout}s`);
}

/**
 * Create a new machine
 */
async function createMachine(appName, config) {
  return machinesApi(`/apps/${appName}/machines`, {
    method: 'POST',
    body: config,
  });
}

/**
 * Update machine configuration
 */
async function updateMachine(appName, machineId, config) {
  return machinesApi(`/apps/${appName}/machines/${machineId}`, {
    method: 'POST',
    body: config,
  });
}

// ============================================================================
// Machine Leases
// ============================================================================

/**
 * Acquire a lease on a machine (exclusive lock)
 */
async function acquireLease(appName, machineId, ttl = 30) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/lease`, {
    method: 'POST',
    body: { ttl },
  });
}

/**
 * Get current lease info
 */
async function getLease(appName, machineId) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/lease`);
}

/**
 * Release a lease
 */
async function releaseLease(appName, machineId, nonce) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/lease`, {
    method: 'DELETE',
    headers: nonce ? { 'fly-machine-lease-nonce': nonce } : {},
  });
}

// ============================================================================
// Machine Metadata
// ============================================================================

/**
 * Get machine metadata
 */
async function getMetadata(appName, machineId) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/metadata`);
}

/**
 * Set a metadata key
 */
async function setMetadataKey(appName, machineId, key, value) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/metadata/${key}`, {
    method: 'POST',
    body: value,
  });
}

/**
 * Delete a metadata key
 */
async function deleteMetadataKey(appName, machineId, key) {
  return machinesApi(`/apps/${appName}/machines/${machineId}/metadata/${key}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Secrets Management
// ============================================================================

/**
 * List secrets for an app
 */
async function listSecrets(appName) {
  const query = `
    query($name: String!) {
      app(name: $name) {
        secrets { name createdAt }
      }
    }
  `;
  const data = await graphql(query, { name: appName });
  return data.app.secrets;
}

/**
 * Set secrets for an app
 */
async function setSecrets(appName, secrets) {
  const query = `
    mutation($input: SetSecretsInput!) {
      setSecrets(input: $input) {
        app { name }
        release { id version }
      }
    }
  `;
  const secretsArray = Object.entries(secrets).map(([key, value]) => ({
    key,
    value,
  }));

  const data = await graphql(query, {
    input: {
      appId: appName,
      secrets: secretsArray,
    },
  });
  return data.setSecrets;
}

/**
 * Unset (delete) secrets
 */
async function unsetSecrets(appName, keys) {
  const query = `
    mutation($input: UnsetSecretsInput!) {
      unsetSecrets(input: $input) {
        app { name }
        release { id version }
      }
    }
  `;

  const data = await graphql(query, {
    input: {
      appId: appName,
      keys: Array.isArray(keys) ? keys : [keys],
    },
  });
  return data.unsetSecrets;
}

// ============================================================================
// Deployment & Releases
// ============================================================================

/**
 * Get releases for an app
 */
async function listReleases(appName, limit = 10) {
  const query = `
    query($name: String!, $limit: Int!) {
      app(name: $name) {
        releases(last: $limit) {
          nodes {
            id
            version
            status
            reason
            description
            createdAt
            user { email name }
          }
        }
      }
    }
  `;
  const data = await graphql(query, { name: appName, limit });
  return data.app.releases.nodes;
}

/**
 * Get deployment status
 */
async function getDeploymentStatus(appName) {
  const query = `
    query($name: String!) {
      app(name: $name) {
        deploymentStatus {
          id
          status
          description
          inProgress
          successful
          version
        }
      }
    }
  `;
  const data = await graphql(query, { name: appName });
  return data.app.deploymentStatus;
}

// ============================================================================
// Volumes Management
// ============================================================================

/**
 * List volumes for an app
 */
async function listVolumes(appName) {
  return machinesApi(`/apps/${appName}/volumes`);
}

/**
 * Get volume details
 */
async function getVolume(appName, volumeId) {
  return machinesApi(`/apps/${appName}/volumes/${volumeId}`);
}

/**
 * Create a new volume
 */
async function createVolume(appName, options) {
  return machinesApi(`/apps/${appName}/volumes`, {
    method: 'POST',
    body: {
      name: options.name,
      region: options.region,
      size_gb: options.sizeGb || 1,
      snapshot_id: options.snapshotId,
      snapshot_retention: options.snapshotRetention,
      encrypted: options.encrypted !== false,
    },
  });
}

/**
 * Extend (resize) a volume - can only increase size
 */
async function extendVolume(appName, volumeId, sizeGb) {
  return machinesApi(`/apps/${appName}/volumes/${volumeId}/extend`, {
    method: 'PUT',
    body: { size_gb: sizeGb },
  });
}

/**
 * Delete a volume permanently
 */
async function deleteVolume(appName, volumeId) {
  return machinesApi(`/apps/${appName}/volumes/${volumeId}`, {
    method: 'DELETE',
  });
}

/**
 * List volume snapshots
 */
async function listSnapshots(appName, volumeId) {
  return machinesApi(`/apps/${appName}/volumes/${volumeId}/snapshots`);
}

/**
 * Create a volume snapshot
 */
async function createSnapshot(appName, volumeId) {
  return machinesApi(`/apps/${appName}/volumes/${volumeId}/snapshots`, {
    method: 'POST',
  });
}

// ============================================================================
// Regions
// ============================================================================

/**
 * List available regions
 */
async function listRegions() {
  const query = `
    query {
      platform {
        regions {
          code
          name
          gatewayAvailable
        }
      }
    }
  `;
  const data = await graphql(query);
  return data.platform.regions;
}

// ============================================================================
// Health & Monitoring
// ============================================================================

/**
 * Get health check status
 */
async function getHealthChecks(appName) {
  const query = `
    query($name: String!) {
      app(name: $name) {
        healthChecks {
          nodes { name status }
        }
      }
    }
  `;
  const data = await graphql(query, { name: appName });
  return data.app.healthChecks.nodes;
}

/**
 * Get host issues
 */
async function getHostIssues(appName) {
  const query = `
    query($name: String!) {
      app(name: $name) {
        hostIssues {
          nodes { id message }
        }
      }
    }
  `;
  const data = await graphql(query, { name: appName });
  return data.app.hostIssues.nodes;
}

/**
 * Get comprehensive app status
 */
async function getAppStatus(appName) {
  const [app, machines, secrets, healthChecks, hostIssues] = await Promise.all([
    getApp(appName),
    listMachines(appName).catch(() => []),
    listSecrets(appName).catch(() => []),
    getHealthChecks(appName).catch(() => []),
    getHostIssues(appName).catch(() => []),
  ]);

  return {
    app,
    machines: machines.map(m => ({
      id: m.id,
      name: m.name,
      state: m.state,
      region: m.region,
      lastEvent: m.events?.[0],
    })),
    secrets: secrets.map(s => s.name),
    healthChecks,
    hostIssues,
  };
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Start all machines for an app
 */
async function startAllMachines(appName) {
  const machines = await listMachines(appName);
  const results = [];
  for (const machine of machines) {
    if (machine.state === 'stopped' || machine.state === 'suspended') {
      try {
        await startMachine(appName, machine.id);
        results.push({ id: machine.id, name: machine.name, status: 'starting' });
      } catch (error) {
        results.push({ id: machine.id, name: machine.name, status: 'error', error: error.message });
      }
    } else {
      results.push({ id: machine.id, name: machine.name, status: 'already running' });
    }
  }
  return results;
}

/**
 * Stop all machines for an app
 */
async function stopAllMachines(appName) {
  const machines = await listMachines(appName);
  const results = [];
  for (const machine of machines) {
    if (machine.state === 'started') {
      try {
        await stopMachine(appName, machine.id);
        results.push({ id: machine.id, name: machine.name, status: 'stopping' });
      } catch (error) {
        results.push({ id: machine.id, name: machine.name, status: 'error', error: error.message });
      }
    } else {
      results.push({ id: machine.id, name: machine.name, status: 'already stopped' });
    }
  }
  return results;
}

/**
 * Restart all machines for an app
 */
async function restartAllMachines(appName) {
  const machines = await listMachines(appName);
  const results = [];
  for (const machine of machines) {
    try {
      await restartMachine(appName, machine.id);
      results.push({ id: machine.id, name: machine.name, status: 'restarting' });
    } catch (error) {
      results.push({ id: machine.id, name: machine.name, status: 'error', error: error.message });
    }
  }
  return results;
}

// ============================================================================
// Logs (via machine events - real logs require NATS connection)
// ============================================================================

/**
 * Get recent events across all machines (pseudo-logs)
 */
async function getRecentEvents(appName, limit = 20) {
  const machines = await listMachines(appName);
  const allEvents = [];

  for (const machine of machines) {
    const events = machine.events || [];
    events.forEach(event => {
      allEvents.push({
        machineId: machine.id,
        machineName: machine.name,
        ...event,
      });
    });
  }

  // Sort by timestamp descending
  allEvents.sort((a, b) => b.timestamp - a.timestamp);

  return allEvents.slice(0, limit);
}

// ============================================================================
// CLI Interface
// ============================================================================

async function cli() {
  const args = process.argv.slice(2);
  const command = args[0];
  const appName = process.env.FLY_APP || 'zeroerp';

  const commands = {
    'status': async () => {
      const status = await getAppStatus(appName);
      console.log(JSON.stringify(status, null, 2));
    },

    'app': async () => {
      const app = await getApp(appName);
      console.log(JSON.stringify(app, null, 2));
    },

    'machines': async () => {
      const machines = await listMachines(appName);
      console.log(JSON.stringify(machines, null, 2));
    },

    'machine': async () => {
      const machineId = args[1];
      if (!machineId) {
        console.error('Usage: fly-api machine <machineId>');
        process.exit(1);
      }
      const machine = await getMachine(appName, machineId);
      console.log(JSON.stringify(machine, null, 2));
    },

    'start': async () => {
      const machineId = args[1];
      if (!machineId) {
        console.error('Usage: fly-api start <machineId>');
        process.exit(1);
      }
      await startMachine(appName, machineId);
      console.log(`Machine ${machineId} starting...`);
    },

    'stop': async () => {
      const machineId = args[1];
      if (!machineId) {
        console.error('Usage: fly-api stop <machineId>');
        process.exit(1);
      }
      await stopMachine(appName, machineId);
      console.log(`Machine ${machineId} stopping...`);
    },

    'restart': async () => {
      const machineId = args[1];
      if (!machineId) {
        console.error('Usage: fly-api restart <machineId>');
        process.exit(1);
      }
      await restartMachine(appName, machineId);
      console.log(`Machine ${machineId} restarting...`);
    },

    'suspend': async () => {
      const machineId = args[1];
      if (!machineId) {
        console.error('Usage: fly-api suspend <machineId>');
        process.exit(1);
      }
      await suspendMachine(appName, machineId);
      console.log(`Machine ${machineId} suspending...`);
    },

    'cordon': async () => {
      const machineId = args[1];
      if (!machineId) {
        console.error('Usage: fly-api cordon <machineId>');
        process.exit(1);
      }
      await cordonMachine(appName, machineId);
      console.log(`Machine ${machineId} cordoned (traffic routing stopped)`);
    },

    'uncordon': async () => {
      const machineId = args[1];
      if (!machineId) {
        console.error('Usage: fly-api uncordon <machineId>');
        process.exit(1);
      }
      await uncordonMachine(appName, machineId);
      console.log(`Machine ${machineId} uncordoned (traffic routing resumed)`);
    },

    'start-all': async () => {
      console.log('Starting all machines...');
      const results = await startAllMachines(appName);
      results.forEach(r => console.log(`  ${r.name}: ${r.status}`));
    },

    'stop-all': async () => {
      console.log('Stopping all machines...');
      const results = await stopAllMachines(appName);
      results.forEach(r => console.log(`  ${r.name}: ${r.status}`));
    },

    'restart-all': async () => {
      console.log('Restarting all machines...');
      const results = await restartAllMachines(appName);
      results.forEach(r => console.log(`  ${r.name}: ${r.status}`));
    },

    'volumes': async () => {
      const volumes = await listVolumes(appName);
      if (volumes.length === 0) {
        console.log('No volumes found');
      } else {
        console.log('Volumes:');
        volumes.forEach(v => {
          console.log(`  ${v.id} - ${v.name}`);
          console.log(`    Region: ${v.region}, Size: ${v.size_gb}GB, State: ${v.state}`);
          if (v.attached_machine_id) {
            console.log(`    Attached to: ${v.attached_machine_id}`);
          }
        });
      }
    },

    'volume': async () => {
      const volumeId = args[1];
      if (!volumeId) {
        console.error('Usage: fly-api volume <volumeId>');
        process.exit(1);
      }
      const volume = await getVolume(appName, volumeId);
      console.log(JSON.stringify(volume, null, 2));
    },

    'volumes:create': async () => {
      const name = args[1];
      const region = args[2];
      const size = args[3] || '1';
      if (!name || !region) {
        console.error('Usage: fly-api volumes:create <name> <region> [sizeGb]');
        process.exit(1);
      }
      const volume = await createVolume(appName, { name, region, sizeGb: parseInt(size) });
      console.log(`Volume created: ${volume.id}`);
      console.log(JSON.stringify(volume, null, 2));
    },

    'volumes:extend': async () => {
      const volumeId = args[1];
      const size = args[2];
      if (!volumeId || !size) {
        console.error('Usage: fly-api volumes:extend <volumeId> <newSizeGb>');
        process.exit(1);
      }
      const result = await extendVolume(appName, volumeId, parseInt(size));
      console.log(`Volume extended to ${size}GB`);
      if (result.needs_restart) {
        console.log('Note: Machine restart required to use new space');
      }
    },

    'volumes:delete': async () => {
      const volumeId = args[1];
      if (!volumeId) {
        console.error('Usage: fly-api volumes:delete <volumeId>');
        process.exit(1);
      }
      await deleteVolume(appName, volumeId);
      console.log(`Volume ${volumeId} deleted`);
    },

    'snapshots': async () => {
      const volumeId = args[1];
      if (!volumeId) {
        console.error('Usage: fly-api snapshots <volumeId>');
        process.exit(1);
      }
      const snapshots = await listSnapshots(appName, volumeId);
      if (snapshots.length === 0) {
        console.log('No snapshots found');
      } else {
        console.log('Snapshots:');
        snapshots.forEach(s => {
          console.log(`  ${s.id} - ${s.created_at} (${s.size} bytes)`);
        });
      }
    },

    'snapshots:create': async () => {
      const volumeId = args[1];
      if (!volumeId) {
        console.error('Usage: fly-api snapshots:create <volumeId>');
        process.exit(1);
      }
      await createSnapshot(appName, volumeId);
      console.log(`Snapshot creation initiated for volume ${volumeId}`);
    },

    'regions': async () => {
      const regions = await listRegions();
      console.log('Available regions:');
      regions
        .filter(r => r.gatewayAvailable)
        .forEach(r => console.log(`  ${r.code} - ${r.name}`));
    },

    'secrets': async () => {
      const secrets = await listSecrets(appName);
      console.log('Configured secrets:');
      if (secrets.length === 0) {
        console.log('  (none)');
      } else {
        secrets.forEach(s => console.log(`  - ${s.name} (set: ${s.createdAt})`));
      }
    },

    'secrets:set': async () => {
      // Parse KEY=VALUE pairs
      const pairs = args.slice(1);
      if (pairs.length === 0) {
        console.error('Usage: fly-api secrets:set KEY=VALUE [KEY2=VALUE2 ...]');
        process.exit(1);
      }
      const secrets = {};
      pairs.forEach(pair => {
        const [key, ...valueParts] = pair.split('=');
        secrets[key] = valueParts.join('=');
      });
      const result = await setSecrets(appName, secrets);
      console.log(`Secrets set. New release: v${result.release?.version || 'pending'}`);
    },

    'secrets:unset': async () => {
      const keys = args.slice(1);
      if (keys.length === 0) {
        console.error('Usage: fly-api secrets:unset KEY [KEY2 ...]');
        process.exit(1);
      }
      const result = await unsetSecrets(appName, keys);
      console.log(`Secrets removed. New release: v${result.release?.version || 'pending'}`);
    },

    'releases': async () => {
      const releases = await listReleases(appName);
      console.log('Recent releases:');
      releases.forEach(r => {
        console.log(`  v${r.version} [${r.status}] - ${r.createdAt}`);
        if (r.reason) console.log(`    Reason: ${r.reason}`);
      });
    },

    'events': async () => {
      const events = await getRecentEvents(appName);
      console.log('Recent machine events:');
      events.forEach(e => {
        const time = new Date(e.timestamp).toISOString();
        console.log(`  [${time}] ${e.machineName}: ${e.type} -> ${e.status}`);
      });
    },

    'health': async () => {
      const [healthChecks, hostIssues] = await Promise.all([
        getHealthChecks(appName),
        getHostIssues(appName),
      ]);
      console.log('Health Checks:');
      if (healthChecks.length === 0) {
        console.log('  (no active checks - machines may be stopped)');
      } else {
        healthChecks.forEach(h => console.log(`  ${h.name}: ${h.status}`));
      }
      console.log('\nHost Issues:');
      if (hostIssues.length === 0) {
        console.log('  (none)');
      } else {
        hostIssues.forEach(i => console.log(`  - ${i.message}`));
      }
    },

    'help': () => {
      console.log(`
Fly.io API CLI - Manage your Fly.io app

Usage: node fly-api.js <command> [options]

Environment:
  FLY_API_TOKEN or FLY_API  - Fly.io API token (required)
  FLY_APP                    - App name (default: zeroerp)

App Commands:
  status              Full app status overview
  app                 Get app details
  releases            List recent releases
  health              Check health status
  regions             List available regions

Machine Commands:
  machines            List all machines
  machine <id>        Get machine details
  start <id>          Start a machine
  stop <id>           Stop a machine
  restart <id>        Restart a machine
  suspend <id>        Suspend a machine (snapshot state)
  cordon <id>         Stop routing traffic to machine
  uncordon <id>       Resume routing traffic to machine

Bulk Machine Commands:
  start-all           Start all machines
  stop-all            Stop all machines
  restart-all         Restart all machines

Volume Commands:
  volumes             List all volumes
  volume <id>         Get volume details
  volumes:create <name> <region> [size]
                      Create a new volume
  volumes:extend <id> <size>
                      Extend volume to new size (GB)
  volumes:delete <id> Delete a volume

Snapshot Commands:
  snapshots <volId>   List snapshots for a volume
  snapshots:create <volId>
                      Create a snapshot

Secrets Commands:
  secrets             List configured secrets
  secrets:set K=V     Set secrets (KEY=VALUE pairs)
  secrets:unset K     Remove secrets

Other Commands:
  events              Show recent machine events
  help                Show this help
`);
    },
  };

  if (!command || !commands[command]) {
    commands.help();
    process.exit(command ? 1 : 0);
  }

  try {
    await commands[command]();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run CLI if executed directly
if (process.argv[1].endsWith('fly-api.js')) {
  cli();
}

// Export for programmatic use
export {
  // Core API
  graphql,
  machinesApi,

  // App management
  getApp,
  listApps,
  getAppStatus,

  // Machine management
  listMachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine,
  startMachine,
  stopMachine,
  restartMachine,
  suspendMachine,
  cordonMachine,
  uncordonMachine,
  waitForMachine,
  getMachineEvents,

  // Bulk operations
  startAllMachines,
  stopAllMachines,
  restartAllMachines,

  // Machine leases
  acquireLease,
  getLease,
  releaseLease,

  // Machine metadata
  getMetadata,
  setMetadataKey,
  deleteMetadataKey,

  // Secrets
  listSecrets,
  setSecrets,
  unsetSecrets,

  // Releases
  listReleases,
  getDeploymentStatus,

  // Volumes
  listVolumes,
  getVolume,
  createVolume,
  extendVolume,
  deleteVolume,
  listSnapshots,
  createSnapshot,

  // Regions
  listRegions,

  // Health & monitoring
  getHealthChecks,
  getHostIssues,
  getRecentEvents,
};
