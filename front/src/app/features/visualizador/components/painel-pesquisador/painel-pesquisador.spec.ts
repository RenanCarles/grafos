import { TestBed } from '@angular/core/testing';
import { criarRedeFake, provedoresDadosFake } from '@app/shared/testing/fixtures';
import { PainelPesquisador } from './painel-pesquisador';

describe('PainelPesquisador', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelPesquisador],
      providers: [...provedoresDadosFake()],
    }).compileComponents();
  });

  it('orienta o usuário quando nenhum pesquisador está selecionado', () => {
    const fixture = TestBed.createComponent(PainelPesquisador);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Selecione um pesquisador no grafo para ver os detalhes.',
    );
  });

  it('mostra instituto, áreas e métricas do pesquisador selecionado', async () => {
    const fixture = TestBed.createComponent(PainelPesquisador);
    fixture.componentRef.setInput('no', criarRedeFake().nos[1]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Bruno Lima');
    expect(texto).toContain('Sistemas e Tecnologia da Informação');
    expect(texto).toContain('Inteligência Artificial, Matemática Aplicada');
    expect(texto).toContain('0.100');
  });
});
