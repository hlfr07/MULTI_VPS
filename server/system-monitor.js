import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Historial de métricas
const MAX_HISTORY = 20;
const cpuHistory = [];
const memoryHistory = [];
const diskHistory = [];

function addToHistory(array, value) {
  const time = new Date().toLocaleTimeString();
  array.push({ value, time });
  if (array.length > MAX_HISTORY) {
    array.shift();
  }
}

export async function getCPUUsage() {
  try {
    const { stdout } = await execAsync(
      `ps -A -o %cpu | awk '{sum+=$1} END {printf "%.1f", sum}'`
    );

    const cpu = parseFloat(stdout.trim());

    // Protección
    if (isNaN(cpu)) return 0;

    return cpu;
  } catch (err) {
    console.error('CPU error:', err.message);
    return 0;
  }
}

export async function getMemoryUsage() {
  try {
    const { stdout } = await execAsync(
      `free -b | awk '/Mem:/ {print $2,$7}'`
    );

    const [total, available] = stdout.trim().split(/\s+/).map(Number);

    const used = total - available;

    return {
      total,
      used,
      free: available,
      usagePercent: Number(((used / total) * 100).toFixed(1))
    };
  } catch (err) {
    console.error('RAM error:', err.message);
    return {
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0
    };
  }
}

export async function getDiskUsage() {
  try {
    const { stdout } = await execAsync("df -h");
    const lines = stdout.trim().split('\n');
    let diskInfo = null;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      const mountPoint = parts[parts.length - 1];
      const filesystem = parts[0];

      if (
        mountPoint === '/data' ||
        mountPoint === '/storage/emulated' ||
        (diskInfo === null && mountPoint === '/')
      ) {
        diskInfo = {
          filesystem,
          total: parts[1],
          used: parts[2],
          available: parts[3],
          usagePercent: parseInt(parts[4]) || 0
        };
        if (mountPoint === '/data') break;
      }
    }

    return diskInfo || { total: 'N/A', used: 'N/A', available: 'N/A', usagePercent: 0 };
  } catch (error) {
    return { total: 'N/A', used: 'N/A', available: 'N/A', usagePercent: 0 };
  }
}


export async function getSwapUsage() {
  try {
    // Usar free para obtener swap
    const { stdout } = await execAsync("free -b | grep Swap | awk '{print $2,$3,$4}'");
    const [total, used, free] = stdout.trim().split(' ').map(Number);

    if (total === 0) {
      return { total: 0, used: 0, free: 0, usagePercent: 0 };
    }

    return {
      total,
      used,
      free,
      usagePercent: (used / total) * 100
    };
  } catch (error) {
    return { total: 0, used: 0, free: 0, usagePercent: 0 };
  }
}

export async function getSystemLoad() {
  const loadavg = os.loadavg();
  return {
    load1: loadavg[0].toFixed(2),
    load5: loadavg[1].toFixed(2),
    load15: loadavg[2].toFixed(2)
  };
}

export async function getProcessList() {
  try {
    // ps aux funciona en DroidVPS
    const { stdout } = await execAsync("ps aux --sort=-%mem | head -20");
    const lines = stdout.trim().split('\n');
    const processes = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 11) {
        processes.push({
          user: parts[0],
          pid: parts[1],
          cpu: parts[2],
          mem: parts[3],
          vsz: parts[4],
          rss: parts[5],
          tty: parts[6],
          stat: parts[7],
          start: parts[8],
          time: parts[9],
          command: parts.slice(10).join(' ')
        });
      }
    }

    return processes;
  } catch (error) {
    return [];
  }
}

