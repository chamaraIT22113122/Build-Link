const { spawn } = require('child_process');
const path = require('path');

const webPort = process.env.PORT || '8080';
const apiPort = process.env.INTERNAL_API_PORT || '5050';

console.log(`[BuildLink Azure Host] Starting Express API on internal port ${apiPort} and Next.js Web on port ${webPort}...`);

// 1. Start Express API Server on internal port 5050
const apiProcess = spawn(process.execPath, [path.join(__dirname, 'apps', 'api', 'dist', 'server.js')], {
  cwd: path.join(__dirname, 'apps', 'api'),
  env: {
    ...process.env,
    PORT: apiPort,
  },
  stdio: 'inherit',
});

apiProcess.on('error', (err) => {
  console.error('[BuildLink Azure Host] API process error:', err);
});

// 2. Start Next.js Web Server on Azure public PORT
const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
const webProcess = spawn(process.execPath, [nextBin, 'start', '-p', String(webPort)], {
  cwd: path.join(__dirname, 'apps', 'web'),
  env: {
    ...process.env,
    PORT: String(webPort),
    INTERNAL_API_ORIGIN: `http://127.0.0.1:${apiPort}`,
  },
  stdio: 'inherit',
});

webProcess.on('error', (err) => {
  console.error('[BuildLink Azure Host] Web process error:', err);
  process.exit(1);
});

webProcess.on('exit', (code) => {
  console.log(`[BuildLink Azure Host] Web process exited with code ${code}`);
  apiProcess.kill();
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  apiProcess.kill('SIGTERM');
  webProcess.kill('SIGTERM');
});
