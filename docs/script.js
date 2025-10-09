const state = {
    movies: [],
    filtered: [],
    activeFilters: {
        searchTerm: '',
        nationality: 'all',
        genre: 'all',
        sort: 'score',
        limit: 100,
        viewMode: 'overall'
    }
};

const charts = {
    scatter: null
};

const elements = {
    tableBody: document.getElementById('movies-table'),
    searchInput: document.getElementById('search-input'),
    nationalityRadios: document.querySelectorAll('input[name="nationality"]'),
    sortRadios: document.querySelectorAll('input[name="sort"]'),
    viewModeRadios: document.querySelectorAll('input[name="view-mode"]'),
    limitSelect: document.getElementById('limit-select'),
    genreSelect: document.getElementById('genre-select'),
    resultCount: document.getElementById('result-count'),
    genreSummary: document.getElementById('genre-summary'),
    metaInfo: document.getElementById('meta-info'),
    correlationValue: document.getElementById('correlation-value'),
    correlationTrend: document.getElementById('correlation-trend'),
    correlationChart: document.getElementById('correlation-chart')
};

const formatDate = (isoDate) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return isoDate;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatScore = (value) => `${value.toFixed(1)}`;
const formatNumber = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }
    return value.toLocaleString('ko-KR');
};

const createBadge = (text, type) => {
    const span = document.createElement('span');
    span.className = `badge badge--${type}`;
    span.textContent = text === 'Domestic' ? 'Domestic (국내)' : 'Overseas (해외)';
    return span;
};

const populateGenreSelect = (movies) => {
    const genres = new Set();
    movies.forEach((movie) => movie.genre.forEach((g) => genres.add(g)));
    const sortedGenres = Array.from(genres).sort((a, b) => a.localeCompare(b, 'ko'));
    sortedGenres.forEach((genre) => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        elements.genreSelect.appendChild(option);
    });
};

const getActiveFilters = () => {
    const searchTerm = elements.searchInput.value.trim().toLowerCase();
    const nationality = Array.from(elements.nationalityRadios).find((radio) => radio.checked)?.value ?? 'all';
    const genre = elements.genreSelect.value;
    const sort = Array.from(elements.sortRadios).find((radio) => radio.checked)?.value ?? 'score';
    const viewMode = Array.from(elements.viewModeRadios).find((radio) => radio.checked)?.value ?? 'overall';
    const limitValue = Number(elements.limitSelect?.value ?? '100');
    const limit = Number.isNaN(limitValue) ? 100 : limitValue;
    return { searchTerm, nationality, genre, sort, viewMode, limit };
};

const applyFilters = () => {
    const filters = getActiveFilters();
    const { searchTerm, nationality, genre, sort } = filters;

    let filtered = state.movies.filter((movie) => {
        const matchesSearch =
            !searchTerm ||
            movie.title.toLowerCase().includes(searchTerm) ||
            movie.original_title.toLowerCase().includes(searchTerm);
        const matchesNationality = nationality === 'all' || movie.nationality === nationality;
        const matchesGenre = genre === 'all' || movie.genre.includes(genre);
        return matchesSearch && matchesNationality && matchesGenre;
    });

    filtered.sort((a, b) => {
        if (sort === 'title') {
            return a.title.localeCompare(b.title, 'ko');
        }
        if (sort === 'date') {
            return new Date(b.release_date) - new Date(a.release_date);
        }
        if (sort === 'visitors') {
            if (b.visitors !== a.visitors) {
                return b.visitors - a.visitors;
            }
            if (b.preference_score !== a.preference_score) {
                return b.preference_score - a.preference_score;
            }
            return new Date(b.release_date) - new Date(a.release_date);
        }
        if (b.preference_score !== a.preference_score) {
            return b.preference_score - a.preference_score;
        }
        return new Date(b.release_date) - new Date(a.release_date);
    });

    state.filtered = filtered;
    state.activeFilters = filters;
    renderTable();
    renderSummary();
    renderInsights();
};

