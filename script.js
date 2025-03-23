// DOM 요소
const proteinContainer = document.getElementById('protein-container');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const scoreDisplay = document.getElementById('score-display');
const exampleName = document.getElementById('example-name');
const tooltip = document.getElementById('tooltip');

// 예제 버튼들
const exampleBasic = document.getElementById('example-basic');
const exampleHelix = document.getElementById('example-helix');
const exampleSheet = document.getElementById('example-sheet');
const exampleGlobular = document.getElementById('example-globular');
const exampleEnzyme = document.getElementById('example-enzyme');
const exampleMembrane = document.getElementById('example-membrane');

// 탭 관련
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// 아미노산 데이터
let proteinBalls = [];
let connectors = [];
let score = 0;
let currentExample = 'basic';

// 3D 회전 관련 변수
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let rotationX = 0;
let rotationY = 0;
let zDistance = 0;

// 아미노산 유형
const aminoTypes = {
    H: { type: 'hydrophobic', color: '#e74c3c', label: 'H', fullName: '소수성 아미노산' },
    P: { type: 'hydrophilic', color: '#3498db', label: 'P', fullName: '친수성 아미노산' },
    S: { type: 'special', color: '#9b59b6', label: 'S', fullName: '특수 기능 아미노산' },
    C: { type: 'cysteine', color: '#f1c40f', label: 'C', fullName: '시스테인' },
    G: { type: 'glycine', color: '#2ecc71', label: 'G', fullName: '글리신' }
};

// 예제 단백질 패턴 정의
const proteinExamples = {
    basic: {
        name: '기본 단백질 구조',
        pattern: 'HPHPHPHPHP'
    },
    helix: {
        name: '알파 헬릭스 구조',
        pattern: 'HPHPSHPHPSHPHS'
    },
    sheet: {
        name: '베타 시트 구조',
        pattern: 'HPHPHSHPHPHPHS'
    },
    globular: {
        name: '글로불러 단백질',
        pattern: 'HPHPHPCPCSHSHPG'
    },
    enzyme: {
        name: '효소 구조',
        pattern: 'HPSPHGCPPSHSH'
    },
    membrane: {
        name: '막 단백질',
        pattern: 'HHHHPSPPHHHHSPPHHHHH'
    }
};

// 초기화 함수
function initProtein(example = 'basic') {
    currentExample = example;
    proteinContainer.innerHTML = '';
    proteinBalls = [];
    connectors = [];
    score = 0;
    updateScore(0);
    
    // 예제 이름 업데이트
    exampleName.textContent = proteinExamples[example].name;
    
    // 아미노산 패턴
    const pattern = proteinExamples[example].pattern;
    const ballCount = pattern.length;
    
    const containerWidth = proteinContainer.clientWidth;
    const containerHeight = proteinContainer.clientHeight;
    
    // 일자로 배열
    const startX = 100;
    const startY = containerHeight / 2;
    const spacing = Math.min((containerWidth - 200) / (ballCount - 1), 60);
    
    for (let i = 0; i < ballCount; i++) {
        // 아미노산 유형
        const aminoCode = pattern[i];
        const aminoType = aminoTypes[aminoCode];
        
        // 위치 계산
        const x = startX + i * spacing;
        const y = startY;
        
        // 아미노산 객체
        const ball = {
            id: i,
            x: x,
            y: y,
            type: aminoType.type,
            color: aminoType.color,
            label: aminoType.label,
            fullName: aminoType.fullName,
            code: aminoCode
        };
        
        proteinBalls.push(ball);
        
        // DOM 요소 생성
        const ballElement = document.createElement('div');
        ballElement.className = 'protein-ball';
        ballElement.id = `ball-${i}`;
        ballElement.style.left = `${x - 20}px`;
        ballElement.style.top = `${y - 20}px`;
        ballElement.style.backgroundColor = aminoType.color;
        ballElement.textContent = aminoType.label;
        ballElement.setAttribute('data-id', i);
        
        // 툴팁 이벤트
        ballElement.addEventListener('mouseover', function(e) {
            const ballId = parseInt(this.getAttribute('data-id'));
            const ball = proteinBalls[ballId];
            
            tooltip.style.display = 'block';
            tooltip.textContent = `${ball.fullName} (${ball.label})`;
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = `${rect.left}px`;
            tooltip.style.top = `${rect.top - 30}px`;
        });
        
        ballElement.addEventListener('mouseout', function() {
            tooltip.style.display = 'none';
        });
        
        proteinContainer.appendChild(ballElement);
        
        // 연결선 생성
        if (i > 0) {
            createConnector(i - 1, i);
        }
    }
    
    // 막 단백질 예제일 경우 세포막 표시
    if (example === 'membrane') {
        const membraneUpper = document.createElement('div');
        membraneUpper.className = 'membrane-line';
        membraneUpper.style.top = `${containerHeight/2 - 20}px`;
        
        const membraneLower = document.createElement('div');
        membraneLower.className = 'membrane-line';
        membraneLower.style.top = `${containerHeight/2 + 20}px`;
        
        proteinContainer.appendChild(membraneUpper);
        proteinContainer.appendChild(membraneLower);
    }
}

