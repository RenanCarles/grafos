import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { CATALOGO_REPOSITORY, VISOES_REPOSITORY } from '@app/core/repositorios';
import { of, throwError } from 'rxjs';
import { criarCatalogoFake } from '@app/shared/testing/fixtures';
import { VisualizacaoVisao } from '@app/features/visualizador/components/visualizacao-visao/visualizacao-visao';
import { provedoresDadosFake } from '@app/shared/testing/fixtures';
import { RepositorioVisoesFake } from '../../testing/repositorio-visoes-fake';
import { VisaoEditor } from './visao-editor';

@Component({ selector: 'app-visualizacao-visao', template: 'PREVIA' })
class PreviaFalsa {
  readonly visao = input<unknown>();
  readonly noSelecionado = output<unknown>();
}

describe('VisaoEditor', () => {
  let repo: RepositorioVisoesFake;
  let fixture: ComponentFixture<VisaoEditor>;
  let navegar: ReturnType<typeof vi.spyOn>;
  const snack = { open: vi.fn() };
  const raiz = () => fixture.nativeElement as HTMLElement;
  const campo = (nome: string) =>
    raiz().querySelector<HTMLInputElement>(`[formcontrolname="${nome}"]`)!;

  function digitar(nome: string, valor: string): void {
    const el = campo(nome);
    el.value = valor;
    el.dispatchEvent(new Event('input'));
  }

  function enviar(): void {
    raiz().querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  async function renderizar(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    repo = new RepositorioVisoesFake();
    snack.open.mockReset();
    TestBed.configureTestingModule({
      imports: [VisaoEditor],
      providers: [
        provideRouter([]),
        ...provedoresDadosFake(),
        { provide: VISOES_REPOSITORY, useValue: repo },
        { provide: MatSnackBar, useValue: snack },
      ],
    });
    TestBed.overrideComponent(VisaoEditor, {
      remove: { imports: [VisualizacaoVisao] },
      add: { imports: [PreviaFalsa] },
    });
    await TestBed.compileComponents();
    navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(VisaoEditor);
  });

  it('em "nova visão" mostra o título e a pré-visualização', async () => {
    await renderizar();
    expect(raiz().querySelector('h1')?.textContent).toContain('Nova visão');
    expect(raiz().textContent).toContain('PREVIA');
  });

  it('não salva com nome inválido e avisa', async () => {
    const criar = vi.spyOn(repo, 'criar');
    await renderizar();
    enviar();
    await fixture.whenStable();
    expect(criar).not.toHaveBeenCalled();
    expect(snack.open).toHaveBeenCalledWith('Corrija os campos destacados.', 'Fechar', {
      duration: 4000,
    });
  });

  it('permite escolher Zanoli no editor e salva seus parâmetros com a visão', async () => {
    await renderizar();
    (raiz().querySelector('[formcontrolname="formulaPeso"]') as HTMLElement).click();
    await renderizar();
    const opcao = [...document.querySelectorAll<HTMLElement>('mat-option')].find((el) =>
      el.textContent?.includes('Zanoli'),
    )!;
    opcao.click();
    await renderizar();
    expect(campo('lambdaTemporal')).not.toBeNull();
    expect(campo('anoReferencia')).not.toBeNull();
    digitar('nome', 'Rede Zanoli');
    digitar('lambdaTemporal', '0.2');
    digitar('anoReferencia', '2027');
    enviar();
    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith(['/visoes', 'novo']));
    expect(repo.visoes.at(-1)!.filtros).toMatchObject({
      formulaPeso: 'zanoli',
      lambdaTemporal: 0.2,
      anoReferencia: 2027,
    });
  });

  it('salva uma visão nova válida e navega para o visualizador', async () => {
    await renderizar();
    digitar('nome', 'Minha visão');
    enviar();
    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith(['/visoes', 'novo']));
    expect(repo.visoes).toHaveLength(3);
    expect(repo.visoes[2].nome).toBe('Minha visão');
  });

  it('carrega uma visão existente para edição e atualiza ao salvar', async () => {
    fixture.componentRef.setInput('id', 'a');
    await renderizar();
    expect(raiz().querySelector('h1')?.textContent).toContain('Editar visão');
    expect(campo('nome').value).toBe('A');

    digitar('nome', 'A renomeada');
    enviar();
    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith(['/visoes', 'a']));
    expect(repo.visoes.find((v) => v.id === 'a')!.nome).toBe('A renomeada');
  });

  it('mostra o erro quando a visão a editar não existe', async () => {
    fixture.componentRef.setInput('id', 'inexistente');
    await renderizar();
    expect(raiz().textContent).toContain('Visão não encontrada.');
  });

  it('mostra falha de catálogo e permite tentar novamente sem usar um catálogo vazio', async () => {
    const catalogo = TestBed.inject(CATALOGO_REPOSITORY);
    const obter = vi
      .spyOn(catalogo, 'obterCatalogo')
      .mockReturnValue(throwError(() => new Error('Catálogo indisponível')));
    await renderizar();
    expect(raiz().textContent).toContain('Catálogo indisponível');
    expect(raiz().querySelector('form')).toBeNull();
    obter.mockReturnValue(of(criarCatalogoFake()));
    raiz().querySelector<HTMLButtonElement>('app-estado-pagina button')!.click();
    await renderizar();
    expect(raiz().querySelector('form')).not.toBeNull();
  });

  it('desabilita áreas e relações não disponíveis sem impedir salvar uma rede', async () => {
    vi.spyOn(TestBed.inject(CATALOGO_REPOSITORY), 'obterCatalogo').mockReturnValue(
      of({ ...criarCatalogoFake(), areas: [] }),
    );
    await renderizar();
    expect(raiz().querySelector('[formcontrolname="areas"]')?.getAttribute('aria-disabled')).toBe(
      'true',
    );
    expect(raiz().textContent).toContain('Orientações e projetos ainda não foram integrados');
    digitar('nome', 'Rede real');
    enviar();
    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith(['/visoes', 'novo']));
    const criada = repo.visoes.at(-1)!;
    expect(criada.filtros.areas).toEqual([]);
    expect(criada.filtros.pesoMinimo).toBe(0);
  });
});
