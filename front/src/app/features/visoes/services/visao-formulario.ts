import { Validators, type NonNullableFormBuilder, type ValidatorFn } from '@angular/forms';
import type { TipoRelacao } from '@app/shared/models/dominio';
import { ANO_REFERENCIA_PADRAO, LAMBDA_PADRAO, type FormulaPeso } from '@app/shared/models/peso';
import {
  ANO_MAX,
  ANO_MIN,
  type AgruparPor,
  type CorPor,
  type GraficoAreas,
  type LayoutRede,
  type RascunhoVisao,
  type TamanhoPor,
  type TipoVisao,
  criarFiltrosPadrao,
} from '@app/shared/models/visao';

export const periodoValido: ValidatorFn = (grupo) => {
  const inicio = grupo.get('anoInicio')?.value as number | null;
  const fim = grupo.get('anoFim')?.value as number | null;
  return inicio != null && fim != null && inicio > fim ? { periodoInvalido: true } : null;
};

export const parametrosPesoValidos: ValidatorFn = (grupo) => {
  if (grupo.get('formulaPeso')?.value !== 'zanoli') return null;
  const lambda = grupo.get('lambdaTemporal')?.value;
  const referencia = grupo.get('anoReferencia')?.value;
  if (!Number.isFinite(lambda) || lambda < 0 || lambda > 0.5) return { lambdaInvalido: true };
  if (!Number.isInteger(referencia) || referencia < ANO_MAX || referencia > 2100)
    return { referenciaInvalida: true };
  return null;
};

export function criarFormulario(fb: NonNullableFormBuilder) {
  const anoInteiro: ValidatorFn = (controle) =>
    Number.isInteger(controle.value) ? null : { anoInteiro: true };
  const limitesAno = [
    Validators.required,
    Validators.min(ANO_MIN),
    Validators.max(ANO_MAX),
    anoInteiro,
  ];
  return fb.group({
    nome: fb.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]),
    descricao: fb.control('', [Validators.maxLength(280)]),
    tipo: fb.control<TipoVisao>('rede'),
    filtros: fb.group(
      {
        institutos: fb.control<string[]>([]),
        areas: fb.control<string[]>([]),
        anoInicio: fb.control(ANO_MIN, limitesAno),
        anoFim: fb.control(ANO_MAX, limitesAno),
        pesoMinimo: fb.control(0, [Validators.required, Validators.min(0)]),
        formulaPeso: fb.control<FormulaPeso>('reimberg'),
        lambdaTemporal: fb.control(LAMBDA_PADRAO),
        anoReferencia: fb.control(ANO_REFERENCIA_PADRAO),
      },
      { validators: [periodoValido, parametrosPesoValidos] },
    ),
    rede: fb.group({
      layout: fb.control<LayoutRede>('forca'),
      corPor: fb.control<CorPor>('instituto'),
      tamanhoPor: fb.control<TamanhoPor>('grau'),
      tiposRelacao: fb.control<TipoRelacao[]>(
        ['coautoria'],
        [Validators.required, Validators.minLength(1)],
      ),
      mostrarRotulos: fb.control(false),
    }),
    areas: fb.group({
      grafico: fb.control<GraficoAreas>('barras'),
      agruparPor: fb.control<AgruparPor>('area'),
      topN: fb.control(8, [Validators.required, Validators.min(3), Validators.max(20)]),
      destacarAreasPonte: fb.control(true),
    }),
  });
}

export type FormularioVisao = ReturnType<typeof criarFormulario>;
export type ValorFormulario = ReturnType<FormularioVisao['getRawValue']>;

/** Só valida o bloco de configuração do tipo escolhido; o outro fica ignorado. */
export function formularioValido(form: FormularioVisao): boolean {
  const { tipo } = form.getRawValue();
  const configuracaoValida = tipo === 'rede' ? form.controls.rede.valid : form.controls.areas.valid;
  return (
    form.controls.nome.valid &&
    form.controls.descricao.valid &&
    form.controls.filtros.valid &&
    configuracaoValida
  );
}

export function formularioParaRascunho(valor: ValorFormulario): RascunhoVisao {
  const base = {
    nome: valor.nome.trim(),
    descricao: valor.descricao.trim(),
    filtros: {
      ...valor.filtros,
      institutos: [...valor.filtros.institutos],
      areas: [...valor.filtros.areas],
    },
  };
  return valor.tipo === 'rede'
    ? {
        ...base,
        tipo: 'rede',
        config: { ...valor.rede, tiposRelacao: [...valor.rede.tiposRelacao] },
      }
    : { ...base, tipo: 'areas', config: { ...valor.areas } };
}

export function aplicarVisaoNoFormulario(form: FormularioVisao, visao: RascunhoVisao): void {
  form.patchValue({
    nome: visao.nome,
    descricao: visao.descricao,
    tipo: visao.tipo,
    filtros: { ...criarFiltrosPadrao(), ...visao.filtros },
  });
  if (visao.tipo === 'rede') form.controls.rede.patchValue(visao.config);
  else form.controls.areas.patchValue(visao.config);
}
