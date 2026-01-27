import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemData } from '../../types/system';

@Component({
  selector: 'app-cpu-info-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4" *ngIf="data && data.cpuDetails">
      <!-- Main CPU Info -->
      <div class="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/30 transition-all">
        <h3 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span>💻</span>
          CPU Information
        </h3>
        <div class="space-y-3">
          <div *ngIf="data.cpuDetails.vendorId !== 'N/A'" class="flex items-center justify-between pb-3 border-b border-slate-700/50">
            <span class="text-slate-500 text-sm">Vendor</span>
            <span class="text-white font-medium">{{ data.cpuDetails.vendorId }}</span>
          </div>
          <div *ngIf="data.cpuDetails.cpuModelSummary && data.cpuDetails.cpuModelSummary !== 'N/A'" class="flex items-center justify-between pb-3 border-b border-slate-700/50">
            <span class="text-slate-500 text-sm">Model{{ data.cpuDetails.cpuModels && data.cpuDetails.cpuModels.length > 1 ? 's' : '' }}</span>
            <span class="text-white font-medium text-right truncate max-w-[200px]" [title]="data.cpuDetails.cpuModelSummary">{{ data.cpuDetails.cpuModelSummary }}</span>
          </div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-700/50">
            <span class="text-slate-500 text-sm">Byte Order</span>
            <span class="text-white font-medium">{{ data.cpuDetails.byteOrder }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 text-sm">CPU Modes</span>
            <span class="text-white font-medium">{{ data.cpuDetails.cpuOpModes }}</span>
          </div>
        </div>
      </div>

      <!-- CPU Specs Grid - 2 columnas x 3 filas -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all">
          <div class="flex items-start gap-3 mb-2">
            <span class="text-blue-400 flex-shrink-0">💻</span>
            <span class="text-xs text-slate-500">Architecture</span>
          </div>
          <p class="text-sm font-semibold text-white">{{ data.cpuDetails.architecture }}</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all">
          <div class="flex items-start gap-3 mb-2">
            <span class="text-blue-400 flex-shrink-0">⚡</span>
            <span class="text-xs text-slate-500">CPU Count</span>
          </div>
          <p class="text-sm font-semibold text-white">{{ data.cpuDetails.cpuCount }}</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all">
          <div class="flex items-start gap-3 mb-2">
            <span class="text-blue-400 flex-shrink-0">🕒</span>
            <span class="text-xs text-slate-500">Max Speed</span>
          </div>
          <p class="text-sm font-semibold text-white">{{ data.cpuDetails.cpuMaxMhz }} MHz</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all">
          <div class="flex items-start gap-3 mb-2">
            <span class="text-blue-400 flex-shrink-0">🕒</span>
            <span class="text-xs text-slate-500">Min Speed</span>
          </div>
          <p class="text-sm font-semibold text-white">{{ data.cpuDetails.cpuMinMhz }} MHz</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all">
          <div class="flex items-start gap-3 mb-2">
            <span class="text-blue-400 flex-shrink-0">💻</span>
            <span class="text-xs text-slate-500">Cores/Socket</span>
          </div>
          <p class="text-sm font-semibold text-white">{{ data.cpuDetails.coresPerSocket }}</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all">
          <div class="flex items-start gap-3 mb-2">
            <span class="text-blue-400 flex-shrink-0">⚡</span>
            <span class="text-xs text-slate-500">Threads/Core</span>
          </div>
          <p class="text-sm font-semibold text-white">{{ data.cpuDetails.threadsPerCore }}</p>
        </div>
      </div>

      <!-- CPU Frequency Scaling -->
      <div *ngIf="data.cpuDetails.mhzDetails && data.cpuDetails.mhzDetails.length > 0"
        class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/30 transition-all">
        <h4 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span class="text-purple-400">⚡</span>
          CPU Frequency Scaling
        </h4>
        <div class="space-y-3">
          <div *ngFor="let mhz of data.cpuDetails.mhzDetails"
            class="flex items-center justify-between pb-3 border-b border-slate-700/30 last:border-0 last:pb-0">
            <div class="flex items-center gap-2">
              <span class="text-purple-400 flex-shrink-0">📊</span>
              <span class="text-sm text-slate-400">{{ mhz.key }}</span>
            </div>
            <span class="text-sm font-mono font-medium text-white bg-purple-500/10 px-3 py-1 rounded-md">
              {{ mhz.value }}
            </span>
          </div>
        </div>
      </div>

      <!-- System Details -->
      <div *ngIf="data.info" class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <h4 class="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">System Details</h4>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span class="text-slate-500 block">Hostname</span>
            <span class="text-white font-medium">{{ data.info.hostname }}</span>
          </div>
          <div>
            <span class="text-slate-500 block">Platform</span>
            <span class="text-white font-medium">{{ data.info.platform }}</span>
          </div>
          <div>
            <span class="text-slate-500 block">Architecture</span>
            <span class="text-white font-medium">{{ data.info.arch }}</span>
          </div>
          <div>
            <span class="text-slate-500 block">CPUs</span>
            <span class="text-white font-medium">{{ data.info.cpus }}</span>
          </div>
          <div *ngIf="data.info.kernel" class="col-span-2">
            <span class="text-slate-500 block">Kernel</span>
            <span class="text-white font-mono text-[10px] break-all">{{ data.info.kernel }}</span>
          </div>
        </div>
      </div>

      <!-- CPU Flags -->
      <div *ngIf="data.cpuDetails.flags !== 'N/A'" class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <h4 class="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">CPU Flags</h4>
        <div class="flex flex-wrap gap-2">
          <span *ngFor="let flag of flagsArray.slice(0, 12)"
            class="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
            {{ flag }}
          </span>
          <span *ngIf="flagsArray.length > 12" class="inline-flex items-center px-2 py-1 text-xs text-slate-500">
            +{{ flagsArray.length - 12 }} more
          </span>
        </div>
      </div>
    </div>
  `
})
export class CPUInfoCardComponent {
  @Input() data: SystemData | null = null;

  get flagsArray(): string[] {
    if (!this.data || !this.data.cpuDetails || this.data.cpuDetails.flags === 'N/A') return [];
    return this.data.cpuDetails.flags.split(/\s+/).filter(f => f.length > 0);
  }
}