const renderTable = () => {
    elements.tableBody.innerHTML = '';

    const total = state.filtered.length;
    const { limit, viewMode } = state.activeFilters;
    const limitedEntries = state.filtered
        .map((movie, index) => ({ movie, rank: index + 1 }))
        .slice(0, Math.max(0, limit));

    if (!total) {
        const emptyRow = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 8;
        td.className = 'muted-text';
        td.textContent = '조건에 맞는 작품이 없습니다.';
        emptyRow.appendChild(td);
        elements.tableBody.appendChild(emptyRow);
        elements.resultCount.textContent = '조건에 맞는 작품이 없습니다.';
        return;
    }

    const fragment = document.createDocumentFragment();

    const formatGroupLabel = (key) => {
        if (viewMode === 'nationality') {
            if (key === 'Domestic') {
                return '국내 (Domestic)';
            }
            if (key === 'Overseas') {
                return '해외 (Overseas)';
            }
        }
        return key;
    };

    const appendGroupRow = (label, count) => {
        const groupRow = document.createElement('tr');
        groupRow.className = 'group-row';
        const th = document.createElement('th');
        th.colSpan = 8;
        th.innerHTML = `<span class="group-label">${label}</span><span class="group-count">${count}편</span>`;
        groupRow.appendChild(th);
        fragment.appendChild(groupRow);
    };

    const createDataRow = ({ movie, rank }) => {
        const row = document.createElement('tr');
        const cells = [
            rank,
            movie.title,
            movie.nationality,
            movie.genre.join(', '),
            formatDate(movie.release_date),
            movie.screen_count,
            movie.visitors,
            formatScore(movie.preference_score)
        ];

        cells.forEach((cell, cellIndex) => {
            const td = document.createElement('td');
            if (cellIndex === 1) {
                const title = document.createElement('div');
                title.className = 'title-cell';
                title.innerHTML = `<strong>${movie.title}</strong>`;
                if (
                    movie.original_title &&
                    (movie.title !== movie.original_title || /[가-힣]/.test(movie.original_title))
                ) {
                    const original = document.createElement('div');
                    original.className = 'original-title';
                    original.textContent = movie.original_title;
                    title.appendChild(original);
                }
                td.appendChild(title);
            } else if (cellIndex === 2) {
                td.appendChild(createBadge(movie.nationality, movie.nationality.toLowerCase()));
            } else if (cellIndex === 5) {
                td.textContent = `${formatNumber(movie.screen_count)}곳`;
                td.classList.add('numeric-cell');
            } else if (cellIndex === 6) {
                td.textContent = `${formatNumber(movie.visitors)}명`;
                td.classList.add('numeric-cell');
            } else {
                td.textContent = cell;
                if (cellIndex === 0 || cellIndex >= 5) {
                    td.classList.add('numeric-cell');
                }
            }
            row.appendChild(td);
        });

        fragment.appendChild(row);
    };

    const buildGroups = () => {
        if (viewMode === 'genre') {
            const map = new Map();
            limitedEntries.forEach((entry) => {
                const key = entry.movie.genre[0] ?? '기타';
                if (!map.has(key)) {
                    map.set(key, []);
                }
                map.get(key).push(entry);
            });
            return Array.from(map.entries());
        }

        if (viewMode === 'nationality') {
            const map = new Map();
            limitedEntries.forEach((entry) => {
                const key = entry.movie.nationality ?? '기타';
                if (!map.has(key)) {
                    map.set(key, []);
                }
                map.get(key).push(entry);
            });
            const preferredOrder = ['Domestic', 'Overseas'];
            const ordered = preferredOrder
                .filter((key) => map.has(key))
                .map((key) => [key, map.get(key)]);
            map.forEach((value, key) => {
                if (!preferredOrder.includes(key)) {
                    ordered.push([key, value]);
                }
            });
            return ordered;
        }

        return [['전체', limitedEntries]];
    };

    const groups = buildGroups();

    groups.forEach(([key, entries]) => {
        if (!entries.length) {
            return;
        }
        if (viewMode !== 'overall') {
            appendGroupRow(formatGroupLabel(key), entries.length);
        }
        entries.forEach((entry) => {
            createDataRow(entry);
        });
    });

    elements.tableBody.appendChild(fragment);
    elements.resultCount.textContent = `총 ${total}편 중 상위 ${limitedEntries.length}편을 표시 중입니다.`;
};

