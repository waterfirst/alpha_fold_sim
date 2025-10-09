# 한국 개봉작 선호도 TOP 100 대시보드

이 프로젝트는 최근 1년간 한국에서 개봉한 국내·해외 영화의 SNS 리뷰를 수집해 산출한 **선호도 TOP 100**을 시각화한 웹 페이지입니다. 장르별 평균 점수, 국적 필터, 검색 기능을 제공하여 관심 있는 작품을 빠르게 찾아볼 수 있습니다.

> ⚠️ 수집 로직을 설명하기 위한 예시용 데이터로 구성되어 실제 집계 결과와 차이가 있을 수 있습니다.

## 주요 특징

- **국적 구분**: Domestic(국내) / Overseas(해외) 필터를 통해 한국 영화와 수입작을 구분 확인
- **장르별 인사이트**: 현재 필터 조건에 해당하는 장르별 평균 선호도 상위 9개를 카드 형태로 제공
- **흥행 지표 표시**: 각 작품의 실제 관객 수와 상영관 수(스크린 수)를 함께 표로 노출
- **상관 분석 시각화**: 선호도 점수와 상영관 수의 관계를 산점도와 피어슨 상관계수로 분석
- **다중 필터링**: 제목 검색, 국적, 장르, 정렬 옵션(선호도·제목·개봉일·관객 수)을 조합해 원하는 결과 탐색
- **보기 구분 옵션**: 통합·장르별·국적별 그룹으로 랭킹을 묶어 원하는 시각으로 비교 가능
- **표시 개수 선택**: 상위 10·20·50·100편 중 원하는 개수만 테이블에 노출
- **정적 데이터 제공**: `docs/data/movies.json`에 선호도, 개봉일, 원제, 국적, 장르, 관객 수, 상영관 수 정보 포함

## 사용 방법

1. 저장소를 클론하거나 ZIP으로 내려받은 뒤 압축을 풉니다.
2. `docs/index.html`을 브라우저로 직접 열거나 `python -m http.server --directory docs 8000`으로 로컬 서버를 실행합니다.
3. 상단 필터와 보기 옵션(정렬·보기 구분·표시 개수)을 조합해 원하는 조건을 선택하면 테이블과 장르 요약이 즉시 갱신됩니다.

## 데이터 구조

`docs/data/movies.json` 파일은 다음과 같은 필드를 갖습니다.

```json
{
  "generated_on": "YYYY-MM-DD",
  "movies": [
    {
      "title": "영화 제목",
      "original_title": "원제",
      "release_date": "YYYY-MM-DD",
      "nationality": "Domestic | Overseas",
      "origin_country": "제작국가",
      "genre": ["장르1", "장르2"],
      "preference_score": 0-100 실수값,
      "visitors": 관객 수(명),
      "screen_count": 상영관 수(곳)
    }
  ]
}
```

## 개발 정보

- **기술 스택**: HTML5, CSS3, JavaScript(ES modules 없이 vanilla JS)
- **스타일링**: 반응형 카드 및 테이블 UI, 다크 모드 친화적인 색 구성
- **스크립트**: `scripts/generate_movie_dataset.py`로 데이터셋 재생성 가능 (Python 3 필요)

## 커스텀 데이터로 교체하기

1. `docs/data/movies.json`의 `movies` 배열을 원하는 데이터로 교체합니다.
2. `preference_score`는 0~100 사이 값(소수점 허용)으로 기입합니다.
3. 로컬 서버를 재시작하거나 페이지를 새로고침하면 즉시 반영됩니다.

## GitHub Pages 배포하기

1. 이 저장소를 GitHub에 푸시합니다.
2. 저장소의 **Settings ▸ Pages**로 이동합니다.
3. **Deploy from a branch**를 선택하고, **Branch**는 `main`, **Folder**는 `/docs`로 지정한 뒤 **Save**를 누릅니다.
4. 몇 분 뒤 생성되는 GitHub Pages URL에 접속하면 `docs` 폴더의 정적 사이트가 그대로 노출됩니다.

> GitHub Pages에 배포된 후에도 `scripts/generate_movie_dataset.py`를 실행하면 최신 데이터가 `docs/data/movies.json`에 저장되어 곧바로 배포본에 반영됩니다.

## 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다.

## 감사의 글

SNS 기반 데이터 수집 및 영화 산업 분석에 영감을 주신 모든 관계자분께 감사드립니다.
