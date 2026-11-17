import { formatarNumero, pluralizar } from './formatar';

describe('formatarNumero', () => {
  it('usa vírgula decimal e quantidade fixa de casas', () => {
    expect(formatarNumero(0.5, 3)).toBe('0,500');
    expect(formatarNumero(10, 2)).toBe('10,00');
  });

  it('separa milhares com ponto', () => {
    expect(formatarNumero(1234)).toBe('1.234');
  });

  it('sem casas mostra inteiro', () => {
    expect(formatarNumero(3)).toBe('3');
  });
});

describe('pluralizar', () => {
  it('usa o singular só para 1', () => {
    expect(pluralizar(1, 'parceiro', 'parceiros')).toBe('1 parceiro');
    expect(pluralizar(3, 'parceiro', 'parceiros')).toBe('3 parceiros');
    expect(pluralizar(0, 'parceiro', 'parceiros')).toBe('0 parceiros');
  });
});