// 연결선 생성
function createConnector(fromIndex, toIndex) {
    const fromBall = proteinBalls[fromIndex];
    const toBall = proteinBalls[toIndex];
    
    // 거리와 각도 계산
    const dx = toBall.x - fromBall.x;
    const dy = toBall.y - fromBall.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // DOM 요소 생성
    const connector = document.createElement('div');
    connector.className = 'connector';
    connector.id = `connector-${fromIndex}-${toIndex}`;
    connector.style.width = `${distance}px`;
    connector.style.left = `${fromBall.x}px`;
    connector.style.top = `${fromBall.y}px`;
    connector.style.transform = `rotate(${angle}deg)`;
    
    // 아미노산 유형에 따라 연결선 색상 변경
    if (fromBall.type === 'cysteine' && toBall.type === 'cysteine') {
        // 황 결합 시 노란색 선
        connector.style.backgroundColor = '#f1c40f';
        connector.style.height = '3px';
    } else if (fromBall.type === 'special' || toBall.type === 'special') {
        // 특수 기능 아미노산 연결 시 보라색 선
        connector.style.backgroundColor = '#9b59b6';
        connector.style.height = '2px';
    } else if (fromBall.type === 'hydrophobic' && toBall.type === 'hydrophobic') {
        // 소수성 아미노산 간 연결 시 빨간색 선
        connector.style.backgroundColor = '#e74c3c';
        connector.style.opacity = '0.7';
    } else if (fromBall.type === 'hydrophilic' && toBall.type === 'hydrophilic') {
        // 친수성 아미노산 간 연결 시 파란색 선
        connector.style.backgroundColor = '#3498db';
        connector.style.opacity = '0.7';
    }
    
    proteinContainer.appendChild(connector);
    
    // 연결선 객체
    connectors.push({
        fromId: fromIndex,
        toId: toIndex,
        element: connector
    });
}

// 연결선 업데이트
function updateConnector(index) {
    const connector = connectors[index];
    const fromBall = proteinBalls[connector.fromId];
    const toBall = proteinBalls[connector.toId];
    
    // 거리와 각도 계산
    const dx = toBall.x - fromBall.x;
    const dy = toBall.y - fromBall.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // DOM 요소 업데이트
    connector.element.style.width = `${distance}px`;
    connector.element.style.left = `${fromBall.x}px`;
    connector.element.style.top = `${fromBall.y}px`;
    connector.element.style.transform = `rotate(${angle}deg)`;
}

// 아미노산 위치 업데이트
function updateBallPosition(ball, index) {
    const ballElement = document.getElementById(`ball-${index}`);
    ballElement.style.left = `${ball.x - 20}px`;
    ballElement.style.top = `${ball.y - 20}px`;
}

// 점수 업데이트
function updateScore(value) {
    score = Math.round(value);
    scoreDisplay.textContent = `점수: ${score}`;
    
    // 점수에 따라 색상 변경
    if (score > 80) {
        scoreDisplay.style.color = '#27ae60';
    } else if (score > 50) {
        scoreDisplay.style.color = '#f39c12';
    } else {
        scoreDisplay.style.color = '#e74c3c';
    }
}

// AlphaFold 시뮬레이션
function runAlphaFold() {
    startBtn.disabled = true;
    
    let step = 0;
    const totalSteps = 20;
    
    // 기존 연결선 제거 (1차 구조 외)
    connectors = connectors.filter(conn => {
        if (conn.type) {
            conn.element.remove();
            return false;
        }
        return true;
    });
    
    const simulation = setInterval(() => {
        step++;
        
        // 최적 구조 계산
        optimizeStructure(step / totalSteps);
        
        // 연결선 업데이트
        connectors.forEach((connector, index) => {
            updateConnector(index);
        });
        
        // 점수 계산
        calculateScore();
        
        // 시뮬레이션 완료
        if (step >= totalSteps) {
            clearInterval(simulation);
            startBtn.disabled = false;
            
            // 2차/3차 구조 연결선 추가
            createSecondaryConnections();
            
            // 3D 변환 스타일 업데이트
            updateCSS();
        }
    }, 150);
}

