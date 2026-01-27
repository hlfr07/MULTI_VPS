import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartPoint } from '../../types/system';

@Component({
  selector: 'app-resource-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all">
      <h3 class="text-sm font-semibold text-slate-300 mb-4">{{ title }}</h3>
      <div *ngIf="!data || data.length === 0" class="h-80 flex items-center justify-center">
        <p class="text-slate-400">No data available</p>
      </div>
      <svg *ngIf="data && data.length > 0" width="100%" height="250" viewBox="0 0 800 250" preserveAspectRatio="xMidYMid meet" class="overflow-visible">
        <defs>
          <linearGradient [id]="'gradient-' + colorId" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="5%" [attr.stop-color]="color" stop-opacity="0.3"/>
            <stop offset="95%" [attr.stop-color]="color" stop-opacity="0"/>
          </linearGradient>
        </defs>
        
        <!-- Grid lines and axes -->
        <g stroke="rgba(148,163,184,0.1)" stroke-dasharray="3 3">
          <ng-container *ngFor="let tick of getYTicks()">
            <line x1="40" [attr.y1]="getYPosition(tick)" x2="780" [attr.y2]="getYPosition(tick)"/>
          </ng-container>
          <ng-container *ngFor="let tick of getXTicks()">
            <line [attr.x1]="tick.x" y1="20" [attr.x2]="tick.x" y2="220"/>
          </ng-container>
        </g>
        
        <!-- Y axis -->
        <line x1="40" y1="20" x2="40" y2="220" stroke="#475569" stroke-width="1"/>
        <text x="18" y="20" font-size="12" fill="#94a3b8">{{ yAxisLabel }}</text>
        
        <!-- X axis -->
        <line x1="40" y1="220" x2="780" y2="220" stroke="#475569" stroke-width="1"/>
        <ng-container *ngFor="let tick of getYTicks()">
          <text x="12" [attr.y]="getYPosition(tick) + 4" font-size="12" fill="#94a3b8">{{ tick }}</text>
        </ng-container>
        <ng-container *ngFor="let tick of getXTicks()">
          <text [attr.x]="tick.x" y="240" font-size="12" fill="#94a3b8" text-anchor="middle">{{ tick.label }}</text>
        </ng-container>
        
        <!-- Area fill -->
        <path [attr.fill]="'url(#gradient-' + colorId + ')'" [attr.d]="getAreaPath()"/>
        
        <!-- Line -->
        <polyline [attr.points]="getLinePoints()" [attr.stroke]="color" stroke-width="2" fill="none" stroke-linejoin="miter"/>
      </svg>
    </div>
  `
})
export class ResourceChartComponent {
  @Input() data: ChartPoint[] = [];
  @Input() title = '';
  @Input() color = '#3b82f6';
  @Input() yAxisLabel = '%';

  private readonly chartWidth = 740;
  private readonly chartHeight = 200;
  private readonly padding = 40;
  private readonly xTickCount = 4;

  get colorId(): string {
    return this.color.replace('#', '');
  }

  getLinePoints(): string {
    if (!this.data || this.data.length === 0) return '';
    
    const maxVal = this.getMaxValue();
    const points = this.data.map((point, index) => {
      const x = this.padding + (index / (this.data.length - 1 || 1)) * this.chartWidth;
      const y = this.getYPosition(parseFloat(point.value.toString()), maxVal);
      return `${x},${y}`;
    });
    
    return points.join(' ');
  }

  getAreaPath(): string {
    if (!this.data || this.data.length === 0) return '';
    
    const maxVal = this.getMaxValue();
    const points: string[] = [];
    
    // Top line
    this.data.forEach((point, index) => {
      const x = this.padding + (index / (this.data.length - 1 || 1)) * this.chartWidth;
      const y = this.getYPosition(parseFloat(point.value.toString()), maxVal);
      points.push(`${x},${y}`);
    });
    
    // Close area
    for (let i = this.data.length - 1; i >= 0; i--) {
      const x = this.padding + (i / (this.data.length - 1 || 1)) * this.chartWidth;
      points.push(`${x},220`);
    }
    
    return `M ${points.join(' L ')} Z`;
  }

  private getMaxValue(): number {
    if (!this.data || this.data.length === 0) return 100;
    const maxPoint = Math.max(...this.data.map((point) => parseFloat(point.value.toString())));
    const rounded = Math.ceil(maxPoint);
    return rounded <= 100 ? 100 : Math.ceil(rounded / 10) * 10;
  }

  getYTicks(): number[] {
    const maxVal = this.getMaxValue();
    const steps = 4;
    const stepSize = Math.max(1, Math.ceil(maxVal / steps));
    const ticks: number[] = [];
    for (let v = 0; v <= maxVal; v += stepSize) {
      ticks.push(v);
    }
    if (ticks[ticks.length - 1] !== maxVal) {
      ticks.push(maxVal);
    }
    return ticks;
  }

  getYPosition(value: number, maxVal = this.getMaxValue()): number {
    return 220 - (value / maxVal) * this.chartHeight;
  }

  getXTicks(): Array<{ x: number; label: string }> {
    if (!this.data || this.data.length === 0) return [];

    const step = Math.max(1, Math.floor((this.data.length - 1) / this.xTickCount));
    const ticks: Array<{ x: number; label: string }> = [];

    for (let i = 0; i < this.data.length; i += step) {
      const point = this.data[i];
      const x = this.padding + (i / (this.data.length - 1 || 1)) * this.chartWidth;
      const label = point.time || `${i + 1}`;
      ticks.push({ x, label });
    }

    // Ensure the last point is included
    const lastLabel = this.data[this.data.length - 1].time || `${this.data.length}`;
    const lastX = this.padding + this.chartWidth;
    if (ticks.length === 0 || ticks[ticks.length - 1].label !== lastLabel) {
      ticks.push({ x: lastX, label: lastLabel });
    }

    return ticks;
  }
}

