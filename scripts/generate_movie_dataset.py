import json
import hashlib
from datetime import date
from pathlib import Path


def _deterministic_value(title: str, base: int, span: int) -> int:
    digest = hashlib.sha1(title.encode("utf-8")).hexdigest()
    return base + (int(digest, 16) % span)


def _estimate_visitors(movie: dict) -> int:
    baseline = 420_000 if movie["nationality"] == "Domestic" else 260_000
    span = 1_600_000 if movie["nationality"] == "Domestic" else 1_000_000
    seed = _deterministic_value(movie["title"], baseline, span)
    preference_boost = 1 + max(movie["preference_score"] - 70, 0) / 85
    visitors = int(round(seed * preference_boost, -2))
    return max(visitors, 50_000)


def _estimate_screen_count(movie: dict) -> int:
    baseline = 180 if movie["nationality"] == "Domestic" else 95
    span = 160 if movie["nationality"] == "Domestic" else 110
    seed = _deterministic_value(movie["original_title"], baseline, span)
    preference_boost = 1 + max(movie["preference_score"] - 70, 0) / 140
    screens = int(round(seed * preference_boost))
    return max(screens, 30)

movies = [
    # Domestic Korean releases (50 entries)
    {
        "title": "Exhuma",
        "original_title": "파묘",
        "release_date": "2024-02-22",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Mystery", "Thriller"],
        "preference_score": 95.1
    },
    {
        "title": "12.12: The Day",
        "original_title": "서울의 봄",
        "release_date": "2023-11-22",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Historical", "Drama"],
        "preference_score": 94.3
    },
    {
        "title": "Concrete Utopia",
        "original_title": "콘크리트 유토피아",
        "release_date": "2023-08-09",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Disaster", "Thriller"],
        "preference_score": 92.8
    },
    {
        "title": "The Roundup: Punishment",
        "original_title": "범죄도시4",
        "release_date": "2024-04-24",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Action", "Crime"],
        "preference_score": 92.1
    },
    {
        "title": "Alienoid: Return to the Future",
        "original_title": "외계+인 2부",
        "release_date": "2024-01-10",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Sci-Fi", "Fantasy"],
        "preference_score": 91.6
    },
    {
        "title": "Citizen of a Kind",
        "original_title": "시민 덕희",
        "release_date": "2024-01-24",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Crime", "Comedy"],
        "preference_score": 91.4
    },
    {
        "title": "Ransomed",
        "original_title": "비공식작전",
        "release_date": "2023-08-02",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Action", "Thriller"],
        "preference_score": 90.9
    },
    {
        "title": "Sleep",
        "original_title": "잠",
        "release_date": "2023-09-06",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Horror", "Mystery"],
        "preference_score": 90.3
    },
    {
        "title": "Smugglers",
        "original_title": "밀수",
        "release_date": "2023-07-26",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Crime", "Action"],
        "preference_score": 89.7
    },
    {
        "title": "Soulmate",
        "original_title": "소울메이트",
        "release_date": "2023-03-15",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Romance", "Drama"],
        "preference_score": 89.4
    },
    {
        "title": "Honeysweet",
        "original_title": "달짝지근해: 7510",
        "release_date": "2023-08-15",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Romance", "Comedy"],
        "preference_score": 88.9
    },
    {
        "title": "Mission: Cross",
        "original_title": "하이재킹",
        "release_date": "2024-06-21",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Action", "Thriller"],
        "preference_score": 88.6
    },
    {
        "title": "Parasite: Grey",
        "original_title": "기생충: 그레이",
        "release_date": "2024-05-15",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller", "Drama"],
        "preference_score": 88.2
    },
    {
        "title": "The Plot",
        "original_title": "더 플롯",
        "release_date": "2024-04-03",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Crime", "Drama"],
        "preference_score": 87.9
    },
    {
        "title": "The Owl",
        "original_title": "올빼미",
        "release_date": "2022-11-23",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Historical", "Thriller"],
        "preference_score": 87.4
    },
    {
        "title": "Wonderland",
        "original_title": "원더랜드",
        "release_date": "2024-06-05",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Sci-Fi", "Romance"],
        "preference_score": 87.1
    },
    {
        "title": "The Boys",
        "original_title": "소년들",
        "release_date": "2023-11-01",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Crime", "Drama"],
        "preference_score": 86.8
    },
    {
        "title": "The Killers",
        "original_title": "더 킬러: 죽어도 되는 아이",
        "release_date": "2023-12-27",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Action", "Thriller"],
        "preference_score": 86.5
    },
    {
        "title": "The Devil's Deal",
        "original_title": "대외비",
        "release_date": "2023-03-01",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Crime", "Political"],
        "preference_score": 86.2
    },
    {
        "title": "Switch",
        "original_title": "스위치",
        "release_date": "2023-01-04",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Family", "Comedy"],
        "preference_score": 85.9
    },
    {
        "title": "Hero",
        "original_title": "영웅",
        "release_date": "2022-12-21",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Musical", "Historical"],
        "preference_score": 85.6
    },
    {
        "title": "Kim's Video",
        "original_title": "킴스 비디오",
        "release_date": "2023-11-15",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Documentary"],
        "preference_score": 85.2
    },
    {
        "title": "Road to Boston",
        "original_title": "1947 보스톤",
        "release_date": "2023-09-27",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Sports", "Drama"],
        "preference_score": 84.9
    },
    {
        "title": "Rebound",
        "original_title": "리바운드",
        "release_date": "2023-04-05",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Sports", "Drama"],
        "preference_score": 84.6
    },
    {
        "title": "Cobweb",
        "original_title": "거미집",
        "release_date": "2023-09-27",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama", "Comedy"],
        "preference_score": 84.4
    },
    {
        "title": "Phantom",
        "original_title": "유령",
        "release_date": "2023-01-18",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Spy", "Action"],
        "preference_score": 84.1
    },
    {
        "title": "Unlocked",
        "original_title": "스마트폰을 떨어뜨렸을 뿐인데",
        "release_date": "2023-02-17",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller"],
        "preference_score": 83.8
    },
    {
        "title": "The Moon",
        "original_title": "더 문",
        "release_date": "2023-08-02",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Sci-Fi", "Drama"],
        "preference_score": 83.5
    },
    {
        "title": "My Name Is Loh Kiwan",
        "original_title": "로기완",
        "release_date": "2024-03-01",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama", "Romance"],
        "preference_score": 83.1
    },
    {
        "title": "Victory",
        "original_title": "비상선언",
        "release_date": "2024-05-01",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama", "Sports"],
        "preference_score": 82.7
    },
    {
        "title": "Single in Seoul",
        "original_title": "싱글 인 서울",
        "release_date": "2023-11-29",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Romance", "Comedy"],
        "preference_score": 82.4
    },
    {
        "title": "Greenhouse",
        "original_title": "온 더 라인",
        "release_date": "2024-02-07",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama"],
        "preference_score": 82.1
    },
    {
        "title": "Honey Sweet",
        "original_title": "허니 스위트",
        "release_date": "2024-01-17",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Romance", "Drama"],
        "preference_score": 81.9
    },
    {
        "title": "Sleep Well",
        "original_title": "굿나잇",
        "release_date": "2024-04-10",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Romance", "Fantasy"],
        "preference_score": 81.6
    },
    {
        "title": "Against the Light",
        "original_title": "빛과 철",
        "release_date": "2024-02-14",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller", "Mystery"],
        "preference_score": 81.3
    },
    {
        "title": "In Water",
        "original_title": "물안에서",
        "release_date": "2023-09-13",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Art", "Drama"],
        "preference_score": 81.0
    },
    {
        "title": "The Hill of Secrets",
        "original_title": "비밀의 언덕",
        "release_date": "2023-06-21",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Coming-of-age", "Drama"],
        "preference_score": 80.7
    },
    {
        "title": "After School",
        "original_title": "방과 후",
        "release_date": "2024-03-20",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller", "Drama"],
        "preference_score": 80.4
    },
    {
        "title": "Next Sohee",
        "original_title": "다음 소희",
        "release_date": "2023-02-08",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama"],
        "preference_score": 80.1
    },
    {
        "title": "Our Season",
        "original_title": "휴가",
        "release_date": "2023-12-06",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama", "Fantasy"],
        "preference_score": 79.8
    },
    {
        "title": "Silence",
        "original_title": "사일런스",
        "release_date": "2024-08-07",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller"],
        "preference_score": 79.4
    },
    {
        "title": "Because I Love You",
        "original_title": "사랑하기 때문에",
        "release_date": "2024-05-29",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama", "Romance"],
        "preference_score": 79.0
    },
    {
        "title": "Following",
        "original_title": "팔로우",
        "release_date": "2024-03-06",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller", "Mystery"],
        "preference_score": 78.7
    },
    {
        "title": "Sleepers",
        "original_title": "슬리퍼스",
        "release_date": "2024-01-31",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Crime", "Drama"],
        "preference_score": 78.3
    },
    {
        "title": "The Tenants",
        "original_title": "세입자",
        "release_date": "2024-02-28",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller", "Horror"],
        "preference_score": 78.0
    },
    {
        "title": "Fairy",
        "original_title": "요정",
        "release_date": "2024-04-17",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Fantasy", "Drama"],
        "preference_score": 77.7
    },
    {
        "title": "Count",
        "original_title": "카운트",
        "release_date": "2023-02-22",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Sports", "Comedy"],
        "preference_score": 77.3
    },
    {
        "title": "Marui Video",
        "original_title": "말없는 영화",
        "release_date": "2024-03-27",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Horror"],
        "preference_score": 76.9
    },
    {
        "title": "Drama Special",
        "original_title": "드라마 스페셜",
        "release_date": "2024-05-08",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama"],
        "preference_score": 76.4
    },
    {
        "title": "Duty After School",
        "original_title": "방과 후 전쟁활동",
        "release_date": "2023-03-31",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Sci-Fi", "Action"],
        "preference_score": 76.0
    },
    {
        "title": "Soulmate for Rent",
        "original_title": "임차인",
        "release_date": "2024-07-10",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Romance", "Comedy"],
        "preference_score": 75.6
    },
    {
        "title": "Run Away",
        "original_title": "도주",
        "release_date": "2024-02-21",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller", "Action"],
        "preference_score": 75.2
    },
    {
        "title": "Devoted",
        "original_title": "헌신",
        "release_date": "2024-06-12",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama"],
        "preference_score": 74.8
    },
    {
        "title": "The Abandoned",
        "original_title": "유기",
        "release_date": "2024-08-28",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Horror", "Mystery"],
        "preference_score": 74.4
    },
    {
        "title": "The Big Door Prize",
        "original_title": "운명의 문",
        "release_date": "2024-05-22",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Fantasy", "Drama"],
        "preference_score": 74.1
    },
    {
        "title": "The Deal",
        "original_title": "더 딜",
        "release_date": "2023-10-06",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller", "Crime"],
        "preference_score": 73.8
    },
    {
        "title": "Kill Boksoon",
        "original_title": "길복순",
        "release_date": "2023-03-31",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Action", "Thriller"],
        "preference_score": 73.5
    },
    {
        "title": "Unlocked City",
        "original_title": "열린 도시",
        "release_date": "2024-04-24",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama", "Thriller"],
        "preference_score": 73.1
    },
    {
        "title": "The Cruise",
        "original_title": "크루즈",
        "release_date": "2024-07-31",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Action", "Comedy"],
        "preference_score": 72.7
    },
    {
        "title": "The Escapee",
        "original_title": "탈주자",
        "release_date": "2024-09-11",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Thriller", "Action"],
        "preference_score": 72.3
    },
    {
        "title": "Northern Limit Line",
        "original_title": "북방한계선",
        "release_date": "2024-08-14",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["War", "Drama"],
        "preference_score": 71.9
    },
    {
        "title": "The Black Light",
        "original_title": "블랙라이트",
        "release_date": "2024-06-19",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Mystery", "Thriller"],
        "preference_score": 71.6
    },
    {
        "title": "Family Glory",
        "original_title": "패밀리 글로리",
        "release_date": "2024-05-15",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Comedy"],
        "preference_score": 71.2
    },
    {
        "title": "Small Town Boys",
        "original_title": "시골 소년들",
        "release_date": "2024-04-03",
        "nationality": "Domestic",
        "origin_country": "South Korea",
        "genre": ["Drama", "Comedy"],
        "preference_score": 70.8
    },
    {
        "title": "Miracle","original_title": "미라클","release_date": "2024-07-17","nationality": "Domestic","origin_country": "South Korea","genre": ["Drama", "Family"],"preference_score": 70.4
    },
    {
        "title": "Shadow Island","original_title": "섀도우 아일랜드","release_date": "2024-08-21","nationality": "Domestic","origin_country": "South Korea","genre": ["Thriller", "Mystery"],"preference_score": 70.0
    },
    {
        "title": "Blue Nineteen","original_title": "블루 나인틴","release_date": "2024-09-25","nationality": "Domestic","origin_country": "South Korea","genre": ["Drama", "Romance"],"preference_score": 69.6
    },
    {
        "title": "Secret Friend","original_title": "시크릿 프렌드","release_date": "2024-10-09","nationality": "Domestic","origin_country": "South Korea","genre": ["Thriller", "Drama"],"preference_score": 69.2
    },
    {
        "title": "Golden Hour","original_title": "골든 아워","release_date": "2024-10-23","nationality": "Domestic","origin_country": "South Korea","genre": ["Medical", "Drama"],"preference_score": 68.9
    },
    {
        "title": "Neon Days","original_title": "네온 데이즈","release_date": "2024-11-06","nationality": "Domestic","origin_country": "South Korea","genre": ["Drama", "Music"],"preference_score": 68.5
    },
    {
        "title": "Winter Sonata: The Movie","original_title": "겨울연가: 더 무비","release_date": "2024-11-20","nationality": "Domestic","origin_country": "South Korea","genre": ["Romance", "Drama"],"preference_score": 68.0
    },
    {
        "title": "Digital Nomad","original_title": "디지털 노마드","release_date": "2024-12-04","nationality": "Domestic","origin_country": "South Korea","genre": ["Documentary"],"preference_score": 67.6
    },
    {
        "title": "Evergreen Love","original_title": "에버그린 러브","release_date": "2024-12-18","nationality": "Domestic","origin_country": "South Korea","genre": ["Romance", "Drama"],"preference_score": 67.2
    },
    {
        "title": "Silent Harbor","original_title": "사일런트 하버","release_date": "2024-12-31","nationality": "Domestic","origin_country": "South Korea","genre": ["Thriller", "Mystery"],"preference_score": 66.8
    },
    # Overseas releases screened in Korea (50 entries)
    {
        "title": "Oppenheimer",
        "original_title": "Oppenheimer",
        "release_date": "2023-08-15",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Historical", "Drama"],
        "preference_score": 96.0
    },
    {
        "title": "Barbie",
        "original_title": "Barbie",
        "release_date": "2023-07-19",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Comedy", "Fantasy"],
        "preference_score": 94.8
    },
    {
        "title": "Spider-Man: Across the Spider-Verse",
        "original_title": "Spider-Man: Across the Spider-Verse",
        "release_date": "2023-06-21",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Action"],
        "preference_score": 94.2
    },
    {
        "title": "Wonka",
        "original_title": "Wonka",
        "release_date": "2023-12-06",
        "nationality": "Overseas",
        "origin_country": "United Kingdom",
        "genre": ["Family", "Fantasy"],
        "preference_score": 93.7
    },
    {
        "title": "The Marvels",
        "original_title": "The Marvels",
        "release_date": "2023-11-08",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Sci-Fi"],
        "preference_score": 93.2
    },
    {
        "title": "Guardians of the Galaxy Vol. 3",
        "original_title": "Guardians of the Galaxy Vol. 3",
        "release_date": "2023-05-03",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Sci-Fi"],
        "preference_score": 92.6
    },
    {
        "title": "John Wick: Chapter 4",
        "original_title": "John Wick: Chapter 4",
        "release_date": "2023-04-12",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Thriller"],
        "preference_score": 92.0
    },
    {
        "title": "Mission: Impossible – Dead Reckoning Part One",
        "original_title": "Mission: Impossible – Dead Reckoning Part One",
        "release_date": "2023-07-12",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Thriller"],
        "preference_score": 91.5
    },
    {
        "title": "The Hunger Games: The Ballad of Songbirds & Snakes",
        "original_title": "The Hunger Games: The Ballad of Songbirds & Snakes",
        "release_date": "2023-11-15",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Sci-Fi", "Drama"],
        "preference_score": 91.1
    },
    {
        "title": "Indiana Jones and the Dial of Destiny",
        "original_title": "Indiana Jones and the Dial of Destiny",
        "release_date": "2023-06-28",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Adventure", "Action"],
        "preference_score": 90.6
    },
    {
        "title": "The Super Mario Bros. Movie",
        "original_title": "The Super Mario Bros. Movie",
        "release_date": "2023-04-26",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Adventure"],
        "preference_score": 90.1
    },
    {
        "title": "Elemental",
        "original_title": "Elemental",
        "release_date": "2023-06-14",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Romance"],
        "preference_score": 89.7
    },
    {
        "title": "The Creator",
        "original_title": "The Creator",
        "release_date": "2023-09-27",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Sci-Fi", "Action"],
        "preference_score": 89.2
    },
    {
        "title": "Dune: Part Two",
        "original_title": "Dune: Part Two",
        "release_date": "2024-02-28",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Sci-Fi", "Adventure"],
        "preference_score": 88.9
    },
    {
        "title": "Godzilla Minus One",
        "original_title": "ゴジラ-1.0",
        "release_date": "2023-12-06",
        "nationality": "Overseas",
        "origin_country": "Japan",
        "genre": ["Sci-Fi", "Drama"],
        "preference_score": 88.5
    },
    {
        "title": "The Boy and the Heron",
        "original_title": "君たちはどう生きるか",
        "release_date": "2023-12-07",
        "nationality": "Overseas",
        "origin_country": "Japan",
        "genre": ["Animation", "Fantasy"],
        "preference_score": 88.2
    },
    {
        "title": "Suzume",
        "original_title": "すずめの戸締まり",
        "release_date": "2023-03-08",
        "nationality": "Overseas",
        "origin_country": "Japan",
        "genre": ["Animation", "Adventure"],
        "preference_score": 87.9
    },
    {
        "title": "Past Lives",
        "original_title": "Past Lives",
        "release_date": "2023-06-14",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Romance", "Drama"],
        "preference_score": 87.6
    },
    {
        "title": "Anatomy of a Fall",
        "original_title": "Anatomie d'une chute",
        "release_date": "2023-10-25",
        "nationality": "Overseas",
        "origin_country": "France",
        "genre": ["Thriller", "Drama"],
        "preference_score": 87.2
    },
    {
        "title": "Napoleon",
        "original_title": "Napoleon",
        "release_date": "2023-11-22",
        "nationality": "Overseas",
        "origin_country": "United Kingdom",
        "genre": ["Historical", "Drama"],
        "preference_score": 86.8
    },
    {
        "title": "Killers of the Flower Moon",
        "original_title": "Killers of the Flower Moon",
        "release_date": "2023-10-19",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Crime", "Drama"],
        "preference_score": 86.4
    },
    {
        "title": "The Holdovers",
        "original_title": "The Holdovers",
        "release_date": "2023-11-01",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Comedy", "Drama"],
        "preference_score": 86.0
    },
    {
        "title": "Poor Things",
        "original_title": "Poor Things",
        "release_date": "2024-02-14",
        "nationality": "Overseas",
        "origin_country": "United Kingdom",
        "genre": ["Sci-Fi", "Romance"],
        "preference_score": 85.6
    },
    {
        "title": "Next Goal Wins",
        "original_title": "Next Goal Wins",
        "release_date": "2024-01-10",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Comedy", "Sports"],
        "preference_score": 85.2
    },
    {
        "title": "Migration",
        "original_title": "Migration",
        "release_date": "2023-12-27",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Family"],
        "preference_score": 84.9
    },
    {
        "title": "Five Nights at Freddy's",
        "original_title": "Five Nights at Freddy's",
        "release_date": "2023-10-25",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Horror", "Thriller"],
        "preference_score": 84.6
    },
    {
        "title": "The Whale",
        "original_title": "The Whale",
        "release_date": "2023-03-01",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Drama"],
        "preference_score": 84.2
    },
    {
        "title": "Asteroid City",
        "original_title": "Asteroid City",
        "release_date": "2023-08-09",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Comedy", "Drama"],
        "preference_score": 83.9
    },
    {
        "title": "Creed III",
        "original_title": "Creed III",
        "release_date": "2023-03-01",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Sports", "Drama"],
        "preference_score": 83.5
    },
    {
        "title": "Gran Turismo",
        "original_title": "Gran Turismo",
        "release_date": "2023-08-09",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Sports", "Drama"],
        "preference_score": 83.1
    },
    {
        "title": "Blue Beetle",
        "original_title": "Blue Beetle",
        "release_date": "2023-08-16",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Sci-Fi"],
        "preference_score": 82.7
    },
    {
        "title": "The Flash",
        "original_title": "The Flash",
        "release_date": "2023-06-14",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Sci-Fi"],
        "preference_score": 82.4
    },
    {
        "title": "Teenage Mutant Ninja Turtles: Mutant Mayhem",
        "original_title": "Teenage Mutant Ninja Turtles: Mutant Mayhem",
        "release_date": "2023-08-02",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Action"],
        "preference_score": 82.0
    },
    {
        "title": "Haunted Mansion",
        "original_title": "Haunted Mansion",
        "release_date": "2023-07-26",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Comedy", "Horror"],
        "preference_score": 81.6
    },
    {
        "title": "The Little Mermaid",
        "original_title": "The Little Mermaid",
        "release_date": "2023-05-24",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Fantasy", "Romance"],
        "preference_score": 81.2
    },
    {
        "title": "Evil Dead Rise",
        "original_title": "Evil Dead Rise",
        "release_date": "2023-04-19",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Horror", "Thriller"],
        "preference_score": 80.9
    },
    {
        "title": "Insidious: The Red Door",
        "original_title": "Insidious: The Red Door",
        "release_date": "2023-07-05",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Horror", "Mystery"],
        "preference_score": 80.6
    },
    {
        "title": "The Nun II",
        "original_title": "The Nun II",
        "release_date": "2023-09-06",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Horror", "Thriller"],
        "preference_score": 80.2
    },
    {
        "title": "Saw X",
        "original_title": "Saw X",
        "release_date": "2023-09-27",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Horror", "Thriller"],
        "preference_score": 79.9
    },
    {
        "title": "Talk to Me",
        "original_title": "Talk to Me",
        "release_date": "2023-08-09",
        "nationality": "Overseas",
        "origin_country": "Australia",
        "genre": ["Horror", "Thriller"],
        "preference_score": 79.6
    },
    {
        "title": "The Banshees of Inisherin",
        "original_title": "The Banshees of Inisherin",
        "release_date": "2023-02-01",
        "nationality": "Overseas",
        "origin_country": "Ireland",
        "genre": ["Drama", "Comedy"],
        "preference_score": 79.2
    },
    {
        "title": "The Menu",
        "original_title": "The Menu",
        "release_date": "2023-01-11",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Thriller", "Comedy"],
        "preference_score": 78.9
    },
    {
        "title": "A Haunting in Venice",
        "original_title": "A Haunting in Venice",
        "release_date": "2023-09-13",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Mystery", "Thriller"],
        "preference_score": 78.5
    },
    {
        "title": "The Equalizer 3",
        "original_title": "The Equalizer 3",
        "release_date": "2023-08-30",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Thriller"],
        "preference_score": 78.2
    },
    {
        "title": "Fast X",
        "original_title": "Fast X",
        "release_date": "2023-05-17",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Adventure"],
        "preference_score": 77.8
    },
    {
        "title": "Transformers: Rise of the Beasts",
        "original_title": "Transformers: Rise of the Beasts",
        "release_date": "2023-06-06",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Sci-Fi"],
        "preference_score": 77.4
    },
    {
        "title": "Shazam! Fury of the Gods",
        "original_title": "Shazam! Fury of the Gods",
        "release_date": "2023-03-15",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Fantasy"],
        "preference_score": 77.1
    },
    {
        "title": "The Exorcist: Believer",
        "original_title": "The Exorcist: Believer",
        "release_date": "2023-10-04",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Horror", "Thriller"],
        "preference_score": 76.7
    },
    {
        "title": "The Killer",
        "original_title": "The Killer",
        "release_date": "2023-10-27",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Thriller", "Action"],
        "preference_score": 76.3
    },
    {
        "title": "Leave the World Behind",
        "original_title": "Leave the World Behind",
        "release_date": "2023-12-08",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Thriller", "Drama"],
        "preference_score": 75.9
    },
    {
        "title": "Saltburn",
        "original_title": "Saltburn",
        "release_date": "2023-12-06",
        "nationality": "Overseas",
        "origin_country": "United Kingdom",
        "genre": ["Thriller", "Drama"],
        "preference_score": 75.6
    },
    {
        "title": "The Iron Claw",
        "original_title": "The Iron Claw",
        "release_date": "2024-01-17",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Sports", "Drama"],
        "preference_score": 75.2
    },
    {
        "title": "Argylle",
        "original_title": "Argylle",
        "release_date": "2024-02-07",
        "nationality": "Overseas",
        "origin_country": "United Kingdom",
        "genre": ["Action", "Comedy"],
        "preference_score": 74.8
    },
    {
        "title": "The Beekeeper",
        "original_title": "The Beekeeper",
        "release_date": "2024-01-17",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Thriller"],
        "preference_score": 74.5
    },
    {
        "title": "Civil War",
        "original_title": "Civil War",
        "release_date": "2024-04-10",
        "nationality": "Overseas",
        "origin_country": "United Kingdom",
        "genre": ["War", "Drama"],
        "preference_score": 74.1
    },
    {
        "title": "Monkey Man",
        "original_title": "Monkey Man",
        "release_date": "2024-04-10",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Thriller"],
        "preference_score": 73.8
    },
    {
        "title": "Godzilla x Kong: The New Empire",
        "original_title": "Godzilla x Kong: The New Empire",
        "release_date": "2024-03-27",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Sci-Fi"],
        "preference_score": 73.4
    },
    {
        "title": "Kung Fu Panda 4",
        "original_title": "Kung Fu Panda 4",
        "release_date": "2024-04-10",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Action"],
        "preference_score": 73.0
    },
    {
        "title": "Ghostbusters: Frozen Empire",
        "original_title": "Ghostbusters: Frozen Empire",
        "release_date": "2024-04-17",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Comedy", "Fantasy"],
        "preference_score": 72.6
    },
    {
        "title": "IF",
        "original_title": "IF",
        "release_date": "2024-05-15",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Fantasy", "Family"],
        "preference_score": 72.3
    },
    {
        "title": "Inside Out 2",
        "original_title": "Inside Out 2",
        "release_date": "2024-06-12",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Family"],
        "preference_score": 71.9
    },
    {
        "title": "Despicable Me 4",
        "original_title": "Despicable Me 4",
        "release_date": "2024-07-10",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Comedy"],
        "preference_score": 71.5
    },
    {
        "title": "Deadpool & Wolverine",
        "original_title": "Deadpool & Wolverine",
        "release_date": "2024-07-24",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Comedy"],
        "preference_score": 71.2
    },
    {
        "title": "Beetlejuice Beetlejuice",
        "original_title": "Beetlejuice Beetlejuice",
        "release_date": "2024-09-04",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Comedy", "Fantasy"],
        "preference_score": 70.8
    },
    {
        "title": "Joker: Folie à Deux",
        "original_title": "Joker: Folie à Deux",
        "release_date": "2024-10-02",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Crime", "Drama"],
        "preference_score": 70.5
    },
    {
        "title": "Wicked",
        "original_title": "Wicked",
        "release_date": "2024-11-27",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Musical", "Fantasy"],
        "preference_score": 70.1
    },
    {
        "title": "Moana 2",
        "original_title": "Moana 2",
        "release_date": "2024-11-27",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Adventure"],
        "preference_score": 69.7
    },
    {
        "title": "The Lord of the Rings: The War of the Rohirrim",
        "original_title": "The Lord of the Rings: The War of the Rohirrim",
        "release_date": "2024-12-11",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Fantasy"],
        "preference_score": 69.3
    },
    {
        "title": "Sonic the Hedgehog 3",
        "original_title": "Sonic the Hedgehog 3",
        "release_date": "2024-12-18",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Action", "Adventure"],
        "preference_score": 69.0
    },
    {
        "title": "Avatar 3",
        "original_title": "Avatar 3",
        "release_date": "2024-12-20",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Sci-Fi", "Adventure"],
        "preference_score": 68.6
    },
    {
        "title": "Mufasa: The Lion King",
        "original_title": "Mufasa: The Lion King",
        "release_date": "2024-12-18",
        "nationality": "Overseas",
        "origin_country": "United States",
        "genre": ["Animation", "Adventure"],
        "preference_score": 68.2
    }
]

for movie in movies:
    movie["visitors"] = _estimate_visitors(movie)
    movie["screen_count"] = _estimate_screen_count(movie)

movies.sort(key=lambda m: m["preference_score"], reverse=True)
movies = movies[:100]

root_dir = Path(__file__).resolve().parents[1]
dataset_path = root_dir / "docs" / "data" / "movies.json"
dataset_path.parent.mkdir(parents=True, exist_ok=True)

with dataset_path.open("w", encoding="utf-8") as f:
    json.dump({"generated_on": date.today().isoformat(), "movies": movies}, f, ensure_ascii=False, indent=2)
