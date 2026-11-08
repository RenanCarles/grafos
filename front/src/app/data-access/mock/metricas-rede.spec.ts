import { calcularGrau, calcularIntermediacao } from './metricas-rede';

const par = (origemId: string, destinoId: string) => ({ origemId, destinoId });

describe('calcularGrau', () => {
  it('conta vizinhos distintos, ignora laços e arestas repetidas', () => {
    const grau = calcularGrau(['a', 'b', 'c', 'd'], [par('a', 'b'), par('b', 'a'), par('a', 'c'), par('c', 'c')]);
    expect(grau.get('a')).toBe(2);
    expect(grau.get('b')).toBe(1);
    expect(grau.get('c')).toBe(1);
    expect(grau.get('d')).toBe(0);
  });
});

describe('calcularIntermediacao', () => {
  it('no caminho a-b-c o nó do meio tem intermediação 1 e as pontas 0', () => {
    const valores = calcularIntermediacao(['a', 'b', 'c'], [par('a', 'b'), par('b', 'c')]);
    expect(valores.get('b')).toBeCloseTo(1, 6);
    expect(valores.get('a')).toBe(0);
    expect(valores.get('c')).toBe(0);
  });

  it('numa estrela o centro tem intermediação 1', () => {
    const ids = ['x', 'l1', 'l2', 'l3', 'l4'];
    const valores = calcularIntermediacao(ids, ids.slice(1).map((folha) => par('x', folha)));
    expect(valores.get('x')).toBeCloseTo(1, 6);
    expect(valores.get('l1')).toBe(0);
  });

  it('num triângulo todos têm intermediação 0', () => {
    const valores = calcularIntermediacao(['a', 'b', 'c'], [par('a', 'b'), par('b', 'c'), par('a', 'c')]);
    expect([...valores.values()]).toEqual([0, 0, 0]);
  });

  it('com menos de 3 nós devolve 0', () => {
    expect(calcularIntermediacao(['a', 'b'], [par('a', 'b')]).get('a')).toBe(0);
  });
});
