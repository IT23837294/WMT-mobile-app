const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const port = process.env.PORT || '5000';

const parsePidsFromWindowsNetstat = (output) => {
  const pids = new Set();

  output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (!line.includes(`:${port}`) || !line.includes('LISTENING')) {
        return;
      }

      const parts = line.split(/\s+/);
      const pid = parts[parts.length - 1];

      if (/^\d+$/.test(pid)) {
        pids.add(pid);
      }
    });

  return [...pids];
};

const getPidsUsingPort = () => {
  if (process.platform === 'win32') {
    const netstatOutput = execSync(`cmd /c "netstat -ano | findstr LISTENING | findstr :${port}"`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8'
    });

    return parsePidsFromWindowsNetstat(netstatOutput);
  }

  const lsofOutput = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
    stdio: ['ignore', 'pipe', 'ignore'],
    encoding: 'utf8'
  });

  return [...new Set(
    lsofOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^\d+$/.test(line))
  )];
};

const stopPid = (pid) => {
  if (process.platform === 'win32') {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    return;
  }

  execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
};

try {
  const pids = getPidsUsingPort();

  if (pids.length === 0) {
    console.log(`Port ${port} is free.`);
    process.exit(0);
  }

  pids.forEach((pid) => {
    try {
      stopPid(pid);
      console.log(`Stopped process ${pid} using port ${port}.`);
    } catch (error) {
      console.warn(`Could not stop process ${pid} on port ${port}.`);
    }
  });
} catch (error) {
  console.warn(`Could not inspect port ${port}. Starting dev server anyway.`);
}