export async function getCPUDetails() {
  try {
    const { stdout } = await execAsync('lscpu');
    const lines = stdout.split('\n');

    const details = {};
    const modelNames = new Set(); // 👈 aquí está la clave

    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (!key || valueParts.length === 0) return;

      const value = valueParts.join(':').trim();
      const cleanKey = key.trim();

      // Guardar valores normales
      details[cleanKey] = value;

      // Capturar múltiples modelos
      if (cleanKey === 'Model name') {
        modelNames.add(value);
      }
    });

    // Fallback usando os.cpus()
    if (modelNames.size === 0) {
      os.cpus().forEach(cpu => {
        if (cpu?.model) modelNames.add(cpu.model);
      });
    }

    /* ===== MHz details (NO TOCAR) ===== */
    const cpuScaling = [];
    try {
      const { stdout: mhzOut } = await execAsync('lscpu | grep "MHz"');
      mhzOut
        .split('\n')
        .filter(l => l.trim())
        .forEach(line => {
          const [key, value] = line.split(':').map(s => s.trim());
          if (key && value) cpuScaling.push({ key, value });
        });
    } catch {
      lines.forEach(line => {
        if (line.toLowerCase().includes('mhz')) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            cpuScaling.push({
              key: key.trim(),
              value: valueParts.join(':').trim()
            });
          }
        }
      });
    }

    const cpuModelsArray = [...modelNames];

    return {
      architecture: details['Architecture'] || os.arch(),
      cpuOpModes: details['CPU op-mode(s)'] || 'N/A',
      byteOrder:
        details['Byte Order'] ||
        (os.endianness() === 'LE' ? 'Little Endian' : 'Big Endian'),

      cpuCount: details['CPU(s)'] || os.cpus().length.toString(),
      onlineCpus: details['On-line CPU(s) list'] || 'N/A',
      vendorId: details['Vendor ID'] || 'N/A',

      // 👇 AHORA CORRECTO
      cpuModels: cpuModelsArray,
      cpuModelSummary: cpuModelsArray.join(' + '),

      threadsPerCore: details['Thread(s) per core'] || 'N/A',
      coresPerSocket: details['Core(s) per socket'] || 'N/A',
      sockets: details['Socket(s)'] || 'N/A',

      cpuMaxMhz:
        details['CPU max MHz'] ||
        details['CPU MHz'] ||
        os.cpus()[0]?.speed?.toString() ||
        'N/A',

      cpuMinMhz: details['CPU min MHz'] || 'N/A',
      cpuScalingMhz: details['CPU(s) scaling MHz'] || 'N/A',
      flags: details['Flags'] || 'N/A',

      mhzDetails: cpuScaling // 👈 SE QUEDA TAL CUAL
    };

  } catch (error) {
    const cpus = os.cpus();
    const models = [...new Set(cpus.map(c => c.model).filter(Boolean))];

    return {
      architecture: os.arch(),
      cpuOpModes: 'N/A',
      byteOrder: os.endianness() === 'LE' ? 'Little Endian' : 'Big Endian',
      cpuCount: cpus.length.toString(),
      onlineCpus: 'N/A',
      vendorId: 'N/A',

      cpuModels: models,
      cpuModelSummary: models.join(' + '),

      threadsPerCore: 'N/A',
      coresPerSocket: 'N/A',
      sockets: 'N/A',
      cpuMaxMhz: cpus[0]?.speed?.toString() || 'N/A',
      cpuMinMhz: 'N/A',
      cpuScalingMhz: 'N/A',
      flags: 'N/A',

      mhzDetails: []
    };
  }
}

