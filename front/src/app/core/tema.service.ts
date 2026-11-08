import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { ModoCor } from '@app/shared/viz/paleta';

export type PreferenciaTema = 'sistema' | 'claro' | 'escuro';

const CHAVE = 'mapa-colaboracao:tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);
  private readonly consulta = this.documento.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
  private readonly sistemaEscuro = signal(this.consulta?.matches ?? false);

  readonly preferencia = signal<PreferenciaTema>(this.lerPreferencia());
  readonly modo = computed<ModoCor>(() => {
    const preferencia = this.preferencia();
    if (preferencia === 'sistema') return this.sistemaEscuro() ? 'escuro' : 'claro';
    return preferencia;
  });

  constructor() {
    this.consulta?.addEventListener('change', (evento) => this.sistemaEscuro.set(evento.matches));
    effect(() => {
      const preferencia = this.preferencia();
      this.documento.documentElement.style.colorScheme =
        preferencia === 'sistema' ? 'light dark' : preferencia === 'claro' ? 'light' : 'dark';
      try {
        localStorage.setItem(CHAVE, preferencia);
      } catch {
        // armazenamento bloqueado (modo privado): a preferência vale só nesta sessão
      }
    });
  }

  alternar(): void {
    this.preferencia.set(this.modo() === 'escuro' ? 'claro' : 'escuro');
  }

  private lerPreferencia(): PreferenciaTema {
    try {
      const salva = localStorage.getItem(CHAVE);
      return salva === 'claro' || salva === 'escuro' ? salva : 'sistema';
    } catch {
      return 'sistema';
    }
  }
}
