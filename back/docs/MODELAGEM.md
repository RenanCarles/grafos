# Modelagem do grafo

## Nós e cores
- **Nó:** docente da UNIFEI, a partir da lista pública do SIGAA (549 docentes em 12 unidades).
- **Cor:** instituto do docente **segundo o SIGAA**. O campo do Lattes é texto livre e autodeclarado.
- **Fora do grafo, por ora:** coautores externos, alunos e docentes que não estão no SIGAA (aposentados,
  colaboradores). Exemplos são Bonatto, Zambroni e Tiago Filho, do ISEE.

## Arestas
Dois docentes ficam ligados se têm pelo menos uma produção em comum (hoje: publicações do OpenAlex, 2021–2025).

## Peso

$$ w_{ij} = \sum_{p \in P_{ij}} \frac{\alpha(\text{tipo}_p)}{n_p - 1} $$

- $P_{ij}$: produções em comum de *i* e *j*
- $n_p$: número **total** de autores da produção (inclui externos e alunos)
- $\alpha$: peso do tipo

| Tipo | α |
|---|---|
| Artigo em periódico | 1,0 |
| Livro | 1,0 |
| Trabalho completo em evento | 0,7 |
| Capítulo de livro | 0,7 |
| Outros (preprint, dataset…) | 0,3 |

**Por que dividir por $n_p - 1$** (Newman, 2001, *Scientific collaboration networks II*): cada autor reparte
1 unidade de colaboração entre seus $n-1$ coautores. Assim, toda produção vale o mesmo para cada autor, e
artigos com autoria massiva não dominam a rede.
- Com 2 autores, o par recebe 1.
- Com 150 autores, o par recebe ≈ 0,007.

**Exemplo:** artigo com 3 autores (0,5) + evento com 2 autores (0,7) + artigo com 150 autores (0,007)
→ $w \approx 1{,}21$. Na contagem simples, daria 3.

Classificação do tipo (OpenAlex): `conference-paper` conta como evento. `article`/`review` em fonte
`conference` também contam como evento; nas demais fontes, como periódico. `book` conta como livro.
`book-chapter` conta como capítulo, ou como evento se a fonte for `conference`. Resumo de evento
(`conference-abstract`) e o restante entram em "outro".

## Métricas
| Métrica | Definição | Uso do peso |
|---|---|---|
| grau | nº de docentes com quem colabora | — |
| força | Σ dos pesos das arestas | peso direto |
| intermediacao | Brandes, normalizada [0,1] | **sem peso** (igual ao mock do front) |
| intermediacaoPonderada | Brandes, normalizada [0,1] | distância = **1/peso** |
| comunidade | Louvain (semente 42) | peso direto |
| vizinhosFora | parceiros cujo instituto é diferente | — |
| institutosDoGrupo | siglas do grupo de Louvain da pessoa | peso direto, via a partição |

Em algoritmos de caminho (betweenness, closeness), o peso é distância, então se usa 1/w: laço forte vira
caminho curto. Em comunidades e força, usa-se w direto.

`vizinhosFora` e `institutosDoGrupo` são calculados na rede completa de 2021–2025 da fórmula selecionada,
antes do filtro de instituto, ano ou peso. A resposta de `GET /api/rede` e `GET /api/meta` inclui
`leituraGrupos`: contagem de grupos com mais de uma pessoa e de grupos que reúnem institutos, nas duas
fórmulas; quantas pessoas do maior grupo de Reimberg permanecem juntas em Zanoli; e o mesmo para o maior
grupo de Reimberg cujo instituto mais frequente é o IEPG. A outra fórmula é calculada só para esse texto.
A rede desenhada continua sendo a fórmula selecionada. Os números descrevem a coleta atual; não são
constantes do código.

## Grafo focado em instituto
Inclui os docentes do instituto, os docentes de fora com ligação direta a eles e **todas** as arestas entre
esses nós. Cada aresta recebe uma classe:
- `foco`: as duas pontas são do instituto;
- `ponte`: uma ponta é do instituto e a outra é de fora;
- `fora`: as duas pontas são vizinhos de fora.

