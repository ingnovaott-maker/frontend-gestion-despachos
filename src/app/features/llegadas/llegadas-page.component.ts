import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ServicioLocalStorage } from '../../administrador/servicios/local-storage.service';
import { Usuario, Rol } from '../../core/models/auth.models';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-llegadas-page',
  template: `
    <div class="container-fluid py-3">
      <app-page-header [title]="'Llegadas'" [subtitle]="'Gestión de llegadas.'" [usuarioInput]="usuario()" />
      <div class="card border-1 shadow-sm">
        <div class="card-body">
          <p class="text-muted mb-0">Vista de Llegadas – placeholder.</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `:host{display:block;}`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
})
export class LlegadasPageComponent {
  private readonly storage = inject(ServicioLocalStorage);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = signal<Usuario | null>(null);
  protected readonly rol = signal<Rol | null>(null);

  constructor() {
    this.rol.set(this.storage.obtenerRol());
    this.usuario.set(this.storage.obtenerUsuario());

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const rawUsuario = params.get('usuario');
      if (!rawUsuario) return;
      try {
        const parsed = JSON.parse(rawUsuario) as Usuario;
        this.usuario.set(parsed);
      } catch {
        console.warn('No se pudo interpretar el usuario recibido en la ruta.');
      }
    });
  }
}
