const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { spawn } = require('child_process');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;
let backendProcess = null;

// Backend server configuration
const BACKEND_PORT = 5000;
const FRONTEND_PORT = 3000;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    autoHideMenuBar: true, // Hide menu bar in production
    frame: true
  });

  // Load the app
  // Check if we should use dev server or built files
  const useDevServer = isDev && process.env.USE_DEV_SERVER === 'true';
  const startUrl = useDevServer
    ? `http://localhost:${FRONTEND_PORT}` 
    : `file://${path.join(__dirname, 'dist/index.html')}`;
    
  console.log('Loading URL:', startUrl);
  console.log('isDev:', isDev, 'USE_DEV_SERVER:', process.env.USE_DEV_SERVER);
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    
    // Only open dev tools if explicitly requested
    if (isDev && process.env.OPEN_DEVTOOLS === 'true') {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== `http://localhost:${FRONTEND_PORT}` && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
    }
  });
}

function startBackend() {
  return new Promise(async (resolve, reject) => {
    // First check if backend is already running
    try {
      const fetch = require('node-fetch');
      const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`, { timeout: 2000 });
      if (response.ok) {
        console.log('Backend already running on port', BACKEND_PORT, '- skipping startup');
        resolve();
        return;
      }
    } catch (error) {
      console.log('No existing backend found, starting new one...');
    }
    
    const backendPath = path.join(__dirname, '..', 'backend');
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    console.log('Starting backend server...');
    console.log('Backend path:', backendPath);
    
    // Check if backend files exist
    const appPyPath = path.join(backendPath, 'app.py');
    if (!fs.existsSync(appPyPath)) {
      console.error('Backend app.py not found at:', appPyPath);
      reject(new Error('Backend files not found'));
      return;
    }
    
    // Use virtual environment if available (Windows vs Unix paths)
    const isWindows = process.platform === 'win32';
    const venvBinDir = isWindows ? path.join(backendPath, 'venv', 'Scripts') : path.join(backendPath, 'venv', 'bin');
    const venvPython = isWindows ? path.join(venvBinDir, 'python.exe') : path.join(venvBinDir, 'python');
    const pythonExecutable = fs.existsSync(venvPython) ? venvPython : pythonCommand;
    
    console.log('Platform:', process.platform);
    console.log('Virtual environment directory:', venvBinDir);
    console.log('Using Python executable:', pythonExecutable);
    console.log('Python executable exists:', fs.existsSync(pythonExecutable));
    console.log('Backend working directory:', backendPath);
    
    // Prepare environment with virtual environment
    const pathSeparator = isWindows ? ';' : ':';
    const env = {
      ...process.env,
      PYTHONPATH: backendPath,
      FLASK_ENV: 'production',
      FLASK_DEBUG: '0',
      PATH: `${venvBinDir}${pathSeparator}${process.env.PATH}`
    };
    
    // Start the Python backend with Gunicorn for production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      // Use Gunicorn for production (Windows vs Unix paths)
      const gunicornExecutable = isWindows ? path.join(venvBinDir, 'gunicorn.exe') : path.join(venvBinDir, 'gunicorn');
      console.log('Using Gunicorn executable:', gunicornExecutable);
      console.log('Gunicorn executable exists:', fs.existsSync(gunicornExecutable));
      
      backendProcess = spawn(gunicornExecutable, ['-w', '1', '-b', '0.0.0.0:5000', '--timeout', '120', 'app:app'], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: env
      });
    } else {
      // Use Flask dev server for development
      backendProcess = spawn(pythonExecutable, ['app.py'], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: env
      });
    }
    
    // Log backend output for debugging
    backendProcess.stdout.on('data', (data) => {
      console.log('Backend stdout:', data.toString().trim());
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error('Backend stderr:', data.toString().trim());
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      if (code !== 0 && !app.isQuitting) {
        dialog.showErrorBox(
          'Backend Error', 
          `The horary calculation service stopped unexpectedly (code ${code}). Please restart the application.`
        );
      }
    });

    // Give the backend more time to start and check if it's actually running
    let startupTimeout = 0;
    const checkBackend = async () => {
      try {
        const fetch = require('node-fetch');
        const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`, { timeout: 2000 });
        if (response.ok) {
          console.log('Backend is ready on port', BACKEND_PORT);
          resolve();
        } else {
          throw new Error('Backend not ready');
        }
      } catch (error) {
        startupTimeout += 1000;
        if (startupTimeout < 15000) { // Wait up to 15 seconds
          console.log('Waiting for backend...', startupTimeout/1000, 'seconds');
          setTimeout(checkBackend, 1000);
        } else {
          console.log('Backend startup timeout, continuing anyway');
          resolve();
        }
      }
    };
    
    // Start checking after initial delay
    setTimeout(checkBackend, 3000);
  });
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Start backend first
    await startBackend();
    
    // Then create the window
    createWindow();
    
    // Handle activate (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
    
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox(
      'Startup Error',
      'Failed to start the horary calculation service. Please ensure Python is installed and try again.'
    );
    app.quit();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up before quitting
app.on('before-quit', () => {
  app.isQuitting = true;
  stopBackend();
});

// IPC handlers for communication with renderer
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev && url.includes('localhost')) {
    // In development, ignore certificate errors for localhost
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});

// Export for testing
module.exports = { app, createWindow, startBackend, stopBackend };