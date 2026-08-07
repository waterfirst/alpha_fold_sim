# Protein Folding Lab

아미노산 서열과 환경 조건에 따른 단백질 접힘을 **2차원 coarse-grained Monte Carlo 모델**로 탐구하는 교육용 웹 시뮬레이터입니다.

## Live demo

https://waterfirst.github.io/alpha_fold_sim/

## What it computes

- 20종 아미노산 1-letter sequence 입력(8–48 aa)
- 결합 길이 조화 퍼텐셜 `E_bond`
- 사슬 굽힘 비용 `E_bend`
- 소수성·극성·전하·시스테인 비결합 상호작용 `E_nonbond`
- 물·변성제·막 환경 항 `E_solvent`
- Metropolis acceptance `P = min(1, exp(-ΔE/T))`
- 국소 이동과 결합 길이를 보존하는 pivot move를 혼합한 구조 탐색
- 총에너지, 회전반경 `Rg`, 비결합 접촉수, 수용률
- 실시간 에너지 경로와 residue contact map

## Learning goals

1. 단백질 접힘을 하나의 결정론적 애니메이션이 아니라 확률적 에너지 경관 탐색으로 이해합니다.
2. 동일 서열도 온도·용매·초기상태에 따라 다른 경로를 거칠 수 있음을 비교합니다.
3. 소수성 붕괴, 전하 상호작용과 열적 요동의 경쟁을 관찰합니다.
4. 물리 기반 교육 모델과 AlphaFold의 학습 기반 구조 예측을 구분합니다.

## Scientific scope

이 앱은 실제 AlphaFold, 원자 수준 molecular dynamics, 정량적인 구조 예측 도구가 아닙니다. 상호작용 계수와 단위는 교육을 위한 reduced unit이며, 계산 결과를 연구·의료·산업 판단에 사용하면 안 됩니다. AlphaFold의 pLDDT와 PAE는 이 앱의 에너지나 Monte Carlo 수용률과 다른 개념입니다.

## Run locally

정적 파일만 사용합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas 2D
