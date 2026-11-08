import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, firstValueFrom, map, of } from 'rxjs';
import { CATALOGO_REPOSITORY, VISOES_REPOSITORY, type Catalogo } from '@app/core/repositorios';
import { VisualizacaoVisao } from '@app/features/visualizador/components/visualizacao-visao/visualizacao-visao';
import { EstadoPagina, type EstadoCarga } from '@app/shared/components/estado-pagina';
import {
  ROTULO_AGRUPAR_POR,
  ROTULO_COR_POR,
  ROTULO_GRAFICO,
  ROTULO_LAYOUT,
  ROTULO_TAMANHO_POR,
  ROTULO_TIPO_RELACAO,
  ROTULO_TIPO_VISAO,
  opcoes,
} from '@app/shared/models/rotulos';
import { mensagemDe } from '@app/shared/util/mensagem-de-erro';
import {
  aplicarVisaoNoFormulario,
  criarFormulario,
  formularioParaRascunho,
  formularioValido,
} from '../../services/visao-formulario';

@Component({
  selector: 'app-visao-editor',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    EstadoPagina,
    VisualizacaoVisao,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visao-editor.html',
  styleUrl: './visao-editor.scss',
})
export class VisaoEditor {
  readonly id = input<string>();

  private readonly repositorio = inject(VISOES_REPOSITORY);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly form = criarFormulario(inject(NonNullableFormBuilder));
  protected readonly catalogo = toSignal(
    inject(CATALOGO_REPOSITORY)
      .obterCatalogo()
      .pipe(catchError(() => of<Catalogo>({ institutos: [], areas: [] }))),
    { initialValue: { institutos: [], areas: [] } as Catalogo },
  );
  protected readonly estado = signal<EstadoCarga>('pronto');
  protected readonly mensagemErro = signal('');
  protected readonly salvando = signal(false);

  protected readonly tipo = toSignal(this.form.controls.tipo.valueChanges, {
    initialValue: this.form.controls.tipo.value,
  });
  protected readonly previa = toSignal(
    this.form.valueChanges.pipe(
      debounceTime(250),
      map(() => formularioParaRascunho(this.form.getRawValue())),
    ),
    { initialValue: formularioParaRascunho(this.form.getRawValue()) },
  );

  protected readonly titulo = computed(() => (this.id() ? 'Editar visão' : 'Nova visão'));
  protected readonly voltar = computed(() => {
    const id = this.id();
    return id ? ['/visoes', id] : ['/visoes'];
  });

  protected readonly opcoesTipo = opcoes(ROTULO_TIPO_VISAO);
  protected readonly opcoesTipoRelacao = opcoes(ROTULO_TIPO_RELACAO);
  protected readonly opcoesLayout = opcoes(ROTULO_LAYOUT);
  protected readonly opcoesCorPor = opcoes(ROTULO_COR_POR);
  protected readonly opcoesTamanhoPor = opcoes(ROTULO_TAMANHO_POR);
  protected readonly opcoesGrafico = opcoes(ROTULO_GRAFICO);
  protected readonly opcoesAgruparPor = opcoes(ROTULO_AGRUPAR_POR);

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) void this.carregar(id);
    });
  }

  protected recarregar(): void {
    const id = this.id();
    if (id) void this.carregar(id);
  }

  protected async salvar(): Promise<void> {
    if (!formularioValido(this.form)) {
      this.form.markAllAsTouched();
      this.snackBar.open('Corrija os campos destacados.', 'Fechar', { duration: 4000 });
      return;
    }
    const rascunho = formularioParaRascunho(this.form.getRawValue());
    const id = this.id();
    this.salvando.set(true);
    try {
      const salva = id
        ? await firstValueFrom(this.repositorio.atualizar(id, rascunho))
        : await firstValueFrom(this.repositorio.criar(rascunho));
      this.snackBar.open('Visão salva.', 'Fechar', { duration: 3000 });
      await this.router.navigate(['/visoes', salva.id]);
    } catch (erro) {
      this.snackBar.open(mensagemDe(erro), 'Fechar', { duration: 5000 });
    } finally {
      this.salvando.set(false);
    }
  }

  private async carregar(id: string): Promise<void> {
    this.estado.set('carregando');
    try {
      aplicarVisaoNoFormulario(this.form, await firstValueFrom(this.repositorio.obter(id)));
      this.estado.set('pronto');
    } catch (erro) {
      this.mensagemErro.set(mensagemDe(erro));
      this.estado.set('erro');
    }
  }
}