export async function getSystemInfo() {
  try {
    const { stdout: lscpuOut } = await execAsync('lscpu');
    const lines = lscpuOut.trim().split('\n');

    const info = {};
    const modelNames = new Set(); // 👈 clave

    lines.forEach(line => {
      const [key, ...rest] = line.split(':');
      if (!key || rest.length === 0) return;

      const value = rest.join(':').trim();

      switch (key.trim()) {
        case 'Architecture':
          info.arch = value;
          break;

        case 'CPU(s)':
          info.cpus = parseInt(value);
          break;

        case 'On-line CPU(s) list':
          info.online = value;
          break;

        case 'Vendor ID':
          info.vendor = value;
          break;

        case 'Model name':
          modelNames.add(value); // 👈 ahora guardamos todos
          break;

        case 'CPU max MHz':
          info.maxMHz = parseFloat(value);
          break;

        case 'CPU min MHz':
          info.minMHz = parseFloat(value);
          break;

        case 'Thread(s) per core':
          info.threadsPerCore = parseInt(value);
          break;

        case 'Core(s) per socket':
          info.coresPerSocket = parseInt(value);
          break;

        case 'Socket(s)':
          info.sockets = parseInt(value);
          break;
      }
    });

    // fallback si lscpu no devolvió modelos
    if (modelNames.size === 0) {
      os.cpus().forEach(cpu => {
        if (cpu?.model) modelNames.add(cpu.model);
      });
    }

    const cpuModelsArray = [...modelNames];

    // hostname y kernel
    const { stdout: unameOut } = await execAsync('uname -a');
    const unameParts = unameOut.trim().split(' ');

    info.hostname = unameParts[1] || os.hostname();
    info.kernel = unameParts[2] || 'N/A';
    info.uptime = os.uptime();

    // 👇 NUEVO (coherente con getCPUDetails)
    info.cpuModels = cpuModelsArray;
    info.cpuModelSummary = cpuModelsArray.join(' + ');

    return info;

  } catch (error) {
    const cpus = os.cpus();
    const models = [...new Set(cpus.map(c => c.model).filter(Boolean))];

    return {
      hostname: os.hostname(),
      arch: os.arch(),
      cpus: cpus.length,
      kernel: 'N/A',
      uptime: os.uptime(),

      cpuModels: models,
      cpuModelSummary: models.join(' + ')
    };
  }
}


export async function getDistroInfo() {
  try {
    // lsb_release funciona en DroidVPS
    const { stdout } = await execAsync('lsb_release -a 2>/dev/null');
    const lines = stdout.split('\n');
    const info = {};

    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        info[key.trim()] = valueParts.join(':').trim();
      }
    });
    // Si no hay distributor pondremos que es Termux
    return {
      distributor: info['Distributor ID'] || 'Termux',
      description: info['Description'] || 'Termux',
      release: info['Release'] || 'Termux',
      codename: info['Codename'] || 'Termux'
    };
  } catch (error) {
    return {
      distributor: 'Termux',
      description: 'Termux',
      release: 'Termux',
      codename: 'Termux'
    };
  }
}

export async function getAllSystemData() {
  const [cpu, memory, disk, swap, load, processes, info, cpuDetails, distro] = await Promise.all([
    getCPUUsage(),
    getMemoryUsage(),
    getDiskUsage(),
    getSwapUsage(),
    getSystemLoad(),
    getProcessList(),
    getSystemInfo(),
    getCPUDetails(),
    getDistroInfo()
  ]);

  // Agregar al historial
  addToHistory(cpuHistory, cpu);
  addToHistory(memoryHistory, memory.usagePercent);
  addToHistory(diskHistory, disk.usagePercent);

  return {
    cpu,
    cpuHistory: [...cpuHistory],
    memory,
    memoryHistory: [...memoryHistory],
    disk,
    diskHistory: [...diskHistory],
    swap,
    load,
    processes,
    info,
    cpuDetails,
    distro,
    timestamp: Date.now()
  };
}

