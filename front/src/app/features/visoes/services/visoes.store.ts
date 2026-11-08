import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { VISOES_REPOSITORY } from '@app/core/repositorios';
import type { EstadoCarga } from '@app/shared/components/estado-pagina';
import type { Visao } from '@app/shared/models/visao';
import { mensagemDe } from '@app/shared/util/mensagem-de-erro';

@Injectable({ providedIn: 'root' })
export class VisoesStore {
  private readonly repositorio = inject(VISOES_REPOSITORY);

  readonly visoes = signal<Visao[]>([]);
  readonly estado = signal<EstadoCarga>('carregando');
  readonly mensagemErro = signal('');
  readonly recarregando = signal(false);

  async carregar(): Promise<void> {
    const jaHaviaDados = this.estado() === 'pronto';
    this.recarregando.set(jaHaviaDados);
    if (!jaHaviaDados) this.estado.set('carregando');
    try {
      this.visoes.set(await firstValueFrom(this.repositorio.listar()));
      this.estado.set('pronto');
    } catch (erro) {
      this.mensagemErro.set(mensagemDe(erro));
      this.estado.set('erro');
    } finally {
      this.recarregando.set(false);
    }
  }

  async excluir(id: string): Promise<void> {
    await firstValueFrom(this.repositorio.excluir(id));
    await this.carregar();
  }

  async duplicar(id: string): Promise<Visao> {
    const copia = await firstValueFrom(this.repositorio.duplicar(id));
    await this.carregar();
    return copia;
  }
}
