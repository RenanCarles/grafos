import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EstadoPagina } from '@app/shared/components/estado-pagina';
import { ROTULO_TIPO_VISAO } from '@app/shared/models/rotulos';
import type { Visao } from '@app/shared/models/visao';
import { mensagemDe } from '@app/shared/util/mensagem-de-erro';
import { ConfirmarExclusaoDialog } from '../../components/confirmar-exclusao-dialog';
import { VisoesStore } from '../../services/visoes.store';

@Component({
  selector: 'app-visoes-lista',
  imports: [RouterLink, DatePipe, MatButtonModule, MatCardModule, MatIconModule, EstadoPagina],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visoes-lista.html',
  styleUrl: './visoes-lista.scss',
})
export class VisoesLista {
  protected readonly store = inject(VisoesStore);
  protected readonly rotuloTipo = ROTULO_TIPO_VISAO;

  private readonly dialogo = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    void this.store.carregar();
  }

  protected async duplicar(visao: Visao): Promise<void> {
    try {
      const copia = await this.store.duplicar(visao.id);
      this.avisar(`Visão "${copia.nome}" criada.`);
    } catch (erro) {
      this.avisar(mensagemDe(erro));
    }
  }

  protected async excluir(visao: Visao): Promise<void> {
    const confirmado = await firstValueFrom(
      this.dialogo.open(ConfirmarExclusaoDialog, { data: { nome: visao.nome } }).afterClosed(),
    );
    if (!confirmado) return;
    try {
      await this.store.excluir(visao.id);
      this.avisar('Visão excluída.');
    } catch (erro) {
      this.avisar(mensagemDe(erro));
    }
  }

  private avisar(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', { duration: 4000 });
  }
}
