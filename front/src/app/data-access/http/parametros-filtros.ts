import { HttpParams } from '@angular/common/http';
import type { FiltrosVisao } from '@app/shared/models/visao';
import {
  ANO_REFERENCIA_PADRAO,
  LAMBDA_PADRAO,
  type ConfiguracaoPeso,
} from '@app/shared/models/peso';

export function parametrosPeso(configuracao: ConfiguracaoPeso = {}): HttpParams {
  let parametros = new HttpParams().set('formulaPeso', configuracao.formulaPeso ?? 'reimberg');
  if (configuracao.formulaPeso === 'zanoli') {
    parametros = parametros
      .set('lambdaTemporal', configuracao.lambdaTemporal ?? LAMBDA_PADRAO)
      .set('anoReferencia', configuracao.anoReferencia ?? ANO_REFERENCIA_PADRAO);
  }
  return parametros;
}

/** O peso mínimo se aplica à soma das colaborações dentro do período. */
export function parametrosFiltros(filtros: FiltrosVisao): HttpParams {
  const filtrosComuns = new HttpParams({
    fromObject: {
      institutos: filtros.institutos.join(','),
      areas: filtros.areas.join(','),
      anoInicio: filtros.anoInicio,
      anoFim: filtros.anoFim,
      pesoMinimo: filtros.pesoMinimo,
      agregar: true,
    },
  });
  const modelo = parametrosPeso(filtros);
  return modelo
    .keys()
    .reduce((parametros, chave) => parametros.set(chave, modelo.get(chave)!), filtrosComuns);
}
