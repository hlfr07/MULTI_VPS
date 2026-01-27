import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatteryInfo } from '../../types/system';

@Component({
  selector: 'app-battery-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="!batteryInfo || !batteryInfo.isAvailable" class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-full flex items-center justify-center">
      <p class="text-slate-400 text-sm">Batería no disponible</p>
    </div>

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
}