## Limitações atuais
1. **Casamento por nome:** pode confundir alunos homônimos de docentes. O Lattes resolve isso com IDs.
2. **Só publicações indexadas:** ficam de fora orientações, projetos, bancas e muitos eventos nacionais.
3. **Valores de α:** são escolha do grupo. A validação proposta é uma análise de sensibilidade, comparando
   rankings com contagem simples, só Newman e Newman + α.
4. **Modelo padrão sem decaimento temporal.** A API também oferece o componente de produção do modelo Zanoli, descrito abaixo.

## Alternativa Zanoli na API e no frontend

Os nomes Reimberg e Zanoli identificam as alternativas propostas pelo grupo no HTML comparativo fornecido.
Os coeficientes são escolhas do modelo, sujeitos a justificativa e análise de sensibilidade.

Reimberg permanece o padrão e preserva exatamente os arquivos de referência. A alternativa Zanoli calcula:

$$ W_{prod}(i,j) = \sum_{p \in P_{ij}} \frac{\alpha(tipo_p)\, e^{-\lambda(A-ano_p)}}{\sqrt{n_p-1}} $$

- $A$: ano de referência explícito, padrão 2026. Não confundir com o fim da janela de publicações.
- $\lambda$: decaimento, padrão 0,1; a interface/API aceitam de 0 a 0,5. Zero remove apenas o decaimento, mantendo a raiz.
- $n_p$: total de autores de cada produção, incluindo os externos e alunos que não são nós.
- Os mesmos valores de α do modelo padrão são usados. Produções futuras em relação a $A$ não são aceitas.

O modelo ampliado proposto é $w=W_{prod}+W_{orient}+W_{banca}+W_{proj}$, com:

| Componente | Fórmula proposta | Coeficientes do comparativo |
|---|---|---|
| Orientações | $\sum\beta(nível)\gamma(papel)$ | β: doutorado 3, mestrado 2, IC 1, TCC 0,5; γ: principal 1, coorientador 0,5 |
| Bancas | $\sum 0,3/(m-1)$ | m = participantes da banca |
| Projetos | $\sum 0,5/(k-1)$ | k = membros do projeto |

**Cobertura atual:** somente $W_{prod}$ é calculável. Os demais componentes são desconhecidos por ausência de dados;
não são considerados zeros observados nem inferidos a partir de publicações. A implementação atual não define novos pares
de orientação/banca/projeto. Isso depende de integração das fontes e definição formal dessas relações.

O cálculo volta às publicações brutas, pois as arestas agregadas perderam o número de autores de cada produção.
Não se aplica raiz ao peso já agregado. As métricas são recalculadas sobre a rede completa de 2021–2025 para os pesos escolhidos:
força, intermediação ponderada e comunidades podem mudar; grau e intermediação sem peso conservam a topologia quando não há corte.
Os filtros são aplicados depois e não recalculam métricas. Não há alteração dos JSON/CSV/HTML exportados pelo pipeline padrão.

Os pesos das alternativas não têm a mesma escala. Com os parâmetros padrão, o corte ≥1 retém 115 pares em Reimberg e
166 em Zanoli; sem corte, ambos possuem os mesmos 852 pares. Zanoli pode resultar em pesos menores para certos pares devido ao decaimento.
Ponderar pela idade das publicações não equivale, por si só, a analisar toda a dinâmica de uma rede temporal.

## Próximos passos (Lattes)
- Ligar docentes pelo **ID Lattes** (o SIGAA tem o ID de 422 dos 549).
- Novas relações: `orientacao` e `projeto`, com o mesmo formato de `Relacao`.
- Áreas do conhecimento: preencher `catalogo.areas` e `areaIds`.
- Ver `../docs/lattes/` no repositório do trabalho para o esquema completo do XML.
