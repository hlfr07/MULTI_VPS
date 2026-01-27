import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-[50vh] bg-gradient-to-br from-slate-900 to-slate-950">
      <div class="relative w-24 h-24">
        <div class="absolute inset-0 rounded-full border-4 border-slate-700/30 border-t-blue-500 border-r-blue-500 animate-spin"></div>
        <div class="absolute inset-2 rounded-full border-4 border-slate-700/20 border-b-cyan-500 border-l-cyan-500 animate-spin" style="animation-direction: reverse; animation-duration: 1.5s"></div>
        <div class="absolute inset-4 rounded-full border-4 border-slate-700/10 border-t-purple-500 border-r-purple-500 animate-spin" style="animation-duration: 2s"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  `
})
export class LoadingSpinnerComponent {}