// 구조 최적화 (예제에 따라 다른 전략 사용)
function optimizeStructure(progress) {
    const containerWidth = proteinContainer.clientWidth;
    const containerHeight = proteinContainer.clientHeight;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    // 예제별 최적화 전략
    switch(currentExample) {
        case 'helix':
            optimizeHelix(progress, centerX, centerY);
            break;
        case 'sheet':
            optimizeSheet(progress, centerX, centerY);
            break;
        case 'globular':
            optimizeGlobular(progress, centerX, centerY);
            break;
        case 'enzyme':
            optimizeEnzyme(progress, centerX, centerY);
            break;
        case 'membrane':
            optimizeMembrane(progress, centerX, centerY);
            break;
        default:
            optimizeBasic(progress, centerX, centerY);
    }
    
    // 연결선 업데이트
    connectors.forEach((connector, index) => {
        updateConnector(index);
    });
}

// 기본 구조 최적화
function optimizeBasic(progress, centerX, centerY) {
    proteinBalls.forEach((ball, index) => {
        // 아미노산 유형에 따라 다른 위치
        if (ball.type === 'hydrophobic') {
            // 소수성: 중심에 가깝게
            const angle = index * 0.9;
            const radius = 100 - progress * 40;
            ball.x = centerX + Math.cos(angle) * radius;
            ball.y = centerY + Math.sin(angle) * radius;
        } else if (ball.type === 'hydrophilic') {
            // 친수성: 외부로
            const angle = index * 0.9;
            const radius = 80 + progress * 60;
            ball.x = centerX + Math.cos(angle) * radius;
            ball.y = centerY + Math.sin(angle) * radius;
        } else {
            // 특수: 중간
            const angle = index * 0.9;
            const radius = 120;
            ball.x = centerX + Math.cos(angle) * radius;
            ball.y = centerY + Math.sin(angle) * radius;
        }
        
        updateBallPosition(ball, index);
    });
}

// 알파 헬릭스 구조 최적화
function optimizeHelix(progress, centerX, centerY) {
    proteinBalls.forEach((ball, index) => {
        // 나선 구조 형성
        const angle = progress * 5 + index * 1.8;
        const heightStep = progress * 20;
        const radius = 80;
        
        ball.x = centerX + Math.cos(angle) * radius;
        ball.y = centerY + Math.sin(angle) * radius - (index * heightStep - 100);
        
        updateBallPosition(ball, index);
    });
}

// 베타 시트 구조 최적화
function optimizeSheet(progress, centerX, centerY) {
    const sheetWidth = 300 * progress;
    const rows = 2;
    const ballsPerRow = Math.ceil(proteinBalls.length / rows);
    
    proteinBalls.forEach((ball, index) => {
        const row = Math.floor(index / ballsPerRow);
        const col = index % ballsPerRow;
        
        // 지그재그 패턴
        if (row % 2 === 0) {
            ball.x = centerX - sheetWidth/2 + col * (sheetWidth / (ballsPerRow - 1));
        } else {
            ball.x = centerX + sheetWidth/2 - col * (sheetWidth / (ballsPerRow - 1));
        }
        
        ball.y = centerY - 50 + row * 100;
        
        updateBallPosition(ball, index);
    });
}

// 글로불러 단백질 구조 최적화
function optimizeGlobular(progress, centerX, centerY) {
    proteinBalls.forEach((ball, index) => {
        // 공 모양 형성
        let radius, angle1, angle2;
        
        // 아미노산 특성에 따라 다른 반지름
        if (ball.type === 'hydrophobic') {
            radius = 50 + Math.random() * 30 * (1 - progress);
        } else if (ball.type === 'cysteine') {
            radius = 80 + Math.random() * 20 * (1 - progress);
        } else {
            radius = 120 + Math.random() * 40 * (1 - progress);
        }
        
        // 3D 구 표면의 점 계산
        angle1 = index * 0.7 * progress + Math.PI;
        angle2 = index * 0.5 + Math.PI/2;
        
        ball.x = centerX + Math.sin(angle1) * Math.cos(angle2) * radius;
        ball.y = centerY + Math.sin(angle1) * Math.sin(angle2) * radius;
        
        updateBallPosition(ball, index);
    });
}

// 효소 구조 최적화
    // 효소 구조 최적화
function optimizeEnzyme(progress, centerX, centerY) {
    // 활성 사이트 위치
    const activeX = centerX;
    const activeY = centerY;
    
    proteinBalls.forEach((ball, index) => {
        // 특수 아미노산은 활성 사이트 중심에 위치
        if (ball.type === 'special') {
            const angle = index * 1.2;
            const radius = 40 * progress;
            ball.x = activeX + Math.cos(angle) * radius;
            ball.y = activeY + Math.sin(angle) * radius;
        } 
        // 시스테인은 구조 안정화를 위해 특정 위치에
        else if (ball.type === 'cysteine') {
            const angle = index * 2 + Math.PI;
            const radius = 80 * progress;
            ball.x = activeX + Math.cos(angle) * radius;
            ball.y = activeY + Math.sin(angle) * radius;
        }
        // 소수성은 내부에
        else if (ball.type === 'hydrophobic') {
            const angle = index * 0.8 + Math.PI/2;
            const radius = 100 * progress;
            ball.x = activeX + Math.cos(angle) * radius;
            ball.y = activeY + Math.sin(angle) * radius;
        }
        // 나머지는 바깥쪽에
        else {
            const angle = index * 0.5;
            const radius = 140 * progress;
            ball.x = activeX + Math.cos(angle) * radius;
            ball.y = activeY + Math.sin(angle) * radius;
        }
        
        updateBallPosition(ball, index);
    });
}