export async function getDeviceInfo() {
  try {
    let stdout = '';
    try {
      const result = await execAsync('termux-info 2>/dev/null');
      stdout = result.stdout;
    } catch (execError) {
      // Si termux-info falla, no estamos en Termux
      console.log('termux-info not available, not in Termux environment');
      return {
        isTermux: false,
        manufacturer: 'Unknown',
        model: 'Unknown',
        androidVersion: 'Unknown',
        cpuArchitecture: 'Unknown',
        kernelVersion: 'Unknown',
        termuxVersion: 'Unknown'
      };
    }

    const info = {
      isTermux: true,
      manufacturer: 'Unknown',
      model: 'Unknown',
      androidVersion: 'Unknown',
      cpuArchitecture: 'Unknown',
      kernelVersion: 'Unknown',
      termuxVersion: 'Unknown'
    };

    // Parsear información del dispositivo
    const manufacturerMatch = stdout.match(/Device manufacturer:\s*(.+)/);
    const modelMatch = stdout.match(/Device model:\s*(.+)/);
    const androidMatch = stdout.match(/Android version:\s*(.+)/);
    const archMatch = stdout.match(/Packages CPU architecture:\s*(.+)/);
    const kernelMatch = stdout.match(/Kernel build information:\s*Linux\s+\S+\s+([^\s]+)/);
    const termuxMatch = stdout.match(/termux-tools version:\s*(.+)/);

    if (manufacturerMatch) info.manufacturer = manufacturerMatch[1].trim();
    if (modelMatch) info.model = modelMatch[1].trim();
    if (androidMatch) info.androidVersion = androidMatch[1].trim();
    if (archMatch) info.cpuArchitecture = archMatch[1].trim();
    if (kernelMatch) info.kernelVersion = kernelMatch[1].trim();
    if (termuxMatch) info.termuxVersion = termuxMatch[1].trim();

    return info;
  } catch (error) {
    console.error('Error getting device info:', error.message);
    return {
      isTermux: false,
      manufacturer: 'Unknown',
      model: 'Unknown',
      androidVersion: 'Unknown',
      cpuArchitecture: 'Unknown',
      kernelVersion: 'Unknown',
      termuxVersion: 'Unknown'
    };
  }
}

export async function getBatteryInfo() {
  try {
    let stdout = '';
    try {
      const result = await execAsync('termux-battery-status 2>/dev/null');
      stdout = result.stdout;
    } catch (execError) {
      // Si termux-battery-status falla, batería no disponible
      console.log('termux-battery-status not available, battery info not accessible');
      return {
        isAvailable: false,
        percentage: 0,
        status: 'UNKNOWN',
        plugged: 'UNKNOWN',
        health: 'UNKNOWN',
        temperature: 0,
        current: 0
      };
    }

    // Validar que el stdout no esté vacío
    if (!stdout || stdout.trim().length === 0) {
      console.log('Empty battery status output');
      return {
        isAvailable: false,
        percentage: 0,
        status: 'UNKNOWN',
        plugged: 'UNKNOWN',
        health: 'UNKNOWN',
        temperature: 0,
        current: 0
      };
    }

    // Parsear JSON de la salida
    const batteryData = JSON.parse(stdout.trim());

    return {
      isAvailable: true,
      percentage: batteryData.percentage || 0,
      status: batteryData.status || 'UNKNOWN',
      plugged: batteryData.plugged || 'UNKNOWN',
      health: batteryData.health || 'UNKNOWN',
      temperature: batteryData.temperature || 0,
      current: batteryData.current || 0
    };
  } catch (error) {
    console.error('Error getting battery info:', error.message);
    return {
      isAvailable: false,
      percentage: 0,
      status: 'UNKNOWN',
      plugged: 'UNKNOWN',
      health: 'UNKNOWN',
      temperature: 0,
      current: 0
    };
  }
}

