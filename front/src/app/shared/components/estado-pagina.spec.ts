import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadoPagina, type EstadoCarga } from './estado-pagina';

@Component({
  imports: [EstadoPagina],
  template: `
    <app-estado-pagina
      [estado]="estado()"
      [vazio]="vazio()"
      [recarregando]="recarregando()"
      mensagemVazio="Nada aqui"
      mensagemErro="Falhou feio"
      (tentarNovamente)="cliques = cliques + 1"
    >
      <p class="conteudo">olá</p>
      <button acao-vazia class="criar">Criar</button>
    </app-estado-pagina>
  `,
})
class Hospedeiro {
  readonly estado = signal<EstadoCarga>('pronto');
  readonly vazio = signal(false);
  readonly recarregando = signal(false);
  cliques = 0;
}

describe('EstadoPagina', () => {
  let fixture: ComponentFixture<Hospedeiro>;
  const raiz = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Hospedeiro] }).compileComponents();
    fixture = TestBed.createComponent(Hospedeiro);
  });

  it('mostra o esqueleto enquanto carrega e esconde o conteúdo', () => {
    fixture.componentInstance.estado.set('carregando');
    fixture.detectChanges();
    expect(raiz().querySelector('[role="status"]')).not.toBeNull();
    expect(raiz().querySelector('.conteudo')).toBeNull();
  });

  it('mostra a mensagem de erro e emite ao tentar novamente', () => {
    fixture.componentInstance.estado.set('erro');
    fixture.detectChanges();
    expect(raiz().querySelector('[role="alert"]')?.textContent).toContain('Falhou feio');
    raiz().querySelector<HTMLButtonElement>('button')!.click();
    expect(fixture.componentInstance.cliques).toBe(1);
  });

  it('mostra a mensagem de vazio com a ação projetada', () => {
    fixture.componentInstance.vazio.set(true);
    fixture.detectChanges();
    expect(raiz().textContent).toContain('Nada aqui');
    expect(raiz().querySelector('.criar')).not.toBeNull();
    expect(raiz().querySelector('.conteudo')).toBeNull();
  });

  it('projeta o conteúdo quando pronto e aplica a classe de recarregamento', () => {
    fixture.componentInstance.recarregando.set(true);
    fixture.detectChanges();
    expect(raiz().querySelector('.conteudo')?.textContent).toBe('olá');
    expect(raiz().querySelector('app-estado-pagina')?.classList.contains('recarregando')).toBe(true);
  });
});