// 막 단백질 구조 최적화
function optimizeMembrane(progress, centerX, centerY) {
    // 가상의 세포막 위치
    const membraneY = proteinContainer.clientHeight / 2;
    const membraneThickness = 40;
    
    proteinBalls.forEach((ball, index) => {
        // 소수성은 막 내부에
        if (ball.type === 'hydrophobic') {
            const span = proteinBalls.length;
            const position = index / span;
            const xOffset = (position - 0.5) * 300 * progress;
            
            ball.x = centerX + xOffset;
            ball.y = membraneY + (Math.random() - 0.5) * membraneThickness * progress;
        }
        // 친수성은 막 바깥에
        else if (ball.type === 'hydrophilic') {
            const span = proteinBalls.length;
            const position = index / span;
            const xOffset = (position - 0.5) * 280 * progress;
            const direction = index % 2 === 0 ? -1 : 1; // 위 또는 아래로 배치
            
            ball.x = centerX + xOffset;
            ball.y = membraneY + direction * (membraneThickness + 30 * progress);
        }
        // 특수 기능은 막 경계에
        else if (ball.type === 'special') {
            const span = proteinBalls.length;
            const position = index / span;
            const xOffset = (position - 0.5) * 260 * progress;
            const direction = index % 2 === 0 ? -1 : 1; // 위 또는 아래로 배치
            
            ball.x = centerX + xOffset;
            ball.y = membraneY + direction * membraneThickness * 0.9;
        }
        // 나머지 유형
        else {
            const span = proteinBalls.length;
            const position = index / span;
            const xOffset = (position - 0.5) * 320 * progress;
            const angle = index * 0.5;
            
            ball.x = centerX + xOffset;
            ball.y = membraneY + Math.sin(angle) * 50 * progress;
        }
        
        updateBallPosition(ball, index);
    });
}

// 점수 계산 함수
function calculateScore() {
    let totalScore = 0;
    const ballCount = proteinBalls.length;
    
    // 예제별 점수 계산 전략
    switch(currentExample) {
        case 'helix':
            totalScore = calculateHelixScore();
            break;
        case 'sheet':
            totalScore = calculateSheetScore();
            break;
        case 'globular':
            totalScore = calculateGlobularScore();
            break;
        case 'enzyme':
            totalScore = calculateEnzymeScore();
            break;
        case 'membrane':
            totalScore = calculateMembraneScore();
            break;
        default:
            totalScore = calculateBasicScore();
    }
    
    updateScore(totalScore);
}

// 기본 구조 점수 계산
function calculateBasicScore() {
    let score = 0;
    const centerX = proteinContainer.clientWidth / 2;
    const centerY = proteinContainer.clientHeight / 2;
    
    proteinBalls.forEach((ball) => {
        // 소수성은 중심에 가까울수록 점수 높음
        if (ball.type === 'hydrophobic') {
            const distance = Math.sqrt(Math.pow(ball.x - centerX, 2) + Math.pow(ball.y - centerY, 2));
            score += Math.max(0, 100 - distance * 0.5);
        }
        // 친수성은 외부에 있을수록 점수 높음
        else if (ball.type === 'hydrophilic') {
            const distance = Math.sqrt(Math.pow(ball.x - centerX, 2) + Math.pow(ball.y - centerY, 2));
            score += Math.min(100, distance * 0.5);
        }
    });
    
    return score / proteinBalls.length;
}

// 알파 헬릭스 점수 계산
function calculateHelixScore() {
    let score = 0;
    const centerX = proteinContainer.clientWidth / 2;
    const expectedAngle = 1.8; // 이상적인 헬릭스 각도
    
    for (let i = 1; i < proteinBalls.length; i++) {
        const prev = proteinBalls[i-1];
        const curr = proteinBalls[i];
        
        // 헬릭스 형상 점수 (반지름이 일정해야 함)
        const prevRadius = Math.sqrt(Math.pow(prev.x - centerX, 2) + Math.pow(prev.y - centerX, 2));
        const currRadius = Math.sqrt(Math.pow(curr.x - centerX, 2) + Math.pow(curr.y - centerX, 2));
        const radiusDiff = Math.abs(prevRadius - currRadius);
        
        score += Math.max(0, 100 - radiusDiff * 5);
        
        // 각도 점수
        if (i > 1) {
            const prevPrev = proteinBalls[i-2];
            const angle1 = Math.atan2(prev.y - prevPrev.y, prev.x - prevPrev.x);
            const angle2 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
            const angleDiff = Math.abs(angle2 - angle1);
            
            score += Math.max(0, 100 - Math.abs(angleDiff - expectedAngle) * 50);
        }
    }
    
    return score / (proteinBalls.length * 2 - 2);
}

