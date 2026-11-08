import { ANO_MAX, ANO_MIN } from '@app/shared/models/visao';
import { gerarDadosMock, obterDadosMock } from './gerar-dados';

describe('gerarDadosMock', () => {
  const dados = gerarDadosMock(2026);

  it('é determinístico para a mesma semente e varia com outra', () => {
    expect(gerarDadosMock(2026)).toEqual(dados);
    expect(gerarDadosMock(7)).not.toEqual(dados);
  });

  it('cria 60 pesquisadores, 6 institutos e 8 áreas com a distribuição esperada', () => {
    expect(dados.nos).toHaveLength(60);
    expect(dados.institutos).toHaveLength(6);
    expect(dados.areas).toHaveLength(8);
    const contagem = dados.institutos.map((i) => dados.nos.filter((n) => n.institutoId === i.id).length);
    expect(contagem).toEqual([14, 10, 10, 9, 9, 8]);
  });

  it('usa ids e nomes únicos e referências válidas', () => {
    expect(new Set(dados.nos.map((n) => n.id)).size).toBe(60);
    expect(new Set(dados.nos.map((n) => n.nome)).size).toBe(60);
    const institutos = new Set(dados.institutos.map((i) => i.id));
    const areas = new Set(dados.areas.map((a) => a.id));
    for (const no of dados.nos) {
      expect(institutos.has(no.institutoId)).toBe(true);
      expect(no.areaIds.length).toBeGreaterThanOrEqual(1);
      for (const areaId of no.areaIds) expect(areas.has(areaId)).toBe(true);
    }
  });

  it('gera relações válidas, sem laços nem repetições, dentro do período', () => {
    const ids = new Set(dados.nos.map((n) => n.id));
    const chaves = new Set<string>();
    for (const a of dados.arestas) {
      expect(ids.has(a.origemId)).toBe(true);
      expect(ids.has(a.destinoId)).toBe(true);
      expect(a.origemId).not.toBe(a.destinoId);
      expect(a.ano).toBeGreaterThanOrEqual(ANO_MIN);
      expect(a.ano).toBeLessThanOrEqual(ANO_MAX);
      expect(a.peso).toBeGreaterThanOrEqual(1);
      chaves.add(`${a.origemId}|${a.destinoId}`);
    }
    expect(chaves.size).toBe(dados.arestas.length);
  });

  it('não deixa pesquisadores isolados e cria relações entre institutos', () => {
    for (const no of dados.nos) expect(no.grau).toBeGreaterThanOrEqual(1);
    const institutoDe = new Map(dados.nos.map((n) => [n.id, n.institutoId]));
    expect(dados.arestas.some((a) => institutoDe.get(a.origemId) !== institutoDe.get(a.destinoId))).toBe(true);
  });

  it('numera comunidades de 0 a k-1 e ao menos uma atravessa institutos', () => {
    const comunidades = [...new Set(dados.nos.map((n) => n.comunidade))].sort((a, b) => a - b);
    expect(comunidades).toEqual(comunidades.map((_, i) => i));
    const atravessa = comunidades.some(
      (c) => new Set(dados.nos.filter((n) => n.comunidade === c).map((n) => n.institutoId)).size >= 2,
    );
    expect(atravessa).toBe(true);
  });

  it('calcula intermediação em [0, 1] com ao menos uma ponte relevante', () => {
    for (const no of dados.nos) {
      expect(no.intermediacao).toBeGreaterThanOrEqual(0);
      expect(no.intermediacao).toBeLessThanOrEqual(1);
    }
    expect(Math.max(...dados.nos.map((n) => n.intermediacao))).toBeGreaterThan(0.02);
  });

  it('obterDadosMock reutiliza a mesma instância', () => {
    expect(obterDadosMock()).toBe(obterDadosMock());
  });
});
