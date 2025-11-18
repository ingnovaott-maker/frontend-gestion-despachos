import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-home',
  template: `
    <h3>Inicio</h3>
    <p>Selecciona una opción del menú para comenzar.</p>
  `,
  styles: [
    `
    :host { display: block; }
  `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DashboardHomeComponent {}