// 베타 시트 점수 계산
function calculateSheetScore() {
    let score = 0;
    const rows = 2;
    const ballsPerRow = Math.ceil(proteinBalls.length / rows);
    
    // 각 행에 대해 직선 형태 점수
    for (let row = 0; row < rows; row++) {
        const startIdx = row * ballsPerRow;
        const endIdx = Math.min((row + 1) * ballsPerRow, proteinBalls.length);
        
        if (endIdx - startIdx < 2) continue;
        
        // 모든 볼이 같은 y 좌표를 가지는지 확인
        const avgY = proteinBalls.slice(startIdx, endIdx).reduce((sum, ball) => sum + ball.y, 0) / (endIdx - startIdx);
        
        for (let i = startIdx; i < endIdx; i++) {
            const yDiff = Math.abs(proteinBalls[i].y - avgY);
            score += Math.max(0, 100 - yDiff * 10);
        }
        
        // 균등한 간격 점수
        const xPositions = [];
        for (let i = startIdx; i < endIdx; i++) {
            xPositions.push(proteinBalls[i].x);
        }
        xPositions.sort((a, b) => a - b);
        
        const idealSpacing = (xPositions[xPositions.length - 1] - xPositions[0]) / (xPositions.length - 1);
        let spacingScore = 0;
        
        for (let i = 1; i < xPositions.length; i++) {
            const spacing = xPositions[i] - xPositions[i-1];
            spacingScore += Math.max(0, 100 - Math.abs(spacing - idealSpacing) * 2);
        }
        
        score += spacingScore / (xPositions.length - 1);
    }
    
    return score / (rows * 2);
}

// 글로불러 단백질 점수 계산
function calculateGlobularScore() {
    let score = 0;
    const centerX = proteinContainer.clientWidth / 2;
    const centerY = proteinContainer.clientHeight / 2;
    
    // 소수성 아미노산은 내부에 있어야 함
    const hydrophobicBalls = proteinBalls.filter(ball => ball.type === 'hydrophobic');
    const otherBalls = proteinBalls.filter(ball => ball.type !== 'hydrophobic');
    
    // 소수성 아미노산의 평균 중심 거리
    const avgHydrophobicDist = hydrophobicBalls.reduce((sum, ball) => {
        return sum + Math.sqrt(Math.pow(ball.x - centerX, 2) + Math.pow(ball.y - centerY, 2));
    }, 0) / Math.max(1, hydrophobicBalls.length);
    
    // 다른 아미노산의 평균 중심 거리
    const avgOtherDist = otherBalls.reduce((sum, ball) => {
        return sum + Math.sqrt(Math.pow(ball.x - centerX, 2) + Math.pow(ball.y - centerY, 2));
    }, 0) / Math.max(1, otherBalls.length);
    
    // 내부-외부 구조 점수
    if (avgHydrophobicDist < avgOtherDist) {
        score += 100;
    } else {
        score += Math.max(0, 100 - (avgHydrophobicDist - avgOtherDist) * 2);
    }
    
    // 글로불러 형태 (구 모양) 점수
    const avgRadius = proteinBalls.reduce((sum, ball) => {
        return sum + Math.sqrt(Math.pow(ball.x - centerX, 2) + Math.pow(ball.y - centerY, 2));
    }, 0) / proteinBalls.length;
    
    const radiusVariation = proteinBalls.reduce((sum, ball) => {
        const distance = Math.sqrt(Math.pow(ball.x - centerX, 2) + Math.pow(ball.y - centerY, 2));
        return sum + Math.pow(distance - avgRadius, 2);
    }, 0) / proteinBalls.length;
    
    score += Math.max(0, 100 - Math.sqrt(radiusVariation) * 0.5);
    
    return score / 2;
}

