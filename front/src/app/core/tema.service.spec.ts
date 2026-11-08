import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TemaService } from './tema.service';

const CHAVE = 'mapa-colaboracao:tema';

describe('TemaService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.colorScheme = '';
  });

  it('começa em "sistema" e resolve para claro quando o navegador não informa preferência', () => {
    const tema = TestBed.inject(TemaService);
    expect(tema.preferencia()).toBe('sistema');
    expect(tema.modo()).toBe('claro');
  });

  it('alternar muda para escuro, persiste e aplica color-scheme', () => {
    const tema = TestBed.inject(TemaService);
    tema.alternar();
    TestBed.inject(ApplicationRef).tick();
    expect(tema.modo()).toBe('escuro');
    expect(localStorage.getItem(CHAVE)).toBe('escuro');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('lê a preferência salva', () => {
    localStorage.setItem(CHAVE, 'escuro');
    const tema = TestBed.inject(TemaService);
    expect(tema.modo()).toBe('escuro');
  });
});
