import { ROTULO_LAYOUT, opcoes } from './rotulos';
import { ANO_MAX, ANO_MIN, criarConfigAreasPadrao, criarConfigRedePadrao, criarFiltrosPadrao } from './visao';

describe('modelos de visão', () => {
  it('cria filtros padrão cobrindo todo o período, sem restrição de instituto ou área', () => {
    expect(criarFiltrosPadrao()).toEqual({ institutos: [], areas: [], anoInicio: ANO_MIN, anoFim: ANO_MAX, pesoMinimo: 1 });
  });

  it('cria configurações padrão independentes (sem compartilhar arrays)', () => {
    const a = criarConfigRedePadrao();
    const b = criarConfigRedePadrao();
    a.tiposRelacao.pop();
    expect(b.tiposRelacao).toHaveLength(3);
    expect(criarConfigAreasPadrao().topN).toBe(8);
  });

  it('opcoes() transforma o mapa de rótulos em lista na ordem de declaração', () => {
    expect(opcoes(ROTULO_LAYOUT)).toEqual([
      { valor: 'forca', rotulo: 'Força' },
      { valor: 'concentrico', rotulo: 'Concêntrico' },
      { valor: 'circulo', rotulo: 'Círculo' },
    ]);
  });
});