// 효소 구조 점수 계산
function calculateEnzymeScore() {
    let score = 0;
    const centerX = proteinContainer.clientWidth / 2;
    const centerY = proteinContainer.clientHeight / 2;
    
    // 특수 아미노산은 활성 사이트(중심)에 가까워야 함
    const specialBalls = proteinBalls.filter(ball => ball.type === 'special');
    
    // 특수 아미노산의 평균 중심 거리
    const avgSpecialDist = specialBalls.reduce((sum, ball) => {
        return sum + Math.sqrt(Math.pow(ball.x - centerX, 2) + Math.pow(ball.y - centerY, 2));
    }, 0) / Math.max(1, specialBalls.length);
    
    score += Math.max(0, 100 - avgSpecialDist * 0.8);
    
    // 글리신은 구조적 유연성을 위해 굽은 부분에 위치해야 함
    const glycineBalls = proteinBalls.filter(ball => ball.type === 'glycine');
    let glycineScore = 0;
    
    glycineBalls.forEach(ball => {
        const ballIndex = proteinBalls.findIndex(b => b.id === ball.id);
        
        // 인접한 세 아미노산으로 각도 계산
        if (ballIndex > 0 && ballIndex < proteinBalls.length - 1) {
            const prev = proteinBalls[ballIndex - 1];
            const next = proteinBalls[ballIndex + 1];
            
            // 각도 계산 (0-180도)
            const angle1 = Math.atan2(ball.y - prev.y, ball.x - prev.x);
            const angle2 = Math.atan2(next.y - ball.y, next.x - ball.x);
            const angleDiff = Math.abs(angle1 - angle2) * 180 / Math.PI;
            
            // 각도가 클수록 더 휘어짐 (높은 점수)
            glycineScore += Math.min(100, angleDiff * 0.5);
        }
    });
    
    if (glycineBalls.length > 0) {
        score += glycineScore / glycineBalls.length;
    }
    
    // 시스테인 결합 점수
    const cysteineBalls = proteinBalls.filter(ball => ball.type === 'cysteine');
    if (cysteineBalls.length >= 2) {
        // 가장 가까운 두 시스테인 간의 거리
        let minDistance = Infinity;
        
        for (let i = 0; i < cysteineBalls.length; i++) {
            for (let j = i + 1; j < cysteineBalls.length; j++) {
                const c1 = cysteineBalls[i];
                const c2 = cysteineBalls[j];
                const distance = Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
                
                minDistance = Math.min(minDistance, distance);
            }
        }
        
        // 적절한 거리에 있을 때 높은 점수
        const optimalDistance = 50; // 황 결합에 적합한 거리
        score += Math.max(0, 100 - Math.abs(minDistance - optimalDistance) * 2);
    }
    
    return score / 3; // 세 가지 평가 기준의 평균
}

// 막 단백질 점수 계산
function calculateMembraneScore() {
    let score = 0;
    const membraneY = proteinContainer.clientHeight / 2;
    const membraneThickness = 40;
    
    // 소수성 아미노산은 막 내에 있어야 함
    const hydrophobicBalls = proteinBalls.filter(ball => ball.type === 'hydrophobic');
    let hydrophobicScore = 0;
    
    hydrophobicBalls.forEach(ball => {
        const distFromMembrane = Math.abs(ball.y - membraneY);
        if (distFromMembrane <= membraneThickness / 2) {
            hydrophobicScore += 100; // 막 내부에 있으면 만점
        } else {
            hydrophobicScore += Math.max(0, 100 - (distFromMembrane - membraneThickness / 2) * 5);
        }
    });
    
    if (hydrophobicBalls.length > 0) {
        score += hydrophobicScore / hydrophobicBalls.length;
    }
    
    // 친수성 아미노산은 막 외부에 있어야 함
    const hydrophilicBalls = proteinBalls.filter(ball => ball.type === 'hydrophilic');
    let hydrophilicScore = 0;
    
    hydrophilicBalls.forEach(ball => {
        const distFromMembrane = Math.abs(ball.y - membraneY);
        if (distFromMembrane > membraneThickness / 2) {
            hydrophilicScore += 100; // 막 외부에 있으면 만점
        } else {
            hydrophilicScore += Math.max(0, 100 - (membraneThickness / 2 - distFromMembrane) * 5);
        }
    });
    
    if (hydrophilicBalls.length > 0) {
        score += hydrophilicScore / hydrophilicBalls.length;
    }
    
    return score / 2; // 두 가지 평가 기준의 평균
}

