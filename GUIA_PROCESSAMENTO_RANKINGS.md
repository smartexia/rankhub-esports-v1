# Guia de Processamento de Rankings de Competição

## Visão Geral

Este sistema foi desenvolvido para processar screenshots de rankings de competições e gerar classificações consolidadas com cálculo automático de pontuação.

## Como Usar

### 1. Extração de Dados das Imagens

Baseado nas imagens fornecidas, extraia os seguintes dados de cada equipe:

**Estrutura dos dados nas imagens:**
- **Posição no Ranking**: 1º, 2º, 3º, etc.
- **Nome da Equipe**: EQUIPE1, EQUIPE15, etc.
- **Baixas**: Número de eliminações realizadas
- **Tempo de Sobrevivência**: Formato MM:SS

### 2. Dados Extraídos das Imagens Fornecidas

#### Primeira Imagem (Posições 1-10):
```
1º  EQUIPE1  - 38 baixas - 18:20
2º  EQUIPE15 - 12 baixas - 18:45
3º  EQUIPE2  - 25 baixas - 17:50
4º  EQUIPE7  - 13 baixas - 16:32
5º  EQUIPE11 - 45 baixas - 17:17
6º  EQUIPE12 - 34 baixas - 16:28
7º  EQUIPE19 - 23 baixas - 17:12
8º  EQUIPE20 - 3 baixas  - 16:52
9º  EQUIPE23 - 12 baixas - 16:36
10º EQUIPE16 - 23 baixas - 15:27
```

#### Segunda Imagem (Posições 11-20):
```
11º EQUIPE22 - 15 baixas - 17:24
12º EQUIPE10 - 13 baixas - 15:26
13º EQUIPE24 - 4 baixas  - 16:39
14º EQUIPE25 - 8 baixas  - 16:13
15º EQUIPE14 - 13 baixas - 17:02
16º EQUIPE21 - 19 baixas - 16:24
17º EQUIPE4  - 13 baixas - 15:53
18º EQUIPE3  - 16 baixas - 15:22
19º EQUIPE5  - 15 baixas - 11:46
20º EQUIPE13 - 10 baixas - 10:56
```

#### Terceira Imagem (Posições 21-25):
```
21º EQUIPE8  - 11 baixas - 11:37
22º EQUIPE9  - 22 baixas - 10:10
23º EQUIPE18 - 3 baixas  - 9:41
24º EQUIPE17 - 9 baixas  - 4:58
25º EQUIPE6  - 7 baixas  - 3:08
```

### 3. Sistema de Pontuação

**Pontos por Posição:**
- 1º lugar: 25 pontos
- 2º lugar: 20 pontos
- 3º lugar: 18 pontos
- 4º lugar: 16 pontos
- 5º lugar: 14 pontos
- 6º lugar: 12 pontos
- 7º lugar: 10 pontos
- 8º lugar: 8 pontos
- 9º lugar: 6 pontos
- 10º lugar: 4 pontos
- 11º-15º lugar: 3, 2, 1, 1, 1 pontos respectivamente
- 16º-20º lugar: 1 ponto cada
- 21º-25º lugar: 0 pontos

**Pontos por Eliminação:**
- 1 ponto por baixa/eliminação

### 4. Classificação Final Calculada

Baseado nos dados extraídos e sistema de pontuação:

| Posição | Equipe | Pontuação Total | Baixas | Melhor Posição |
|---------|--------|----------------|--------|----------------|
| 1º | EQUIPE11 (Lambda) | 59 pts | 45 | 5º |
| 2º | EQUIPE1 (Alpha) | 63 pts | 38 | 1º |
| 3º | EQUIPE12 (Mu) | 46 pts | 34 | 6º |
| 4º | EQUIPE2 (Beta) | 43 pts | 25 | 3º |
| 5º | EQUIPE19 (Tau) | 33 pts | 23 | 7º |
| 6º | EQUIPE16 (Pi) | 27 pts | 23 | 10º |
| 7º | EQUIPE9 (Iota) | 22 pts | 22 | 22º |
| 8º | EQUIPE21 (Phi) | 20 pts | 19 | 16º |
| 9º | EQUIPE3 (Gamma) | 17 pts | 16 | 18º |
| 10º | EQUIPE22 (Chi) | 18 pts | 15 | 11º |

### 5. Estatísticas Destacadas

**🎯 Equipe com Mais Baixas:**
- EQUIPE11 (Lambda): 45 eliminações

**⏱️ Maior Tempo de Sobrevivência:**
- EQUIPE15 (Omicron): 18:45

**🏆 Equipe Mais Consistente:**
- EQUIPE1 (Alpha): Posição média mais estável

### 6. Como Usar o Sistema

#### Opção 1: Interface Web
1. Acesse o componente `RankingImageProcessor`
2. Cole os dados JSON na área de texto
3. Clique em "Processar Dados"
4. Visualize os resultados nas abas disponíveis

#### Opção 2: Programaticamente
```typescript
import { RankingProcessor } from '../services/rankingProcessor';

// Dados extraídos das imagens
const rawData = {
  "rodada_1": {
    "equipes": [
      { "identificador": "EQUIPE1", "posicao": 1, "baixas": 38, "tempo_sobrevivencia": "18:20", "pontuacao_calculada": 0 },
      // ... mais equipes
    ]
  }
};

// Processa os dados
const processedData = RankingProcessor.processRankingData(rawData);
const finalRanking = RankingProcessor.generateFinalRanking(processedData);
const stats = RankingProcessor.generateStats(processedData);
```

### 7. Validação de Dados

O sistema inclui validação automática para:
- ✅ Posições duplicadas
- ✅ Formato de tempo válido (MM:SS)
- ✅ Baixas não negativas
- ✅ Consistência dos dados

### 8. Mapeamento de Equipes

As equipes são mapeadas automaticamente:
```
EQUIPE1 → Equipe Alpha
EQUIPE2 → Equipe Beta
EQUIPE3 → Equipe Gamma
... e assim por diante
```

### 9. Formato JSON de Entrada

```json
{
  "rodada_1": {
    "equipes": [
      {
        "identificador": "EQUIPE1",
        "posicao": 1,
        "baixas": 38,
        "tempo_sobrevivencia": "18:20",
        "pontuacao_calculada": 0
      }
    ]
  }
}
```

### 10. Formato de Saída

O sistema gera:
- **Dados Processados**: Com pontuações calculadas
- **Classificação Final**: Ordenada por pontuação total
- **Estatísticas**: Destaques e métricas interessantes
- **Relatório Detalhado**: Breakdown por rodada

## Próximos Passos

1. **Integração com IA**: Para extração automática de dados das imagens
2. **Múltiplas Rodadas**: Suporte para campeonatos com várias partidas
3. **Customização**: Sistema de pontuação configurável
4. **Exportação**: Relatórios em PDF/Excel
5. **Histórico**: Acompanhamento de performance ao longo do tempo

## Arquivos Relacionados

- `src/services/rankingProcessor.ts` - Lógica de processamento
- `src/components/RankingImageProcessor.tsx` - Interface de usuário
- Este arquivo - Documentação e guia de uso

---

**Nota**: Este sistema foi desenvolvido especificamente para processar os rankings mostrados nas imagens fornecidas, mas pode ser facilmente adaptado para outros formatos de competição.