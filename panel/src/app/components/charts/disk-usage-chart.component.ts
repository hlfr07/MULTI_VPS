import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-disk-usage-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">💾</div>
        <div>
          <h2 class="text-xl font-bold text-white">Uso de Disco</h2>
          <p class="text-sm text-slate-400">Almacenamiento actual</p>
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
            <span class="text-5xl mb-2">💾</span>
            <span [ngClass]="textClass + ' text-4xl font-bold'">{{ usagePercent.toFixed(1) }}%</span>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="grid grid-cols-2 gap-4 w-full">
          <div class="bg-slate-700/30 rounded-lg p-3 text-center">
            <p class="text-xs text-slate-500 mb-1">Usado</p>
            <p class="text-sm font-semibold text-white">{{ used }}</p>
          </div>
          <div class="bg-slate-700/30 rounded-lg p-3 text-center">
            <p class="text-xs text-slate-500 mb-1">Disponible</p>
            <p class="text-sm font-semibold text-green-400">{{ available }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DiskUsageChartComponent {
  @Input() usagePercent: number = 0;
  @Input() used: string = 'N/A';
  @Input() available: string = 'N/A';

  private readonly radius = 80;

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get offset(): number {
    return this.circumference - (this.usagePercent / 100) * this.circumference;
  }

  get strokeClass(): string {
    if (this.usagePercent < 70) return 'stroke-blue-500';
    if (this.usagePercent < 85) return 'stroke-yellow-500';
    return 'stroke-red-500';
  }

  get textClass(): string {
    if (this.usagePercent < 70) return 'text-blue-400';
    if (this.usagePercent < 85) return 'text-yellow-400';
    return 'text-red-400';
  }
}
