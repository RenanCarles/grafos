import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-explicacao-peso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details>
      <summary>Entender as fórmulas de Reimberg e Zanoli</summary>
      <p>
        As duas alternativas são propostas do grupo. Os coeficientes precisam de justificativa e
        análise de sensibilidade.
      </p>
      <h3>Reimberg — coautoria</h3>
      <p class="formula">w(i,j) = Σ α(tipo) / (n − 1)</p>
      <p>
        Soma as produções compartilhadas, dividindo a contribuição pelo total de coautores. Não
        aplica decaimento temporal.
      </p>
      <h3>Zanoli — modelo ampliado proposto</h3>
      <p class="formula">w(i,j) = W_prod + W_orient + W_banca + W_proj</p>
      <p class="formula">W_prod = Σ α(tipo) · exp(−λ · (ano de referência − ano)) / √(n − 1)</p>
      <p>
        A raiz penaliza menos a autoria massiva que o divisor de Reimberg; o decaimento reduz
        contribuições mais antigas. Portanto, Zanoli não é necessariamente maior que Reimberg para
        todo par.
      </p>
      <p>
        α: artigo em periódico e livro = 1; trabalho completo em evento e capítulo = 0,7; outros =
        0,3. n é o total de autores, incluindo os que não aparecem como nós da rede.
      </p>
      <h3>Componentes sem dados nesta coleta</h3>
      <p class="formula">W_orient = Σ β(nível) · γ(papel)</p>
      <p>
        β: doutorado = 3; mestrado = 2; iniciação científica = 1; TCC = 0,5. γ: orientador principal
        = 1; coorientador = 0,5.
      </p>
      <p class="formula">W_banca = Σ 0,3 / (m − 1)</p>
      <p>m é o número de participantes da banca.</p>
      <p class="formula">W_proj = Σ 0,5 / (k − 1)</p>
      <p>k é o número de membros do projeto.</p>
      <p>
        Os parâmetros seguem o comparativo fornecido pelo grupo. Orientações, bancas e projetos não
        são inferidos de publicações. No grafo real, a opção Zanoli representa apenas W_prod; os
        demais componentes são desconhecidos.
      </p>
    </details>
  `,
  styles: `
    details {
      margin: 12px 0;
      padding: 12px;
      border: 1px solid var(--viz-grid);
      border-radius: 8px;
    }
    summary {
      cursor: pointer;
      font-weight: 600;
    }
    p {
      line-height: 1.5;
      font-size: 0.875rem;
    }
    h3 {
      font-size: 1rem;
      margin: 16px 0 6px;
    }
    .formula {
      font-family: 'Cambria Math', Georgia, serif;
      overflow-wrap: anywhere;
      font-size: 1rem;
    }
  `,
})
export class ExplicacaoPeso {}
