import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type EstadoCarga = 'carregando' | 'pronto' | 'erro';

@Component({
  selector: 'app-estado-pagina',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.recarregando]': 'recarregando()' },
  template: `
    @switch (estado()) {
      @case ('carregando') {
        <div class="esqueleto" role="status" aria-label="Carregando">
          <span></span><span></span><span></span>
        </div>
      }
      @case ('erro') {
        <div class="aviso" role="alert">
          <mat-icon>error_outline</mat-icon>
          <p>{{ mensagemErro() }}</p>
          <button mat-stroked-button type="button" (click)="tentarNovamente.emit()">Tentar novamente</button>
        </div>
      }
      @default {
        @if (vazio()) {
          <div class="aviso">
            <mat-icon>inbox</mat-icon>
            <p>{{ mensagemVazio() }}</p>
            <ng-content select="[acao-vazia]" />
          </div>
        } @else {
          <ng-content />
        }
      }
    }
  `,
  styles: `
    :host { display: block; transition: opacity 120ms; }
    :host(.recarregando) { opacity: 0.55; pointer-events: none; }
    .aviso { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 16px; text-align: center; color: var(--viz-ink-2); }
    .aviso mat-icon { font-size: 40px; width: 40px; height: 40px; color: var(--viz-muted); }
    .esqueleto { display: grid; gap: 12px; padding: 16px 0; }
    .esqueleto span { height: 56px; border-radius: 8px; background: var(--viz-grid); animation: pulsar 1.2s ease-in-out infinite; }
    @keyframes pulsar { 50% { opacity: 0.5; } }
    @media (prefers-reduced-motion: reduce) { .esqueleto span { animation: none; } }
  `,
})
export class EstadoPagina {
  readonly estado = input.required<EstadoCarga>();
  readonly vazio = input(false);
  readonly recarregando = input(false);
  readonly mensagemVazio = input('Nada por aqui ainda.');
  readonly mensagemErro = input('Não foi possível carregar os dados.');
  readonly tentarNovamente = output<void>();
}
