import type { NoRede } from '@app/shared/models/dominio';
import { descreverGrupo, resumirComunidades } from './resumir-comunidades';

const no = (parcial: Partial<NoRede> & Pick<NoRede, 'id' | 'comunidade'>): NoRede => ({
  nome: parcial.id,
  institutoId: 'i1',
  areaIds: [],
  grau: 1,
  intermediacao: 0,
  ...parcial,
});

describe('resumirComunidades', () => {
  const siglaDe = (id: string) => id.toUpperCase();

  it('separa grupos da rede completa e docentes sem parceiro', () => {
    const leitura = resumirComunidades(
      [
        no({ id: 'a', comunidade: 0, grau: 2, institutosDoGrupo: ['IESTI', 'IEM'] }),
        no({
          id: 'b',
          comunidade: 0,
          grau: 2,
          institutoId: 'i2',
          institutosDoGrupo: ['IESTI', 'IEM'],
        }),
        no({ id: 'c', comunidade: 1, grau: 0, institutoId: 'i3' }),
      ],
      siglaDe,
    );
    expect(leitura.isolados).toBe(1);
    expect(leitura.grupos).toEqual([
      {
        indice: 0,
        numero: 1,
        pessoas: 2,
        institutos: ['IESTI', 'IEM'],
        institutosNaRedeCompleta: true,
        atravessa: true,
      },
    ]);
    expect(descreverGrupo(leitura.grupos[0])).toContain('reúne institutos diferentes');
    expect(descreverGrupo(leitura.grupos[0])).toContain('2 pessoas neste recorte');
  });

  it('não trata como isolado quem está sozinho no recorte mas tem parceiros na rede completa', () => {
    const leitura = resumirComunidades(
      [no({ id: 'a', comunidade: 4, grau: 6, institutosDoGrupo: ['IMC', 'IESTI'] })],
      siglaDe,
    );
    expect(leitura.isolados).toBe(0);
    expect(leitura.grupos[0].pessoas).toBe(1);
    expect(leitura.grupos[0].institutosNaRedeCompleta).toBe(true);
  });
});
