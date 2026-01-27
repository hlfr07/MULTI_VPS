import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircularProgressComponent } from './circular-progress.component';

interface MHzDetail {
  key: string;
  value: string;
}

@Component({
  selector: 'app-cpu-frequency-card',
  standalone: true,
  imports: [CommonModule, CircularProgressComponent],
  template: `
    <div *ngIf="!mhzDetails || mhzDetails.length === 0" class="hidden"></div>

    <div *ngIf="mhzDetails && mhzDetails.length > 0" class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">⚡</div>
        <div>
          <h2 class="text-xl font-bold text-white">Frecuencia del CPU</h2>
          <p class="text-sm text-slate-400">Estado actual de aceleración</p>
        </div>
      </div>

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
  `
})
export class CPUFrequencyCardComponent {
  @Input() mhzDetails: MHzDetail[] = [];

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
}