// 3D 회전 적용 함수
function apply3DTransform() {
    proteinBalls.forEach((ball, index) => {
        const ballElement = document.getElementById(`ball-${index}`);
        if (ballElement) {
            // 3D 회전 효과 적용
            ballElement.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) translateZ(${zDistance}px)`;
        }
    });
    
    // 연결선에도 같은 3D 효과 적용
    connectors.forEach((connector) => {
        connector.element.style.transform += ` rotateX(${rotationX}deg) rotateY(${rotationY}deg) translateZ(${zDistance}px)`;
    });
}

// 드래그 이벤트 설정
function setup3DControls() {
    proteinContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // 마우스 이동에 따른 회전 계산
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        
        rotationY += deltaX * 0.5; // X축 이동은 Y축 기준 회전
        rotationX += deltaY * 0.5; // Y축 이동은 X축 기준 회전
        
        apply3DTransform();
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // 휠 이벤트로 줌인/줌아웃
    proteinContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        zDistance += e.deltaY * 0.1;
        apply3DTransform();
    });
}

// CSS 업데이트 - 3D 변환 지원 추가
function updateCSS() {
    // game-area에 3D 효과를 위한 CSS 추가
    proteinContainer.style.perspective = '1000px';
    proteinContainer.style.transformStyle = 'preserve-3d';
    
    // 단백질 볼에 3D 변환 스타일 추가
    proteinBalls.forEach((ball, index) => {
        const ballElement = document.getElementById(`ball-${index}`);
        if (ballElement) {
            ballElement.style.transformStyle = 'preserve-3d';
            ballElement.style.transition = 'transform 0.1s';
        }
    });
    
    // 연결선에 3D 변환 스타일 추가
    connectors.forEach((connector) => {
        connector.element.style.transformStyle = 'preserve-3d';
        connector.element.style.transition = 'transform 0.1s';
    });
}

// 추가적인 연결선 만들기 (2차/3차 구조 연결)
function createSecondaryConnections() {
    // 기존 연결선은 유지하되, 추가 연결선 생성
    
    // 예제별 특수 연결선 추가
    switch(currentExample) {
        case 'helix':
            // 알파 헬릭스: 수소 결합 표현 (i와 i+4 위치의 아미노산 연결)
            for (let i = 0; i < proteinBalls.length - 4; i++) {
                createHelixHydrogenBond(i, i + 4);
            }
            break;
            
        case 'sheet':
            // 베타 시트: 시트 내 수소 결합 표현
            const rows = 2;
            const ballsPerRow = Math.ceil(proteinBalls.length / rows);
            
            // 상단 행과 하단 행 사이의 연결선 (수소 결합)
            for (let i = 0; i < ballsPerRow && i + ballsPerRow < proteinBalls.length; i++) {
                createSheetHydrogenBond(i, i + ballsPerRow);
            }
            break;
            
        case 'globular':
        case 'enzyme':
            // 시스테인 간 황 결합 찾기
            const cysteineBalls = proteinBalls.filter(ball => ball.type === 'cysteine');
            
            // 모든 시스테인 쌍 검사
            for (let i = 0; i < cysteineBalls.length; i++) {
                for (let j = i + 1; j < cysteineBalls.length; j++) {
                    const c1Index = proteinBalls.findIndex(ball => ball.id === cysteineBalls[i].id);
                    const c2Index = proteinBalls.findIndex(ball => ball.id === cysteineBalls[j].id);
                    
                    // 거리 계산
                    const c1 = cysteineBalls[i];
                    const c2 = cysteineBalls[j];
                    const distance = Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
                    
                    // 적절한 거리에 있으면 황 결합 생성
                    if (distance < 100) {
                        createSulfurBond(c1Index, c2Index);
                    }
                }
            }
            break;
            
        case 'membrane':
            // 막 단백질: 소수성 영역과 친수성 영역 사이 경계 연결
            const hydrophobicIndices = proteinBalls
                .map((ball, idx) => ball.type === 'hydrophobic' ? idx : -1)
                .filter(idx => idx !== -1);
                
            const hydrophilicIndices = proteinBalls
                .map((ball, idx) => ball.type === 'hydrophilic' ? idx : -1)
                .filter(idx => idx !== -1);
            
            // 가장 가까운 소수성-친수성 쌍 연결
            for (const hIdx of hydrophobicIndices) {
                let closestHPIdx = -1;
                let minDistance = Infinity;
                
                for (const hpIdx of hydrophilicIndices) {
                    const h = proteinBalls[hIdx];
                    const hp = proteinBalls[hpIdx];
                    const distance = Math.sqrt(Math.pow(h.x - hp.x, 2) + Math.pow(h.y - hp.y, 2));
                    
                    if (distance < minDistance && distance < 150) {
                        minDistance = distance;
                        closestHPIdx = hpIdx;
                    }
                }
                
                if (closestHPIdx !== -1) {
                    createMembraneConnection(hIdx, closestHPIdx);
                }
            }
            break;
    }
}

// 알파 헬릭스의 수소 결합 생성
function createHelixHydrogenBond(fromIndex, toIndex) {
    const connector = document.createElement('div');
    connector.className = 'hydrogen-bond';
    connector.id = `h-bond-${fromIndex}-${toIndex}`;
    
    const fromBall = proteinBalls[fromIndex];
    const toBall = proteinBalls[toIndex];
    
    // 거리와 각도 계산
    const dx = toBall.x - fromBall.x;
    const dy = toBall.y - fromBall.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    connector.style.width = `${distance}px`;
    connector.style.left = `${fromBall.x}px`;
    connector.style.top = `${fromBall.y}px`;
    connector.style.transform = `rotate(${angle}deg)`;
    connector.style.position = 'absolute';
    connector.style.height = '1px';
    connector.style.backgroundColor = '#27ae60';
    connector.style.zIndex = '-1';
    connector.style.opacity = '0.6';
    connector.style.border = '1px dashed #27ae60';
    
    proteinContainer.appendChild(connector);
    
    // 수소 결합 객체
    connectors.push({
        fromId: fromIndex,
        toId: toIndex,
        element: connector,
        type: 'hydrogen'
    });
}

// 베타 시트의 수소 결합 생성
function createSheetHydrogenBond(fromIndex, toIndex) {
    const connector = document.createElement('div');
    connector.className = 'hydrogen-bond';
    connector.id = `h-bond-${fromIndex}-${toIndex}`;
    
    const fromBall = proteinBalls[fromIndex];
    const toBall = proteinBalls[toIndex];
    
    // 거리와 각도 계산
    const dx = toBall.x - fromBall.x;
    const dy = toBall.y - fromBall.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    connector.style.width = `${distance}px`;
    connector.style.left = `${fromBall.x}px`;
    connector.style.top = `${fromBall.y}px`;
    connector.style.transform = `rotate(${angle}deg)`;
    connector.style.position = 'absolute';
    connector.style.height = '1px';
    connector.style.backgroundColor = '#3498db';
    connector.style.zIndex = '-1';
    connector.style.opacity = '0.6';
    connector.style.border = '1px dashed #3498db';
    
    proteinContainer.appendChild(connector);
    
    // 수소 결합 객체
    connectors.push({
        fromId: fromIndex,
        toId: toIndex,
        element: connector,
        type: 'sheet-hydrogen'
    });
}

// 시스테인 간 황 결합 생성
function createSulfurBond(fromIndex, toIndex) {
    const connector = document.createElement('div');
    connector.className = 'sulfur-bond';
    connector.id = `s-bond-${fromIndex}-${toIndex}`;
    
    const fromBall = proteinBalls[fromIndex];
    const toBall = proteinBalls[toIndex];
    
    // 거리와 각도 계산
    const dx = toBall.x - fromBall.x;
    const dy = toBall.y - fromBall.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    connector.style.width = `${distance}px`;
    connector.style.left = `${fromBall.x}px`;
    connector.style.top = `${fromBall.y}px`;
    connector.style.transform = `rotate(${angle}deg)`;
    connector.style.position = 'absolute';
    connector.style.height = '3px';
    connector.style.backgroundColor = '#f1c40f';
    connector.style.zIndex = '-1';
    connector.style.opacity = '0.8';
    
    proteinContainer.appendChild(connector);
    
    // 황 결합 객체
    connectors.push({
        fromId: fromIndex,
        toId: toIndex,
        element: connector,
        type: 'sulfur'
    });
}

    // 막 단백질의 소수성-친수성 영역 연결
function createMembraneConnection(fromIndex, toIndex) {
    const connector = document.createElement('div');
    connector.className = 'membrane-connection';
    connector.id = `mem-conn-${fromIndex}-${toIndex}`;
    
    const fromBall = proteinBalls[fromIndex];
    const toBall = proteinBalls[toIndex];
    
    // 거리와 각도 계산
    const dx = toBall.x - fromBall.x;
    const dy = toBall.y - fromBall.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    connector.style.width = `${distance}px`;
    connector.style.left = `${fromBall.x}px`;
    connector.style.top = `${fromBall.y}px`;
    connector.style.transform = `rotate(${angle}deg)`;
    connector.style.position = 'absolute';
    connector.style.height = '2px';
    connector.style.background = 'linear-gradient(90deg, #e74c3c, #3498db)';
    connector.style.zIndex = '-1';
    connector.style.opacity = '0.6';
    
    proteinContainer.appendChild(connector);
    
    // 막 연결 객체
    connectors.push({
        fromId: fromIndex,
        toId: toIndex,
        element: connector,
        type: 'membrane'
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // AlphaFold 실행 버튼
    startBtn.addEventListener('click', runAlphaFold);
    
    // 초기화 버튼
    resetBtn.addEventListener('click', () => {
        initProtein(currentExample);
    });
    
    // 예제 버튼들
    exampleBasic.addEventListener('click', () => {
        initProtein('basic');
    });
    
    exampleHelix.addEventListener('click', () => {
        initProtein('helix');
    });
    
    exampleSheet.addEventListener('click', () => {
        initProtein('sheet');
    });
    
    exampleGlobular.addEventListener('click', () => {
        initProtein('globular');
    });
    
    exampleEnzyme.addEventListener('click', () => {
        initProtein('enzyme');
    });
    
    exampleMembrane.addEventListener('click', () => {
        initProtein('membrane');
    });
    
    // 탭 전환
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // 활성 탭 변경
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 탭 콘텐츠 표시/숨김
            document.getElementById('info-tab').style.display = tabName === 'info' ? 'block' : 'none';
            document.getElementById('alphafold-tab').style.display = tabName === 'alphafold' ? 'block' : 'none';
        });
    });
}

// 초기화 및 이벤트 리스너 설정
function init() {
    setupEventListeners();
    setup3DControls(); // 3D 제어 설정 추가
    initProtein('basic');
}

// 페이지 로드 시 초기화
window.addEventListener('load', init);