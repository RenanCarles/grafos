import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { EntradaCardsRede } from '@app/features/rede-colaboracao/services/montar-cards-rede';
import { criarCatalogoFake, criarRedeFake } from '@app/shared/testing/fixtures';
import { PainelComunidades } from './painel-comunidades';

@Component({
  imports: [PainelComunidades],
  template: `<app-painel-comunidades
    [entrada]="entrada()"
    [selecionado]="selecionado()"
    (selecionar)="escolhidos.push($event)"
  />`,
})
class Hospedeiro {
  readonly entrada = signal<EntradaCardsRede | null>({
    rede: criarRedeFake(),
    catalogo: criarCatalogoFake(),
  });
  readonly selecionado = signal<number | null>(null);
  readonly escolhidos: number[] = [];
}

describe('PainelComunidades', () => {
  let fixture: ComponentFixture<Hospedeiro>;
  const raiz = () => fixture.nativeElement as HTMLElement;
  const botoes = () => Array.from(raiz().querySelectorAll<HTMLButtonElement>('li button'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Hospedeiro] }).compileComponents();
    fixture = TestBed.createComponent(Hospedeiro);
    fixture.detectChanges();
  });

  it('lista cada grupo com pessoas e institutos', () => {
    expect(botoes().map((botao) => botao.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Grupo 1 · 2 pessoas · IESTI',
      'Grupo 2 · 2 pessoas · IEM',
      'Grupo 3 · 1 pessoa · IMC',
    ]);
  });

  it('marca o grupo selecionado', () => {
    fixture.componentInstance.selecionado.set(1);
    fixture.detectChanges();
    expect(botoes().map((botao) => botao.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('emite o índice do grupo clicado', () => {
    botoes()[1].click();
    expect(fixture.componentInstance.escolhidos).toEqual([1]);
  });

  it('não desenha nada sem dados', () => {
    fixture.componentInstance.entrada.set(null);
    fixture.detectChanges();
    expect(raiz().querySelector('section')).toBeNull();
  });

  it('avisa sobre docentes sem parceiro', () => {
    const base = criarRedeFake();
    fixture.componentInstance.entrada.set({
      rede: {
        ...base,
        nos: [
          ...base.nos,
          {
            id: 'p6',
            nome: 'Fábio Reis',
            institutoId: 'i3',
            areaIds: [],
            grau: 0,
            intermediacao: 0,
            comunidade: 3,
          },
        ],
      },
      catalogo: criarCatalogoFake(),
    });
    fixture.detectChanges();
    expect(raiz().textContent).toContain('1 docente fica em grupo de uma pessoa');
  });
});