export async function getTemperatureInfo() {
  try {
    const script = `for z in /sys/class/thermal/thermal_zone*; do
  type=$(cat "$z/type" 2>/dev/null)
  temp=$(cat "$z/temp" 2>/dev/null)

  case "$type" in
    *cpu*|*cpuss*|*gpu*)
      if [ -n "$temp" ] && [ "$temp" -gt 10000 ] && [ "$temp" -lt 100000 ]; then
        echo "$type: $(awk "BEGIN {print $temp/1000}") °C"
      fi
    ;;
  esac
done`;

    const { stdout } = await execAsync(script);

    if (!stdout || stdout.trim().length === 0) {
      return {
        isAvailable: false,
        sensors: []
      };
    }

    const sensors = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parsear línea como "cpuss-0-usr: 45.7 °C"
      const match = line.match(/^(.+?):\s*([\d.]+)\s*°?C/);
      if (match) {
        const name = match[1].trim();
        const temperature = parseFloat(match[2]);

        sensors.push({
          name,
          temperature,
          type: name.toLowerCase().includes('gpu') ? 'GPU' : 'CPU',
          status: getTemperatureStatus(temperature)
        });
      }
    }

    // Ordenar sensores: GPU primero, luego CPU
    sensors.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'GPU' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      isAvailable: sensors.length > 0,
      sensors,
      averageTemp: sensors.length > 0
        ? (sensors.reduce((sum, s) => sum + s.temperature, 0) / sensors.length).toFixed(1)
        : 0,
      maxTemp: sensors.length > 0
        ? Math.max(...sensors.map(s => s.temperature)).toFixed(1)
        : 0
    };
  } catch (error) {
    console.error('Error getting temperature info:', error.message);
    return {
      isAvailable: false,
      sensors: []
    };
  }
}

function getTemperatureStatus(temp) {
  if (temp >= 75) return 'critical';   // 🔴 riesgo real
  if (temp >= 65) return 'warning';    // 🟠 throttling
  if (temp >= 50) return 'moderate';   // 🟡 carga normal
  return 'normal';                     // 🟢 frío / idle
}

export async function createProotDistro(name, port) {
  console.log('Creating proot distro:', name, port);

  if (!name || !port) {
    throw new Error('name and port are required');
  }

  const distroBase = 'debian'; // base para clonar
  const distroName = `${distroBase}-${name}-${port}`;

  //Antes de crear verificamos si ya existe
  const existingDistros = await listProotDistros();
  if (existingDistros.some(d => d.nombreCompleto === distroName)) {
    throw new Error(`Distro with name ${distroName} already exists`);
  }

  // OJO: no se define PREFIX en JS, se usa desde el shell
  await execAsync(`
    cd $PREFIX/var/lib/proot-distro/installed-rootfs || exit 1
    cp -a ${distroBase} ${distroName}

    cat > $PREFIX/etc/proot-distro/${distroName}.sh << 'EOF'
DISTRO_NAME="${distroName}"
DISTRO_COMMENT="Debian ${name} Distro ${port}"
TARBALL_URL=""
EOF
  `);



  return {
    distro: distroName,
    message: 'Proot distro created successfully'
  };
}

export async function deleteProotDistro(nombreCompleto) {
  if (!nombreCompleto) {
    throw new Error('nombreCompleto is required');
  }

  await execAsync(`
    screen -S ${nombreCompleto} -X quit 2>/dev/null || true
    rm -rf $PREFIX/var/lib/proot-distro/installed-rootfs/${nombreCompleto}
    rm -f $PREFIX/etc/proot-distro/${nombreCompleto}.sh
  `);

  return {
    distro: nombreCompleto,
    message: 'Proot distro deleted successfully'
  };
}


export async function listProotDistros() {
  try {
    // Capturamos stdout y stderr
    const { stdout, stderr } = await execAsync('proot-distro list');
    const output = stdout + stderr; // combinamos por si aparece en stderr

    const lines = output.trim().split('\n').filter(Boolean);

    const distros = lines.map(line => {
      const match = line.match(/(debian-[\w-]+)-(\d+)/);
      if (match) {
        return {
          nombreCompleto: match[0], // ej. "debian-node-3000"
          nombre: match[1],         // ej. "debian-node"
          puerto: match[2]          // ej. "3000"
        };
      }
      return null;
    }).filter(Boolean);

    return distros;
  } catch (error) {
    console.error('Error listing proot distros:', error.message);
    return [];
  }
}


