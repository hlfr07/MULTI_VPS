import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatteryInfo } from '../../types/system';

@Component({
  selector: 'app-battery-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Vista para servidor sin batería -->
    <div *ngIf="!batteryInfo || !batteryInfo.isAvailable" class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-full">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2.5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">🖥️</div>
        <div>
          <h2 class="text-xl font-bold text-white">Estado del Servidor</h2>
          <p class="text-sm text-slate-400">{{ batteryInfo?.status === 'AC_POWER' ? 'Alimentación AC' : 'Servidor activo' }}</p>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center">
        <!-- Indicador de estado -->
        <div class="relative w-48 h-48 mb-6">
          <svg class="transform -rotate-90 w-48 h-48" viewBox="0 0 192 192">
            <!-- Círculo de fondo -->
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              stroke-width="12"
              fill="transparent"
              class="text-slate-700"
            />
            <!-- Círculo de progreso (siempre lleno para servidor) -->
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              stroke-width="12"
              fill="transparent"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="0"
              class="stroke-green-500 transition-all duration-500 ease-in-out"
              stroke-linecap="round"
            />
          </svg>
          
          <!-- Contenido central -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-5xl mb-2">{{ batteryInfo?.status === 'AC_POWER' ? '⚡' : '🟢' }}</span>
            <span class="text-green-400 text-xl font-bold">Activo</span>
          </div>
        </div>

        <!-- Información del servidor -->
        <div class="grid grid-cols-2 gap-4 w-full">
          <div class="bg-slate-700/30 rounded-lg p-3 text-center">
            <p class="text-xs text-slate-500 mb-1">Energía</p>
            <p class="text-sm font-semibold text-green-400">
              {{ batteryInfo?.status === 'AC_POWER' ? 'AC Conectado' : 'En línea' }}
            </p>
          </div>
          <div class="bg-slate-700/30 rounded-lg p-3 text-center">
            <p class="text-xs text-slate-500 mb-1">Uptime</p>
            <p class="text-sm font-semibold text-cyan-400">{{ formatUptime(uptime) }}</p>
          </div>
        </div>

        <!-- Mensaje informativo -->
        <div *ngIf="batteryInfo?.message" class="mt-4 p-3 bg-slate-700/30 rounded-lg text-center w-full">
          <p class="text-xs text-slate-400">{{ batteryInfo.message }}</p>
        </div>
      </div>
    </div>

    <!-- Vista para dispositivo con batería -->
    <div *ngIf="batteryInfo && batteryInfo.isAvailable" class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2.5 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">🔋</div>
        <div>
          <h2 class="text-xl font-bold text-white">Estado de Batería</h2>
          <p class="text-sm text-slate-400">Nivel actual de carga</p>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center">
        <!-- Gráfico circular -->
        <div class="relative w-48 h-48 mb-6">
          <svg class="transform -rotate-90 w-48 h-48" viewBox="0 0 192 192">
            <!-- Círculo de fondo -->
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              stroke-width="12"
              fill="transparent"
              class="text-slate-700"
            />
            <!-- Círculo de progreso -->
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              stroke-width="12"
              fill="transparent"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="offset"
              [ngClass]="strokeClass"
              stroke-linecap="round"
              class="transition-all duration-500 ease-in-out"
            />
          </svg>
          
          <!-- Contenido central -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-5xl mb-2">{{ getStatusIcon() }}</span>
            <span [ngClass]="textClass + ' text-4xl font-bold'">{{ batteryInfo.percentage }}%</span>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="grid grid-cols-2 gap-4 w-full">
          <div class="bg-slate-700/30 rounded-lg p-3 text-center">
            <p class="text-xs text-slate-500 mb-1">Estado</p>
            <p class="text-sm font-semibold text-white">{{ getStatusLabel() }}</p>
          </div>
          <div class="bg-slate-700/30 rounded-lg p-3 text-center">
            <p class="text-xs text-slate-500 mb-1">Temperatura</p>
            <p [ngClass]="batteryInfo.temperature >= 45 ? 'text-red-400' : batteryInfo.temperature >= 40 ? 'text-orange-400' : 'text-green-400'" class="text-sm font-semibold">
              {{ batteryInfo.temperature.toFixed(1) }}°C
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BatteryChartComponent {
  @Input() batteryInfo: BatteryInfo | null = null;
  @Input() uptime: number = 0;

  private readonly radius = 80;

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get offset(): number {
    if (!this.batteryInfo) return this.circumference;
    return this.circumference - (this.batteryInfo.percentage / 100) * this.circumference;
  }

  get strokeClass(): string {
    if (!this.batteryInfo) return 'stroke-blue-500';
    if (this.batteryInfo.percentage > 50) return 'stroke-green-500';
    if (this.batteryInfo.percentage > 20) return 'stroke-yellow-500';
    return 'stroke-red-500';
  }

  get textClass(): string {
    if (!this.batteryInfo) return 'text-blue-400';
    if (this.batteryInfo.percentage > 50) return 'text-green-400';
    if (this.batteryInfo.percentage > 20) return 'text-yellow-400';
    return 'text-red-400';
  }

  getStatusIcon(): string {
    if (!this.batteryInfo) return '🔌';
    if (this.batteryInfo.status === 'CHARGING') return '⚡';
    if (this.batteryInfo.status === 'FULL') return '✅';
    if (this.batteryInfo.status === 'DISCHARGING') return '🔋';
    return '🔌';
  }

  getStatusLabel(): string {
    if (!this.batteryInfo) return 'N/A';
    if (this.batteryInfo.status === 'CHARGING') return 'Cargando';
    if (this.batteryInfo.status === 'DISCHARGING') return 'Descargando';
    if (this.batteryInfo.status === 'FULL') return 'Completa';
    return 'N/A';
  }

  formatUptime(seconds: number): string {
    if (!seconds || seconds <= 0) return '0m';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
