import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { CardMetrica } from '@app/shared/models/card-metrica';
import { CarrosselMetricas } from './carrossel-metricas';

const CARDS: CardMetrica[] = [
  {
    tipo: 'numeros',
    id: 'geral',
    titulo: 'Visão geral',
    itens: [
      { rotulo: 'Pesquisadores', valor: '5' },
      { rotulo: 'Ligações', valor: '4' },
    ],
    nota: 'Nota do card',
  },
  {
    tipo: 'ranking',
    id: 'parceiros',
    titulo: 'Mais parceiros',
    itens: [{ posicao: 1, rotulo: 'Ana Souza', detalhe: 'IESTI · 3 parceiros' }],
  },
  { tipo: 'ranking', id: 'vazio', titulo: 'Áreas-ponte (0)', itens: [] },
];

@Component({
  imports: [CarrosselMetricas],
  template: `<app-carrossel-metricas [cards]="cards()" />`,
})
class Hospedeiro {
  readonly cards = signal<CardMetrica[]>(CARDS);
}

function simularLayout(
  trilho: HTMLElement,
  medidas: { scrollLeft: number; clientWidth: number; scrollWidth: number },
): void {
  for (const [nome, valor] of Object.entries(medidas)) {
    Object.defineProperty(trilho, nome, { value: valor, configurable: true, writable: true });
  }
  trilho.dispatchEvent(new Event('scroll'));
}

describe('CarrosselMetricas', () => {
  let fixture: ComponentFixture<Hospedeiro>;
  const raiz = () => fixture.nativeElement as HTMLElement;
  const trilho = () => raiz().querySelector<HTMLElement>('.trilho')!;
  const botoes = () => Array.from(raiz().querySelectorAll<HTMLButtonElement>('button.seta'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Hospedeiro] }).compileComponents();
    fixture = TestBed.createComponent(Hospedeiro);
    fixture.detectChanges();
  });

  it('desenha números, ranking, ranking vazio e nota', () => {
    const texto = raiz().textContent ?? '';
    expect(texto).toContain('Visão geral');
    expect(texto).toContain('Pesquisadores');
    expect(texto).toContain('1. Ana Souza');
    expect(texto).toContain('IESTI · 3 parceiros');
    expect(texto).toContain('Nenhum item neste recorte.');
    expect(texto).toContain('Nota do card');
  });

  it('expõe a região do carrossel para leitores de tela', () => {
    const regiao = raiz().querySelector('section')!;
    expect(regiao.getAttribute('role')).toBe('region');
    expect(regiao.getAttribute('aria-roledescription')).toBe('carrossel');
  });

  it('não desenha nada sem cards', () => {
    fixture.componentInstance.cards.set([]);
    fixture.detectChanges();
    expect(raiz().querySelector('section')).toBeNull();
  });

  it('desabilita as setas nas pontas do trilho', () => {
    simularLayout(trilho(), { scrollLeft: 0, clientWidth: 300, scrollWidth: 1000 });
    fixture.detectChanges();
    expect(botoes()[0].disabled).toBe(true);
    expect(botoes()[1].disabled).toBe(false);

    simularLayout(trilho(), { scrollLeft: 700, clientWidth: 300, scrollWidth: 1000 });
    fixture.detectChanges();
    expect(botoes()[0].disabled).toBe(false);
    expect(botoes()[1].disabled).toBe(true);
  });

  it('rola quase uma página ao clicar nas setas', () => {
    const scrollBy = vi.fn();
    Object.defineProperty(trilho(), 'scrollBy', { value: scrollBy });
    simularLayout(trilho(), { scrollLeft: 300, clientWidth: 300, scrollWidth: 1000 });
    fixture.detectChanges();

    botoes()[1].click();
    botoes()[0].click();

    expect(scrollBy).toHaveBeenCalledTimes(2);
    expect(scrollBy.mock.calls[0][0].left).toBeCloseTo(270);
    expect(scrollBy.mock.calls[0][0].behavior).toBe('smooth');
    expect(scrollBy.mock.calls[1][0].left).toBeCloseTo(-270);
  });

  it('rola com as setas do teclado', () => {
    const scrollBy = vi.fn();
    Object.defineProperty(trilho(), 'scrollBy', { value: scrollBy });
    simularLayout(trilho(), { scrollLeft: 300, clientWidth: 300, scrollWidth: 1000 });
    const regiao = raiz().querySelector('section')!;

    regiao.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    regiao.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

    expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);
    expect(scrollBy.mock.calls[1][0].left).toBeLessThan(0);
  });
});
