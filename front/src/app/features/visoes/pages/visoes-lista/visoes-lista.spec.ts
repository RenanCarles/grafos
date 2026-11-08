import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { VISOES_REPOSITORY } from '@app/core/repositorios';
import { RepositorioVisoesFake } from '../../testing/repositorio-visoes-fake';
import { VisoesLista } from './visoes-lista';

describe('VisoesLista', () => {
  let repo: RepositorioVisoesFake;
  let fixture: ComponentFixture<VisoesLista>;
  const dialogo = { open: vi.fn() };
  const snack = { open: vi.fn() };
  const raiz = () => fixture.nativeElement as HTMLElement;
  const botao = (texto: string) =>
    [...raiz().querySelectorAll('button')].find((b) => b.textContent?.includes(texto)) as HTMLButtonElement;

  async function renderizar(): Promise<void> {
    fixture = TestBed.createComponent(VisoesLista);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    repo = new RepositorioVisoesFake();
    dialogo.open.mockReset();
    snack.open.mockReset();
    await TestBed.configureTestingModule({
      imports: [VisoesLista],
      providers: [
        provideRouter([]),
        { provide: VISOES_REPOSITORY, useValue: repo },
        { provide: MatDialog, useValue: dialogo },
        { provide: MatSnackBar, useValue: snack },
      ],
    }).compileComponents();
  });

  it('mostra um cartão por visão com nome e tipo', async () => {
    await renderizar();
    const cartoes = raiz().querySelectorAll('mat-card');
    expect(cartoes).toHaveLength(2);
    expect(cartoes[0].textContent).toContain('A');
    expect(cartoes[0].textContent).toContain('Rede de colaboração');
    expect(cartoes[1].textContent).toContain('Áreas e temas');
  });

  it('mostra a mensagem de vazio quando não há visões', async () => {
    repo.visoes = [];
    await renderizar();
    expect(raiz().textContent).toContain('Você ainda não criou nenhuma visão.');
    expect(raiz().querySelectorAll('mat-card')).toHaveLength(0);
  });

  it('mostra o erro e recarrega ao tentar novamente', async () => {
    repo.falharListagem = true;
    await renderizar();
    expect(raiz().textContent).toContain('Falha ao listar');
    repo.falharListagem = false;
    botao('Tentar novamente').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz().querySelectorAll('mat-card')).toHaveLength(2);
  });

  it('duplica uma visão e avisa', async () => {
    await renderizar();
    botao('Duplicar').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz().querySelectorAll('mat-card')).toHaveLength(3);
    expect(snack.open).toHaveBeenCalledWith('Visão "A (cópia)" criada.', 'Fechar', { duration: 4000 });
  });

  it('exclui apenas depois da confirmação', async () => {
    dialogo.open.mockReturnValueOnce({ afterClosed: () => of(false) });
    await renderizar();
    botao('Excluir').click();
    await fixture.whenStable();
    expect(repo.visoes).toHaveLength(2);

    dialogo.open.mockReturnValueOnce({ afterClosed: () => of(true) });
    botao('Excluir').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(repo.visoes.map((v) => v.id)).toEqual(['b']);
    expect(snack.open).toHaveBeenCalledWith('Visão excluída.', 'Fechar', { duration: 4000 });
  });
});
