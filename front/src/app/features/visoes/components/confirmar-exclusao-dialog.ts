import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmar-exclusao-dialog',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Excluir visão</h2>
    <mat-dialog-content>
      Tem certeza de que deseja excluir a visão <strong>{{ dados.nome }}</strong>? Esta ação não pode ser desfeita.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button type="button" [mat-dialog-close]="true" cdkFocusInitial>Excluir</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmarExclusaoDialog {
  protected readonly dados = inject<{ nome: string }>(MAT_DIALOG_DATA);
}
