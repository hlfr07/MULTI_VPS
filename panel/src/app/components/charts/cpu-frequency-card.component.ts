import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircularProgressComponent } from './circular-progress.component';

interface MHzDetail {
  key: string;
  value: string;
}

interface CpuFrequency {
  core: number;
  speed: number;
  model: string;
}

@Component({
  selector: 'app-cpu-frequency-card',
  standalone: true,
  imports: [CommonModule, CircularProgressComponent],
  template: `
    <!-- Vista para Termux/Android con scaling -->
    <div *ngIf="hasScalingData && cpuGroups.length > 0" class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-full flex flex-col">
      <div class="flex items-center gap-3 mb-6 flex-shrink-0">
        <div class="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">⚡</div>
        <div>
          <h2 class="text-xl font-bold text-white">Frecuencia del CPU</h2>
          <p class="text-sm text-slate-400">Estado actual de aceleración</p>
        </div>
      </div>

      <div class="overflow-y-auto flex-1 pr-2" style="scrollbar-width: thin; scrollbar-color: rgba(203, 213, 225, 0.3) transparent;">
        <div class="grid grid-cols-2 gap-4">
          <div *ngFor="let group of cpuGroups; let i = index" class="space-y-3">
            <app-circular-progress
              [percentage]="group.scaling"
              [label]="'CPU ' + (i + 1)"
              [color]="colors[i % colors.length]"
            ></app-circular-progress>
            <div class="bg-slate-700/30 rounded-lg p-3 space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">Max:</span>
                <span class="text-sm font-mono text-green-400">
                  {{ parseFloat(group.maxMhz).toFixed(0) }} MHz
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">Min:</span>
                <span class="text-sm font-mono text-blue-400">
                  {{ parseFloat(group.minMhz).toFixed(0) }} MHz
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista alternativa para Ubuntu/Servidores sin scaling -->
    <div *ngIf="!hasScalingData && shouldShowUbuntuView" class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 overflow-y-auto flex flex-col">
      <div class="flex items-center gap-3 mb-6 flex-shrink-0">
        <div class="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">⚡</div>
        <div>
          <h2 class="text-xl font-bold text-white">Frecuencia del CPU</h2>
          <p class="text-sm text-slate-400">Velocidad actual por núcleo</p>
        </div>
      </div>

      <div class="overflow-y-auto flex-1 pr-2 max-h-44" style="scrollbar-width: thin; scrollbar-color: rgba(203, 213, 225, 0.3) transparent;">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div *ngFor="let core of coreFrequencies; let i = index" 
               class="bg-slate-700/30 rounded-lg p-3 text-center hover:bg-slate-700/50 transition-colors">
            <div class="flex items-center justify-center gap-2 mb-2">
              <span class="text-lg">🔹</span>
              <span class="text-xs text-slate-400">Core {{ core.core }}</span>
            </div>
            <p [class]="getSpeedClass(core.speed)" class="text-lg font-bold font-mono">
              {{ core.speed }} MHz
            </p>
          </div>
        </div>
      </div>

      <!-- Resumen -->
      <div *ngIf="coreFrequencies.length > 0" class="mt-4 pt-4 border-t border-slate-700/50 flex-shrink-0">
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-slate-700/30 rounded-lg p-3 text-center">
            <p class="text-xs text-slate-500 mb-1">Promedio</p>
            <p class="text-lg font-bold font-mono text-cyan-400">{{ averageSpeed }} MHz</p>
          </div>
          <div class="bg-slate-700/30 rounded-lg p-3 text-center">
            <p class="text-xs text-slate-500 mb-1">Máximo</p>
            <p class="text-lg font-bold font-mono text-green-400">{{ maxSpeed }} MHz</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CPUFrequencyCardComponent {
  @Input() mhzDetails: MHzDetail[] = [];
  @Input() hasScalingData: boolean = true;
  @Input() currentCpuFrequencies: CpuFrequency[] = [];

  colors: ('blue' | 'purple' | 'cyan' | 'green')[] = ['blue', 'purple', 'cyan', 'green'];
  parseFloat = parseFloat;

  get cpuGroups() {
    const groups: Array<{ scaling: number; maxMhz: string; minMhz: string }> = [];

    for (let i = 0; i < this.mhzDetails.length; i++) {
      const detail = this.mhzDetails[i];

      if (detail.key === "CPU(s) scaling MHz") {
        const scaling = Math.min(100, Math.max(0, parseInt(detail.value) || 0));
        const maxMhz = this.mhzDetails[i + 1]?.value || 'N/A';
        const minMhz = this.mhzDetails[i + 2]?.value || 'N/A';

        groups.push({
          scaling,
          maxMhz,
          minMhz,
        });

        i += 2;
      }
    }

    return groups;
  }

  get coreFrequencies(): CpuFrequency[] {
    // Si hay currentCpuFrequencies del servidor, usarlas
    if (this.currentCpuFrequencies && this.currentCpuFrequencies.length > 0) {
      return this.currentCpuFrequencies;
    }

    // Fallback: parsear mhzDetails para obtener frecuencias por núcleo
    const cores: CpuFrequency[] = [];
    this.mhzDetails.forEach(detail => {
      const match = detail.key.match(/Core (\d+) MHz/);
      if (match) {
        cores.push({
          core: parseInt(match[1]),
          speed: parseInt(detail.value) || 0,
          model: ''
        });
      }
    });
    return cores;
  }

  get averageSpeed(): number {
    const freqs = this.coreFrequencies;
    if (freqs.length === 0) return 0;
    const sum = freqs.reduce((acc, core) => acc + core.speed, 0);
    return Math.round(sum / freqs.length);
  }

  get maxSpeed(): number {
    const freqs = this.coreFrequencies;
    if (freqs.length === 0) return 0;
    return Math.max(...freqs.map(core => core.speed));
  }

  get shouldShowUbuntuView(): boolean {
    // Mostrar la vista de Ubuntu si hay datos de frecuencias de núcleos
    return this.coreFrequencies.length > 0 || this.currentCpuFrequencies.length > 0;
  }

  getSpeedClass(speed: number): string {
    if (speed >= 3000) return 'text-green-400';
    if (speed >= 2000) return 'text-cyan-400';
    if (speed >= 1000) return 'text-yellow-400';
    return 'text-slate-400';
  }
}
