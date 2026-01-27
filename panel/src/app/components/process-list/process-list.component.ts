import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemData } from '../../types/system';

@Component({
  selector: 'app-process-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './process-list.component.html'
})
export class ProcessListComponent {
  @Input() data: SystemData | null = null;

  parseFloat = parseFloat;
}
