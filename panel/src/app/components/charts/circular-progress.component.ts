import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circular-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="'flex flex-col items-center p-4 rounded-lg ' + backgroundClass + ' border border-slate-700/50'">
      <div class="relative w-24 h-24">
        <svg class="transform -rotate-90 w-24 h-24" viewBox="0 0 96 96">
          <!-- Círculo de fondo -->
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            class="text-slate-700"
          />
          <!-- Círculo de progreso -->
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="offset"
            [ngClass]="strokeClass"
            stroke-linecap="round"
            class="transition-all duration-500 ease-in-out"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span [ngClass]="textClass + ' text-xl font-bold'">{{ percentage }}%</span>
        </div>
      </div>
      <p class="text-sm text-slate-400 mt-2 text-center">{{ label }}</p>
    </div>
  `
})
export class CircularProgressComponent {
  @Input() percentage: number = 0;
  @Input() label: string = '';
  @Input() color: 'blue' | 'purple' | 'cyan' | 'green' = 'blue';

  private readonly radius = 40;

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get offset(): number {
    return this.circumference - (this.percentage / 100) * this.circumference;
  }

  get colorMap() {
    const colors: Record<string, { stroke: string; text: string; bg: string }> = {
      blue: { stroke: 'stroke-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
      purple: { stroke: 'stroke-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' },
      cyan: { stroke: 'stroke-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      green: { stroke: 'stroke-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
    };
    return colors[this.color] || colors.blue;
  }

  get strokeClass(): string {
    return this.colorMap.stroke;
  }

  get textClass(): string {
    return this.colorMap.text;
  }

  get backgroundClass(): string {
    return this.colorMap.bg;
  }
}
