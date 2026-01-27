export interface ChartPoint {
  value: number;
  time: string;
}

export interface SystemData {
  cpu: number;
  cpuHistory?: ChartPoint[];
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  memoryHistory?: ChartPoint[];
  disk: {
    total: string;
    used: string;
    available: string;
    usagePercent: number;
  };
  diskHistory?: ChartPoint[];
  swap: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  load: {
    load1: string;
    load5: string;
    load15: string;
  };
  processes: Process[];
  ports?: Port[];
  temperature?: {
    current: string;
    available: boolean;
  };
  info: {
    hostname: string;
    platform: string;
    arch: string;
    kernel?: string;
    uptime: number;
    cpus: number;
    cpuModels?: string[];
    cpuModelSummary?: string;
  };
  cpuDetails?: {
    architecture: string;
    cpuOpModes: string;
    byteOrder: string;
    cpuCount: string;
    onlineCpus: string;
    vendorId: string;
    cpuModels: string[];
    cpuModelSummary: string;
    threadsPerCore: string;
    coresPerSocket: string;
    sockets: string;
    cpuMaxMhz: string;
    cpuMinMhz: string;
    cpuScalingMhz: string;
    flags: string;
    mhzDetails: Array<{ key: string; value: string }>;
  };
  distro?: {
    distributor: string;
    description: string;
    release: string;
    codename: string;
  };
  timestamp: number;
}

export interface Process {
  user: string;
  pid: string;
  cpu: string;
  mem: string;
  vsz: string;
  rss: string;
  tty: string;
  stat: string;
  start: string;
  time: string;
  command: string;
}

export interface Port {
  protocol: string;
  port: string;
  address: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  message: string;
}

export interface DeviceInfo {
  isTermux: boolean;
  manufacturer: string;
  model: string;
  androidVersion: string;
  cpuArchitecture: string;
  kernelVersion: string;
  termuxVersion: string;
}

export interface BatteryInfo {
  isAvailable: boolean;
  percentage: number;
  status: string;
  plugged: string;
  health: string;
  temperature: number;
  current: number;
}

export interface TemperatureSensor {
  name: string;
  temperature: number;
  type: 'CPU' | 'GPU';
  status: 'normal' | 'moderate' | 'warning' | 'critical';
}

export interface TemperatureInfo {
  isAvailable: boolean;
  sensors: TemperatureSensor[];
  averageTemp?: number | string;
  maxTemp?: number | string;
}
