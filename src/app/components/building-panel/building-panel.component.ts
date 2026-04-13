import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, transition, style, animate } from '@angular/animations';
import { Building } from '../../models/building.model';

@Component({
  selector: 'app-building-panel',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './building-panel.component.html',
  styleUrl: './building-panel.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('250ms ease-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class BuildingPanelComponent {
  @Input() building!: Building;
  @Output() closed = new EventEmitter<void>();
}
