import { FormBuilder } from '@angular/forms';
import { criarVisaoAreasFake, criarVisaoRedeFake } from '@app/shared/testing/fixtures';
import {
  aplicarVisaoNoFormulario,
  criarFormulario,
  formularioParaRascunho,
  formularioValido,
} from './visao-formulario';

const novoFormulario = () => criarFormulario(new FormBuilder().nonNullable);

describe('formulário da visão', () => {
  it('valida os parâmetros temporais somente quando Zanoli está selecionado', () => {
    const filtros = novoFormulario().controls.filtros;
    filtros.patchValue({ formulaPeso: 'zanoli', lambdaTemporal: 0, anoReferencia: 2026 });
    expect(filtros.valid).toBe(true);
    filtros.patchValue({ lambdaTemporal: -0.1 });
    expect(filtros.hasError('lambdaInvalido')).toBe(true);
    filtros.patchValue({ lambdaTemporal: 0.1, anoReferencia: 2024 });
    expect(filtros.hasError('referenciaInvalida')).toBe(true);
    filtros.patchValue({ anoReferencia: 2026.5 });
    expect(filtros.invalid).toBe(true);
    filtros.patchValue({ formulaPeso: 'reimberg' });
    expect(filtros.valid).toBe(true);
  });

  it('carrega visões antigas com Reimberg e valores temporais padrão', () => {
    const form = novoFormulario();
    const antiga = criarVisaoRedeFake();
    delete antiga.filtros.formulaPeso;
    delete antiga.filtros.lambdaTemporal;
    delete antiga.filtros.anoReferencia;
    aplicarVisaoNoFormulario(form, antiga);
    expect(form.controls.filtros.getRawValue()).toMatchObject({
      formulaPeso: 'reimberg',
      lambdaTemporal: 0.1,
      anoReferencia: 2026,
    });
  });
  it('aceita pesos fracionários e altos, rejeitando negativos', () => {
    const form = novoFormulario();
    const peso = form.controls.filtros.controls.pesoMinimo;
    for (const valor of [0, 0.1, 0.007, 10]) {
      peso.setValue(valor);
      expect(peso.valid).toBe(true);
    }
    peso.setValue(-0.1);
    expect(peso.invalid).toBe(true);
  });

  it('rejeita anos fracionários e fora da coleta', () => {
    const ano = novoFormulario().controls.filtros.controls.anoInicio;
    for (const valor of [2020, 2026, 2021.5]) {
      ano.setValue(valor);
      expect(ano.invalid).toBe(true);
    }
    ano.setValue(2021);
    expect(ano.valid).toBe(true);
  });
  it('exige nome com pelo menos 3 caracteres', () => {
    const form = novoFormulario();
    expect(formularioValido(form)).toBe(false);
    form.controls.nome.setValue('ab');
    expect(formularioValido(form)).toBe(false);
    form.controls.nome.setValue('Rede X');
    expect(formularioValido(form)).toBe(true);
  });

  it('rejeita período invertido', () => {
    const form = novoFormulario();
    form.controls.nome.setValue('Rede X');
    form.controls.filtros.patchValue({ anoInicio: 2024, anoFim: 2020 });
    expect(form.controls.filtros.hasError('periodoInvalido')).toBe(true);
    expect(formularioValido(form)).toBe(false);
  });

  it('exige ao menos um tipo de relação na visão de rede, mas não na de áreas', () => {
    const form = novoFormulario();
    form.controls.nome.setValue('Rede X');
    form.controls.rede.patchValue({ tiposRelacao: [] });
    expect(formularioValido(form)).toBe(false);
    form.controls.tipo.setValue('areas');
    expect(formularioValido(form)).toBe(true);
  });

  it('converte para rascunho de rede (apara o nome e copia os arrays)', () => {
    const form = novoFormulario();
    form.patchValue({ nome: '  Minha rede  ', descricao: ' d ' });
    form.controls.filtros.patchValue({ institutos: ['iem'] });
    const rascunho = formularioParaRascunho(form.getRawValue());
    expect(rascunho.tipo).toBe('rede');
    expect(rascunho.nome).toBe('Minha rede');
    expect(rascunho.descricao).toBe('d');
    expect(rascunho.filtros.institutos).toEqual(['iem']);
    expect(rascunho.filtros.institutos).not.toBe(form.controls.filtros.controls.institutos.value);
    expect('areas' in rascunho.config).toBe(false);
  });

  it('converte para rascunho de áreas', () => {
    const form = novoFormulario();
    form.patchValue({ nome: 'Áreas', tipo: 'areas' });
    form.controls.areas.patchValue({ grafico: 'treemap', topN: 5 });
    const rascunho = formularioParaRascunho(form.getRawValue());
    expect(rascunho.tipo).toBe('areas');
    expect(rascunho.config).toEqual({
      grafico: 'treemap',
      agruparPor: 'area',
      topN: 5,
      destacarAreasPonte: true,
    });
  });

  it('aplicar uma visão no formulário e voltar a rascunho preserva tudo (rede)', () => {
    const { id, criadoEm, atualizadoEm, ...esperado } = criarVisaoRedeFake({
      nome: 'Pontes',
      config: {
        layout: 'circulo',
        corPor: 'comunidade',
        tamanhoPor: 'intermediacao',
        tiposRelacao: ['coautoria'],
        mostrarRotulos: true,
      },
    });
    const form = novoFormulario();
    aplicarVisaoNoFormulario(form, criarVisaoRedeFake({ nome: 'Pontes', config: esperado.config }));
    expect(formularioParaRascunho(form.getRawValue())).toEqual(esperado);
  });

  it('aplicar uma visão no formulário e voltar a rascunho preserva tudo (áreas)', () => {
    const { id, criadoEm, atualizadoEm, ...esperado } = criarVisaoAreasFake({
      nome: 'Áreas',
      config: { grafico: 'sunburst', agruparPor: 'instituto', topN: 5, destacarAreasPonte: false },
    });
    const form = novoFormulario();
    aplicarVisaoNoFormulario(form, criarVisaoAreasFake({ nome: 'Áreas', config: esperado.config }));
    expect(formularioParaRascunho(form.getRawValue())).toEqual(esperado);
  });
});