const renderSummary = () => {
    elements.genreSummary.innerHTML = '';
    const averages = new Map();

    state.filtered.forEach((movie) => {
        movie.genre.forEach((genre) => {
            const current = averages.get(genre) ?? { total: 0, count: 0 };
            current.total += movie.preference_score;
            current.count += 1;
            averages.set(genre, current);
        });
    });

    const sorted = Array.from(averages.entries())
        .map(([genre, { total, count }]) => ({
            genre,
            average: total / count,
            count
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 9);

    if (!sorted.length) {
        const empty = document.createElement('p');
        empty.textContent = '선택된 조건에 해당하는 장르 정보가 없습니다.';
        empty.className = 'muted-text';
        elements.genreSummary.appendChild(empty);
        return;
    }

    sorted.forEach(({ genre, average, count }) => {
        const card = document.createElement('article');
        card.className = 'summary-card';
        const title = document.createElement('h3');
        title.textContent = `${genre} (${count}편)`;
        const score = document.createElement('span');
        score.textContent = formatScore(average);
        card.appendChild(title);
        card.appendChild(score);
        elements.genreSummary.appendChild(card);
    });
};

const computeCorrelation = (movies) => {
    const n = movies.length;
    if (n < 2) {
        return null;
    }

    const meanX = movies.reduce((total, movie) => total + movie.screen_count, 0) / n;
    const meanY = movies.reduce((total, movie) => total + movie.preference_score, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    movies.forEach((movie) => {
        const centeredX = movie.screen_count - meanX;
        const centeredY = movie.preference_score - meanY;
        numerator += centeredX * centeredY;
        sumSqX += centeredX ** 2;
        sumSqY += centeredY ** 2;
    });

    if (!sumSqX || !sumSqY) {
        return null;
    }

    return numerator / Math.sqrt(sumSqX * sumSqY);
};

const describeCorrelation = (value) => {
    const magnitude = Math.abs(value);
    let strength;

    if (magnitude >= 0.7) {
        strength = '강한';
    } else if (magnitude >= 0.4) {
        strength = '중간 정도의';
    } else if (magnitude >= 0.2) {
        strength = '약한';
    } else {
        strength = '뚜렷하지 않은';
    }

    const direction = value >= 0 ? '양의' : '음의';
    return `${strength} ${direction} 상관`; // e.g., 강한 양의 상관
};

const updateScatterChart = (movies) => {
    if (!elements.correlationChart || typeof Chart === 'undefined') {
        return;
    }

    const dataset = movies.map((movie) => ({
        x: movie.screen_count,
        y: movie.preference_score,
        movie
    }));

    if (!charts.scatter) {
        charts.scatter = new Chart(elements.correlationChart, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: '상영관-선호도',
                        data: dataset,
                        backgroundColor: 'rgba(37, 99, 235, 0.6)',
                        borderColor: 'rgba(37, 99, 235, 0.9)',
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '상영관 수'
                        },
                        ticks: {
                            callback: (value) => formatNumber(Number(value))
                        },
                        grid: {
                            color: 'rgba(37, 99, 235, 0.08)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '선호도 점수'
                        },
                        suggestedMin: 60,
                        suggestedMax: 100,
                        grid: {
                            color: 'rgba(37, 99, 235, 0.08)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const { movie } = context.raw;
                                return [
                                    movie.title,
                                    `선호도: ${formatScore(movie.preference_score)}`,
                                    `상영관 수: ${formatNumber(movie.screen_count)}곳`,
                                    `관객 수: ${formatNumber(movie.visitors)}명`
                                ];
                            }
                        }
                    }
                }
            }
        });
    } else {
        charts.scatter.data.datasets[0].data = dataset;
        charts.scatter.update('none');
    }
};

const renderInsights = () => {
    if (!elements.correlationValue || !elements.correlationTrend) {
        return;
    }

    if (!state.filtered.length) {
        elements.correlationValue.textContent = '조건에 맞는 데이터가 없습니다.';
        elements.correlationTrend.textContent = '';
        updateScatterChart([]);
        return;
    }

    const correlation = computeCorrelation(state.filtered);

    if (correlation === null) {
        elements.correlationValue.textContent = '상영관 수 또는 선호도 변동 폭이 부족해 상관을 계산할 수 없습니다.';
        elements.correlationTrend.textContent = '';
        updateScatterChart(state.filtered);
        return;
    }

    elements.correlationValue.textContent = `피어슨 상관계수 r = ${correlation.toFixed(2)}`;
    elements.correlationTrend.textContent = `${describeCorrelation(correlation)} 관계가 관측되었습니다.`;
    updateScatterChart(state.filtered);
};

const renderMeta = () => {
    const total = state.movies.length;
    const domestic = state.movies.filter((movie) => movie.nationality === 'Domestic').length;
    const overseas = total - domestic;
    const latestDate = state.movies.reduce((latest, movie) =>
        new Date(movie.release_date) > new Date(latest) ? movie.release_date : latest,
    state.movies[0]?.release_date ?? '');

    elements.metaInfo.innerHTML = [
        `총 ${total}편 수록`,
        `국내 ${domestic}편`,
        `해외 ${overseas}편`,
        `최근 업데이트: ${document.lastModified.split(' ')[0]}`,
        latestDate ? `최신 개봉일: ${formatDate(latestDate)}` : null
    ]
        .filter(Boolean)
        .map((text) => `<span>${text}</span>`)
        .join('');
};

const attachEvents = () => {
    elements.searchInput.addEventListener('input', () => {
        window.requestAnimationFrame(applyFilters);
    });

    elements.genreSelect.addEventListener('change', applyFilters);

    elements.nationalityRadios.forEach((radio) => {
        radio.addEventListener('change', applyFilters);
    });

    elements.sortRadios.forEach((radio) => {
        radio.addEventListener('change', applyFilters);
    });

    elements.viewModeRadios.forEach((radio) => {
        radio.addEventListener('change', applyFilters);
    });

    if (elements.limitSelect) {
        elements.limitSelect.addEventListener('change', applyFilters);
    }
};

const loadData = async () => {
    try {
        const dataUrl = new URL('./data/movies.json', window.location.href);
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error('데이터를 불러오지 못했습니다.');
        }
        const data = await response.json();
        state.movies = data.movies;
        populateGenreSelect(state.movies);
        renderMeta();
        attachEvents();
        applyFilters();
    } catch (error) {
        elements.tableBody.innerHTML = `<tr><td colspan="8" class="error">${error.message}</td></tr>`;
        console.error(error);
    }
};

loadData();
