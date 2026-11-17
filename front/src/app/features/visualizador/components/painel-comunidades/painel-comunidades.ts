import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { EntradaCardsRede } from '@app/features/rede-colaboracao/services/montar-cards-rede';
import { resumirComunidades } from '@app/features/rede-colaboracao/services/resumir-comunidades';

@Component({
  selector: 'app-painel-comunidades',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (leitura(); as l) {
      <section aria-label="Comunidades de colaboração">
        <h2>Comunidades</h2>
        <p class="dica">
          Louvain na coautoria de 2021–2025. O número não é um instituto nem uma área de pesquisa. O
          filtro não refaz o grupo.
        </p>
        @if (l.grupos.length > 0) {
          <ul>
            @for (grupo of l.grupos; track grupo.indice) {
              <li>
                <button
                  type="button"
                  [attr.aria-pressed]="selecionado() === grupo.indice"
                  (click)="selecionar.emit(grupo.indice)"
                >
                  Grupo {{ grupo.numero }} · {{ grupo.pessoas }}
                  {{ grupo.pessoas === 1 ? 'pessoa' : 'pessoas' }} ·
                  {{ grupo.institutos.join(', ') }}
                </button>
              </li>
            }
          </ul>
        }
        @if (l.isolados > 0) {
          <p class="dica">
            {{ l.isolados }}
            {{ l.isolados === 1 ? 'docente fica' : 'docentes ficam' }} em grupo de uma pessoa, sem
            coautoria com outro docente nesta coleta. Isso não prova ausência de colaboração fora
            das publicações indexadas.
          </p>
        }
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    h2 {
      margin: 0;
      font-size: 1.05rem;
    }
    ul {
      display: grid;
      gap: 6px;
      margin: 12px 0 0;
      padding: 0;
      list-style: none;
    }
    button {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid var(--viz-grid);
      border-radius: 8px;
      background: var(--viz-surface);
      color: inherit;
      font: inherit;
      font-size: 0.8125rem;
      line-height: 1.4;
      text-align: left;
      cursor: pointer;
    }
    button[aria-pressed='true'] {
      border-color: var(--viz-ink);
    }
    .dica {
      margin: 8px 0 0;
      color: var(--viz-ink-2);
      font-size: 0.8125rem;
      line-height: 1.45;
    }
  `,
})
export class PainelComunidades {
  readonly entrada = input<EntradaCardsRede | null>(null);
  readonly selecionado = input<number | null>(null);
  readonly selecionar = output<number>();

  protected readonly leitura = computed(() => {
    const entrada = this.entrada();
    if (!entrada) return null;
    const { rede, catalogo } = entrada;
    return resumirComunidades(
      rede.nos,
      (institutoId) =>
        catalogo.institutos.find((instituto) => instituto.id === institutoId)?.sigla ?? institutoId,
    );
  });
}
