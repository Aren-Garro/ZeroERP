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

Commands:
  status              Full app status overview
  app                 Get app details
  machines            List all machines
  machine <id>        Get machine details
  start <id>          Start a machine
  stop <id>           Stop a machine
  secrets             List configured secrets
  secrets:set K=V     Set secrets (KEY=VALUE pairs)
  secrets:unset K     Remove secrets
  releases            List recent releases
  events              Show recent machine events
  health              Check health status
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
  graphql,
  machinesApi,
  getApp,
  listApps,
  listMachines,
  getMachine,
  startMachine,
  stopMachine,
  getMachineEvents,
  listSecrets,
  setSecrets,
  unsetSecrets,
  listReleases,
  getDeploymentStatus,
  getHealthChecks,
  getHostIssues,
  getAppStatus,
  getRecentEvents,
};
