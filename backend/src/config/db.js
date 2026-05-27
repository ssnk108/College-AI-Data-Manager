import mongoose from "mongoose";

const BASE_RETRY_DELAY_MS = Number(process.env.DB_RETRY_BASE_MS || 5000);
const MAX_RETRY_DELAY_MS = Number(process.env.DB_RETRY_MAX_MS || 60000);

const colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m"
};

const dbState = {
  connecting: false,
  retryCount: 0,
  retryTimer: null,
  nextRetryAt: null,
  isShuttingDown: false,
  listenersInstalled: false,
  lastError: null,
  lastConnectedAt: null,
  lastDisconnectedAt: null
};

mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

function logDb(message, color = colors.cyan) {
  console.log(`${color}[database] ${message}${colors.reset}`);
}

function warnDb(message) {
  console.warn(`${colors.yellow}[database] ${message}${colors.reset}`);
}

function errorDb(message) {
  console.error(`${colors.red}[database] ${message}${colors.reset}`);
}

function getMongoUri() {
  return process.env.MONGO_URI || process.env.MONGODB_URI || "";
}

export function validateDatabaseEnv() {
  const uri = getMongoUri();
  const errors = [];

  if (!uri) errors.push("MONGO_URI or MONGODB_URI is missing in backend/.env");
  if (uri && !/^mongodb(\+srv)?:\/\//i.test(uri)) errors.push("MongoDB URI must start with mongodb:// or mongodb+srv://");
  if (uri && uri.includes("<db_password>")) errors.push("MongoDB URI still contains <db_password> placeholder");

  if (errors.length) {
    errors.forEach((error) => errorDb(error));
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

export function getDatabaseStatus() {
  const readyState = mongoose.connection.readyState;
  const stateText = ["disconnected", "connected", "connecting", "disconnecting"][readyState] || "unknown";

  return {
    connected: readyState === 1,
    connecting: readyState === 2 || dbState.connecting,
    database: stateText,
    readyState,
    retryCount: dbState.retryCount,
    nextRetryAt: dbState.nextRetryAt,
    lastConnectedAt: dbState.lastConnectedAt,
    lastDisconnectedAt: dbState.lastDisconnectedAt,
    lastError: dbState.lastError
  };
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

function getRetryDelay() {
  const exponent = Math.min(dbState.retryCount, 5);
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** exponent, MAX_RETRY_DELAY_MS);
}

function clearRetryTimer() {
  if (dbState.retryTimer) clearTimeout(dbState.retryTimer);
  dbState.retryTimer = null;
  dbState.nextRetryAt = null;
}

export function scheduleDatabaseReconnect(reason = "unknown") {
  if (dbState.isShuttingDown) return;
  if (isDatabaseConnected() || dbState.connecting || dbState.retryTimer) return;

  const delay = getRetryDelay();
  dbState.nextRetryAt = new Date(Date.now() + delay).toISOString();
  warnDb(`Retrying database connection in ${Math.round(delay / 1000)}s. Reason: ${reason}`);

  dbState.retryTimer = setTimeout(() => {
    dbState.retryTimer = null;
    dbState.nextRetryAt = null;
    connectDB().catch((error) => {
      dbState.lastError = error.message;
      scheduleDatabaseReconnect(error.message);
    });
  }, delay);
}

export function installDatabaseListeners() {
  if (dbState.listenersInstalled) return;
  dbState.listenersInstalled = true;

  mongoose.connection.on("connected", () => {
    dbState.lastConnectedAt = new Date().toISOString();
    dbState.lastError = null;
    dbState.retryCount = 0;
    clearRetryTimer();
    logDb("MongoDB connected", colors.green);
  });

  mongoose.connection.on("disconnected", () => {
    dbState.lastDisconnectedAt = new Date().toISOString();
    warnDb("MongoDB disconnected");
    scheduleDatabaseReconnect("disconnected event");
  });

  mongoose.connection.on("reconnected", () => {
    dbState.lastConnectedAt = new Date().toISOString();
    dbState.lastError = null;
    dbState.retryCount = 0;
    clearRetryTimer();
    logDb("MongoDB reconnected successfully", colors.green);
  });

  mongoose.connection.on("reconnecting", () => {
    warnDb("MongoDB driver is reconnecting");
  });

  mongoose.connection.on("error", (error) => {
    dbState.lastError = error.message;
    errorDb(`MongoDB error: ${error.message}`);
  });
}

export async function connectDB() {
  installDatabaseListeners();
  const validation = validateDatabaseEnv();
  if (!validation.valid) {
    dbState.lastError = validation.errors.join("; ");
    scheduleDatabaseReconnect("invalid or missing MongoDB URI");
    return false;
  }

  if (mongoose.connection.readyState === 1) return true;
  if (mongoose.connection.readyState === 2 || dbState.connecting) return false;

  dbState.connecting = true;
  dbState.retryCount += 1;
  logDb(`Connection attempt ${dbState.retryCount}`);

  try {
    await mongoose.connect(getMongoUri(), {
      serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || 8000),
      connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
      socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT_MS || 45000),
      maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE || 10),
      minPoolSize: Number(process.env.DB_MIN_POOL_SIZE || 0)
    });
    return true;
  } catch (error) {
    dbState.lastError = error.message;
    errorDb(`Connection attempt failed: ${error.message}`);
    dbState.connecting = false;
    scheduleDatabaseReconnect(error.message);
    return false;
  } finally {
    dbState.connecting = false;
  }
}

export async function startDatabaseConnection() {
  installDatabaseListeners();
  await connectDB();
}

export async function shutdownDatabase() {
  dbState.isShuttingDown = true;
  clearRetryTimer();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    logDb("MongoDB connection closed", colors.yellow);
  }
}
