import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemData, DeviceInfo, BatteryInfo, TemperatureInfo } from '../../types/system';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { ResourceChartComponent } from '../charts/resource-chart.component';
import { CPUFrequencyCardComponent } from '../charts/cpu-frequency-card.component';
import { DiskUsageChartComponent } from '../charts/disk-usage-chart.component';
import { BatteryChartComponent } from '../charts/battery-chart.component';
import { CPUInfoCardComponent } from '../charts/cpu-info-card.component';

function formatBytes(bytes: number | string): string {
  if (typeof bytes === 'string') return bytes;
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.join(' ') || '0m';
}

@Component({
  selector: 'app-system-resources',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    ResourceChartComponent,
    CPUFrequencyCardComponent,
    DiskUsageChartComponent,
    BatteryChartComponent,
    CPUInfoCardComponent
  ],
  templateUrl: './system-resources.component.html'
})
export class SystemResourcesComponent {
  @Input() data: SystemData | null = null;
  @Input() deviceInfo: DeviceInfo | null = null;
  @Input() batteryInfo: BatteryInfo | null = null;
  @Input() temperatureInfo: TemperatureInfo | null = null;

  readonly diskRadius = 80;
  readonly diskCircumference = 2 * Math.PI * this.diskRadius;

  get diskUsedPercent(): number {
    return this.data?.disk?.usagePercent ?? 0;
  }

  get diskAvailablePercent(): number {
    const used = this.diskUsedPercent;
    return used >= 100 ? 0 : Math.max(0, 100 - used);
  }

  get diskUsedArc(): number {
    return this.diskCircumference * (this.diskUsedPercent / 100);
  }

  get diskAvailableArc(): number {
    return this.diskCircumference * (this.diskAvailablePercent / 100);
  }

  formatUptime = formatUptime;
  formatBytes = formatBytes;

  batteryLevelClass(percent: number): string {
    if (percent > 50) return 'text-green-400';
    if (percent > 20) return 'text-yellow-400';
    return 'text-red-400';
  }

  batteryBarClass(percent: number): string {
    if (percent > 50) return 'bg-green-500';
    if (percent > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  batteryStatusLabel(status: string): string {
    switch (status) {
      case 'CHARGING':
        return '🔌 Cargando';
      case 'DISCHARGING':
        return '🔋 Usando Batería';
      case 'FULL':
        return '✅ Completamente Cargada';
      case 'NOT_CHARGING':
        return '⏸️ No está Cargando';
      default:
        return status || 'N/A';
    }
  }

  batteryPluggedLabel(plugged: string): string {
    switch (plugged) {
      case 'UNPLUGGED':
        return '🔌 Desconectada';
      case 'PLUGGED_AC':
        return '🔌 Corriente AC';
      case 'PLUGGED_USB':
        return '🔌 USB';
      case 'PLUGGED_WIRELESS':
        return '📱 Wireless';
      default:
        return plugged || 'N/A';
    }
  }

  batteryHealthLabel(health: string): string {
    switch (health) {
      case 'GOOD':
        return '✨ Buena';
      case 'COLD':
        return '❄️ Fría';
      case 'OVERHEAT':
        return '🔥 Sobrecalentada';
      case 'DEAD':
        return '💀 Muerta';
      case 'OVER_VOLTAGE':
        return '⚡ Sobrevoltaje';
      case 'UNKNOWN':
        return '❓ Desconocida';
      default:
        return health || 'N/A';
    }
  }

  batteryTemperatureClass(temp: number): string {
    if (temp >= 45) return 'text-red-400';
    if (temp >= 40) return 'text-orange-400';
    if (temp >= 32.8) return 'text-yellow-400';
    return 'text-green-400';
  }

  batteryCurrentLabel(current: number): string {
    if (current === null || current === undefined) return 'N/A';
    if (current < 0) return `${Math.abs(current / 1000).toFixed(0)}mA ↓`;
    if (current > 0) return `${(current / 1000).toFixed(0)}mA ↑`;
    return '0mA';
  }

  batteryTimeRemaining(info: BatteryInfo | null): string {
    if (!info) return 'N/A';
    if (info.status === 'DISCHARGING' && info.current < 0) {
      const batteryCapacity = 4000; // mAh estimate
      const currentmA = Math.abs(info.current) / 1000;
      const remainingmAh = (info.percentage / 100) * batteryCapacity;
      const hoursRemaining = currentmA > 0 ? remainingmAh / currentmA : 0;

      if (hoursRemaining < 0.016) return '< 1 min';
      if (hoursRemaining < 1) return `${Math.round(hoursRemaining * 60)} min`;
      if (hoursRemaining < 24) return `${hoursRemaining.toFixed(1)}h`;
      return `${(hoursRemaining / 24).toFixed(1)}d`;
    }
    if (info.status === 'CHARGING') return '⚡ Cargando';
    return 'N/A';
  }

  progressStyle(percent: number) {
    return { width: `${Math.min(100, percent)}%` };
  }
}

