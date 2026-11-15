import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { METADADOS_REPOSITORY } from '@app/core/repositorios';
import { provedoresDadosFake } from '@app/shared/testing/fixtures';
import { ContextoColeta } from './contexto-coleta';
import { criarFiltrosPadrao } from '@app/shared/models/visao';

describe('ContextoColeta', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [ContextoColeta], providers: provedoresDadosFake() }),
  );

  it('apresenta fonte, período e relação disponível', async () => {
    const fixture = TestBed.createComponent(ContextoColeta);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('SIGAA UNIFEI');
    expect(texto).toContain('OpenAlex');
    expect(texto).toContain('2021-2025');
    expect(texto).toContain('coautoria');
  });

  it('explica que Zanoli representa apenas produção nesta coleta', async () => {
    const obter = vi.spyOn(TestBed.inject(METADADOS_REPOSITORY), 'obterMetadados');
    const fixture = TestBed.createComponent(ContextoColeta);
    fixture.componentRef.setInput('filtros', { ...criarFiltrosPadrao(), formulaPeso: 'zanoli' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(obter).toHaveBeenCalledWith({
      formulaPeso: 'zanoli',
      lambdaTemporal: 0.1,
      anoReferencia: 2026,
    });
    expect(fixture.nativeElement.textContent).toContain('somente W_prod');
    expect(fixture.nativeElement.textContent).toContain('dados não disponíveis');
    expect(fixture.nativeElement.textContent).toContain('W_banca = Σ 0,3');
  });

  it('permite recuperar uma falha na consulta dos metadados', async () => {
    const obter = vi
      .spyOn(TestBed.inject(METADADOS_REPOSITORY), 'obterMetadados')
      .mockReturnValue(throwError(() => new Error('Metadados indisponíveis')));
    const fixture = TestBed.createComponent(ContextoColeta);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Metadados indisponíveis');
    obter.mockReturnValue(
      of({
        fonteNos: 'SIGAA',
        fonteArestas: 'OpenAlex',
        anos: '2021-2025',
        tipoRelacao: 'coautoria',
        geradoEm: '',
      }),
    );
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('OpenAlex');
  });
});
