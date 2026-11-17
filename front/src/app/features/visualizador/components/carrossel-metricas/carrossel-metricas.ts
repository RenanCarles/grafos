import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { CardMetrica } from '@app/shared/models/card-metrica';

@Component({
  selector: 'app-carrossel-metricas',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cards().length > 0) {
      <section
        class="carrossel"
        role="region"
        aria-roledescription="carrossel"
        aria-label="Métricas da visão"
        tabindex="0"
        (keydown.arrowright)="rolar(1); $event.preventDefault()"
        (keydown.arrowleft)="rolar(-1); $event.preventDefault()"
        (window:resize)="atualizarPontas()"
      >
        <button
          mat-icon-button
          type="button"
          class="seta"
          aria-label="Cards anteriores"
          [disabled]="noInicio()"
          (click)="rolar(-1)"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>
        <ul class="trilho" #trilho (scroll)="atualizarPontas()">
          @for (card of cards(); track card.id) {
            <li class="card">
              <h3>{{ card.titulo }}</h3>
              @if (card.tipo === 'numeros') {
                @if (card.itens.length > 0) {
                  <dl>
                    @for (item of card.itens; track item.rotulo) {
                      <div class="par">
                        <dt>{{ item.rotulo }}</dt>
                        <dd>{{ item.valor }}</dd>
                      </div>
                    }
                  </dl>
                }
              } @else {
                @if (card.itens.length > 0) {
                  <ol>
                    @for (item of card.itens; track item.posicao) {
                      <li>
                        <span class="nome">{{ item.posicao }}. {{ item.rotulo }}</span>
                        <span class="detalhe">{{ item.detalhe }}</span>
                      </li>
                    }
                  </ol>
                } @else {
                  <p class="vazio">Nenhum item neste recorte.</p>
                }
              }
              @if (card.nota) {
                <p class="nota">{{ card.nota }}</p>
              }
            </li>
          }
        </ul>
        <button
          mat-icon-button
          type="button"
          class="seta"
          aria-label="Próximos cards"
          [disabled]="noFim()"
          (click)="rolar(1)"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
      margin: 0 0 16px;
    }
    .carrossel {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 4px;
    }
    .carrossel:focus-visible {
      outline: 2px solid var(--viz-ink-2);
      outline-offset: 2px;
      border-radius: 12px;
    }
    .trilho {
      display: flex;
      gap: 12px;
      margin: 0;
      padding: 4px 2px;
      list-style: none;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
    }
    .trilho::-webkit-scrollbar {
      display: none;
    }
    .card {
      flex: 0 0 clamp(200px, 24%, 280px);
      box-sizing: border-box;
      scroll-snap-align: start;
      padding: 12px 14px;
      border: 1px solid var(--viz-grid);
      border-radius: 12px;
      background: var(--viz-surface);
    }
    h3 {
      margin: 0 0 8px;
      color: var(--viz-ink-2);
      font-size: 0.8125rem;
      font-weight: 600;
    }
    dl,
    ol {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .par {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }
    dt {
      color: var(--viz-ink-2);
      font-size: 0.75rem;
    }
    dd {
      margin: 0;
      font-size: 1.25rem;
      font-variant-numeric: tabular-nums;
    }
    ol li {
      display: grid;
    }
    .nome {
      font-size: 0.875rem;
    }
    .detalhe,
    .nota,
    .vazio {
      color: var(--viz-ink-2);
      font-size: 0.75rem;
      line-height: 1.4;
    }
    .nota,
    .vazio {
      margin: 8px 0 0;
    }
  `,
})
export class CarrosselMetricas {
  readonly cards = input.required<CardMetrica[]>();

  private readonly trilho = viewChild<ElementRef<HTMLElement>>('trilho');
  protected readonly noInicio = signal(true);
  protected readonly noFim = signal(true);

  constructor() {
    afterRenderEffect(() => {
      this.cards();
      this.trilho();
      this.atualizarPontas();
    });
  }

  protected rolar(sentido: -1 | 1): void {
    const trilho = this.trilho()?.nativeElement;
    trilho?.scrollBy({ left: sentido * trilho.clientWidth * 0.9, behavior: 'smooth' });
  }

  protected atualizarPontas(): void {
    const trilho = this.trilho()?.nativeElement;
    if (!trilho) return;
    this.noInicio.set(trilho.scrollLeft <= 1);
    this.noFim.set(trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 1);
  }
}
