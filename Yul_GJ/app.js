/* ==========================================================================
   신라 타임머신 경주여행 - 애플리케이션 로직 (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 상태 변수 및 요소 선택
    let missionsData = [];
    let completedMissions = JSON.parse(localStorage.getItem('yul_gj_completed_missions')) || [];
    let activeCategory = '전체';

    // UI 요소
    const lockedGrid = document.getElementById('lockedGrid');
    const unlockedGrid = document.getElementById('unlockedGrid');
    const lockedCount = document.getElementById('lockedCount');
    const unlockedCount = document.getElementById('unlockedCount');
    const currentScore = document.getElementById('currentScore');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const agentStatus = document.getElementById('agentStatus');
    const categoryTabs = document.getElementById('categoryTabs');
    const appContainer = document.querySelector('.app-container');

    // 모달 요소
    const missionModal = document.getElementById('missionModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalCategory = document.getElementById('modalCategory');
    const modalTitle = document.getElementById('modalTitle');
    const modalImage = document.getElementById('modalImage');
    const modalMysteryOverlay = document.getElementById('modalMysteryOverlay');
    const modalDescription = document.getElementById('modalDescription');
    const missionActionArea = document.getElementById('missionActionArea');

    // 설정 모달 요소
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
    const resetAppBtn = document.getElementById('resetAppBtn');
    const completeAllBtn = document.getElementById('completeAllBtn');

    // 연출 요소
    const stampOverlayEffect = document.getElementById('stampOverlayEffect');
    const soundStamp = document.getElementById('soundStamp');
    const soundSuccess = document.getElementById('soundSuccess');

    // 2. Fallback 미션 데이터 (CORS나 파일 로드 실패 대비)
    const fallbackMissions = [
        {
            "category": "국립경주박물관",
            "missions": [
                {
                    "id": "m1_1",
                    "title": "성덕대왕신종 (에밀레종)",
                    "type": "quiz",
                    "description": "종 아래 땅을 파고 묻어놓은 커다란 항아리 모양(음통)을 찾아보세요. 이 항아리는 종소리를 더 멀리 울리게 할까요, 아니면 소리를 나지 않게 막을까요?",
                    "answer": "더 멀리 울리게",
                    "point": 100,
                    "image_url": "images/bell.jpg"
                },
                {
                    "id": "m1_2",
                    "title": "얼굴무늬 수막새",
                    "type": "action",
                    "description": "신라의 미소라고 불리는 기와입니다. 얼굴무늬 수막새 바로 앞에서 수막새와 똑같이 온화한 미소를 지으며 인증샷 찍기!",
                    "answer": "인증샷 촬영 완료",
                    "point": 100,
                    "image_url": "images/smile_giwa.jpg"
                },
                {
                    "id": "m1_3",
                    "title": "금관총 금관",
                    "type": "discovery",
                    "description": "박물관 안에서 가장 반짝반짝 빛나는 신라 왕의 황금 왕관을 찾아 도감을 터치하세요!",
                    "answer": "황금 왕관 발견 완료",
                    "point": 100,
                    "image_url": "gold_crown.jpg"
                },
                {
                    "id": "m1_4",
                    "title": "성덕대왕신종의 비밀 소리",
                    "type": "quiz",
                    "description": "성덕대왕신종은 소리가 깊고 은은하며 아주 길게 이어지는 것으로 유명해요. 단지 크고 무겁기 때문이 아니라, 종의 형태가 미세하게 '이것'이어서 신비로운 소리가 반복해서 나는 것이랍니다. 종의 양쪽 모양이 똑같지 않고 살짝 다른 것을 무엇이라고 할까요? (힌트: ㅂㄷㅊ)",
                    "answer": "비대칭",
                    "point": 100,
                    "image_url": "성덕대왕신종.jpg"
                },
                {
                    "id": "m1_5",
                    "title": "흙으로 만든 인형, 토우장식항아리",
                    "type": "quiz",
                    "description": "신라의 대표적 유물인 이 항아리에는 흙으로 빚은 여러 인형(토우)들이 붙어 있어요. 항아리 몸통에 개구리의 뒷다리를 입에 앙 물고 있는 다리 없는 기다란 동물 인형은 무엇일까요?",
                    "answer": "뱀",
                    "point": 100,
                    "image_url": "토우장식항아리.jpg"
                },
                {
                    "id": "m1_6",
                    "title": "황남대총 북분 금관",
                    "type": "quiz",
                    "description": "이 멋진 신라 금관을 자세히 보면, 머리띠 위에 서 있는 나뭇가지 모양 3개와 또 다른 동물의 뿔 모양 2개가 세워져 있어요. 신라 사람들이 신성하게 여겨 머리관에 멋진 뿔을 장식했던 이 동물의 이름은 무엇일까요? (힌트: ㅅㅅ)",
                    "answer": "사슴",
                    "point": 100,
                    "image_url": "황남대총 북분 금관.jpg"
                }
            ]
        },
        {
            "category": "첨성대",
            "missions": [
                {
                    "id": "m2_1",
                    "title": "첨성대 몸통",
                    "type": "action",
                    "description": "동양에서 가장 오래된 천문대인 첨성대 앞에서, 온몸으로 첨성대 모양(V자를 거꾸로 뒤집은 모양) 포즈를 잡고 멋지게 사진 찍기!",
                    "answer": "첨성대 포즈 촬영 완료",
                    "point": 100,
                    "image_url": "images/cheomseongdae.jpg"
                },
                {
                    "id": "m2_2",
                    "title": "꼭대기 우물 정(井)자",
                    "type": "quiz",
                    "description": "첨성대 꼭대기를 자세히 보면 돌이 '#' 모양으로 쌓여 있어요. 한자로는 우물을 뜻하는 이 글자의 이름은 무엇일까요?",
                    "answer": "우물 정",
                    "point": 100,
                    "image_url": "images/top_stone.jpg"
                }
            ]
        },
        {
            "category": "동궁과 월지",
            "missions": [
                {
                    "id": "m3_1",
                    "title": "야경 비치는 연못",
                    "type": "discovery",
                    "description": "까만 밤하늘과 화려한 궁궐이 거울처럼 똑같이 비치는 아름다운 연못을 찾아 도감을 완성하세요!",
                    "answer": "야경 연못 발견 완료",
                    "point": 100,
                    "image_url": "images/pond_night.jpg"
                },
                {
                    "id": "m3_2",
                    "title": "신라의 주사위, 주령구",
                    "type": "quiz",
                    "description": "신라 귀족들이 놀던 주사위입니다. 일반 주사위는 6면이지만, 이 주령구는 총 몇 개의 면으로 이루어져 있을까요? 현장 안내판에서 숫자를 찾아보세요!",
                    "answer": "14면",
                    "point": 100,
                    "image_url": "images/dice.jpg"
                }
            ]
        },
        {
            "category": "라한셀렉트 경주",
            "missions": [
                {
                    "id": "m4_1",
                    "title": "보문호수 뷰",
                    "type": "action",
                    "description": "라한셀렉트 숙소 또는 테라스에서 탁 트인 보문호수를 배경으로 멋진 기념사진 남기기!",
                    "answer": "보문호수 인증샷 촬영 완료",
                    "point": 100,
                    "image_url": "images/lake_view.jpg"
                },
                {
                    "id": "m4_2",
                    "title": "경주산책 (북카페)",
                    "type": "discovery",
                    "description": "라한셀렉트 내에 있는 북카페 '경주산책'에 방문하여 마음에 드는 공간을 발견하고 타임머신 임무를 공식 종료합니다.",
                    "answer": "경주산책 방문 완료",
                    "point": 100,
                    "image_url": "images/book_cafe.jpg"
                }
            ]
        }
    ];

    // 3. 미션 데이터 초기 로드
    async function loadMissions() {
        try {
            const response = await fetch('missions.json');
            if (!response.ok) throw new Error('네트워크 응답 오류');
            missionsData = await response.json();
        } catch (error) {
            console.warn('JSON 파일 로드 실패. Fallback 데이터를 활용합니다.', error);
            missionsData = fallbackMissions;
        }
        initApp();
    }

    // 4. 앱 초기 실행 및 탭 생성
    function initApp() {
        renderTabs();
        updateDashboard();
        renderGrids();
        createStarsBackground();
    }

    // 카테고리 탭 렌더링
    function renderTabs() {
        categoryTabs.innerHTML = '';
        
        // '전체' 탭 추가
        const allTab = document.createElement('button');
        allTab.className = `tab-btn ${activeCategory === '전체' ? 'active' : ''}`;
        allTab.textContent = '🗺️ 전체';
        allTab.addEventListener('click', () => selectCategory('전체'));
        categoryTabs.appendChild(allTab);

        // 카테고리별 탭 생성
        missionsData.forEach(cat => {
            const tab = document.createElement('button');
            tab.className = `tab-btn ${activeCategory === cat.category ? 'active' : ''}`;
            
            // 이모지 부착
            let emoji = '📍';
            if (cat.category.includes('박물관')) emoji = '🏛️';
            else if (cat.category.includes('첨성대')) emoji = '🔭';
            else if (cat.category.includes('동궁')) emoji = '🌙';
            else if (cat.category.includes('라한')) emoji = '🏨';

            tab.textContent = `${emoji} ${cat.category}`;
            tab.addEventListener('click', () => selectCategory(cat.category));
            categoryTabs.appendChild(tab);
        });
    }

    function selectCategory(catName) {
        activeCategory = catName;
        // 탭 활성화 클래스 처리
        const tabs = categoryTabs.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            if (tab.textContent.includes(catName)) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        renderGrids();
    }

    // 5. 대시보드 상태 갱신
    function updateDashboard() {
        let totalMissions = 0;
        let completedCount = 0;
        let score = 0;

        missionsData.forEach(cat => {
            cat.missions.forEach(mission => {
                totalMissions++;
                if (completedMissions.some(m => m.id === mission.id)) {
                    completedCount++;
                    score += mission.point;
                }
            });
        });

        // 점수 및 게이지 바
        currentScore.innerHTML = `${score} <span class="gp-unit">GP</span>`;
        const percentage = totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${completedCount} / ${totalMissions} 미션 완료`;

        // 등급 및 문구 갱신
        let status = '신라 타임머신 가동 중...';
        if (completedCount === 0) {
            status = '⏱️ 신라 역사 탐험을 시작하세요!';
        } else if (completedCount < totalMissions * 0.4) {
            status = '🧭 율이 요원, 임무 수행을 환영합니다!';
        } else if (completedCount < totalMissions * 0.8) {
            status = '⚡ 시간의 에너지가 차오르고 있습니다!';
        } else if (completedCount < totalMissions) {
            status = '👑 역사의 진실에 도달하기 직전입니다!';
        } else {
            status = '✨ 도감 완료! 율이 특급 요원 최고! ✨';
            triggerAllCompleteConfetti();
        }
        agentStatus.textContent = status;
    }

    // 6. 보물 도감 카드 그리드 렌더링
    function renderGrids() {
        lockedGrid.innerHTML = '';
        unlockedGrid.innerHTML = '';

        let lockedNum = 0;
        let unlockedNum = 0;

        missionsData.forEach(cat => {
            // 카테고리 필터 적용
            if (activeCategory !== '전체' && cat.category !== activeCategory) return;

            cat.missions.forEach(mission => {
                const isCompleted = completedMissions.some(m => m.id === mission.id);
                const card = createCardElement(mission, cat.category, isCompleted);

                if (isCompleted) {
                    unlockedGrid.appendChild(card);
                    unlockedNum++;
                } else {
                    lockedGrid.appendChild(card);
                    lockedNum++;
                }
            });
        });

        // 수치 뱃지 갱신
        lockedCount.textContent = lockedNum;
        unlockedCount.textContent = unlockedNum;

        // 비었을 경우 빈 슬롯 연출
        if (lockedNum === 0) {
            lockedGrid.innerHTML = '<div class="empty-state">🎉 모든 미션을 복원했습니다!</div>';
        }
        if (unlockedNum === 0) {
            unlockedGrid.innerHTML = '<div class="empty-state">🔒 아직 복원된 도감이 없습니다.</div>';
        }
    }

    // 개별 보물 카드 생성
    function createCardElement(mission, category, isCompleted) {
        const card = document.createElement('div');
        card.className = `treasure-card ${isCompleted ? 'completed' : 'locked'}`;
        card.dataset.id = mission.id;

        // 이미지 경로 처리 (기본 이미지가 없을 때를 대비해 로컬 이미지 혹은 플레이스홀더 제공)
        // 여기서는 미완료일 때 흑백 필터 적용됨
        const imgPath = mission.image_url;

        // 카드 상단 이미지 구역
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'card-image-wrapper';
        
        const img = document.createElement('img');
        img.className = 'card-image';
        img.src = imgPath;
        img.alt = mission.title;
        img.onerror = () => {
            // 이미지 없을 시 대체 썸네일
            img.src = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=400&q=80';
        };
        imgWrapper.appendChild(img);

        // 완성 도장 (미니)
        if (isCompleted) {
            const stampMini = document.createElement('div');
            stampMini.className = 'card-stamp-mini';
            stampMini.textContent = '복원 완료';
            imgWrapper.appendChild(stampMini);
        }

        card.appendChild(imgWrapper);

        // 카드 텍스트 정보 구역
        const info = document.createElement('div');
        info.className = 'card-info';

        const catText = document.createElement('span');
        catText.className = 'card-category';
        catText.textContent = category;

        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = mission.title;

        const meta = document.createElement('div');
        meta.className = 'card-meta';

        const point = document.createElement('span');
        point.className = 'card-point';
        point.innerHTML = `⚡ ${mission.point} <span style="font-size:8px;">GP</span>`;

        let typeLabel = '수수께끼';
        if (mission.type === 'action') typeLabel = '📸 인증샷';
        if (mission.type === 'discovery') typeLabel = '🗺️ 발견';

        const type = document.createElement('span');
        type.className = 'card-type';
        type.textContent = typeLabel;

        meta.appendChild(point);
        meta.appendChild(type);

        info.appendChild(catText);
        info.appendChild(title);
        info.appendChild(meta);

        card.appendChild(info);

        // 카드 클릭 이벤트
        card.addEventListener('click', () => openMissionModal(mission, category, isCompleted));

        return card;
    }

    // 7. 미션 상세 팝업 오픈
    function openMissionModal(mission, category, isCompleted) {
        modalCategory.textContent = category;
        modalTitle.textContent = mission.title;
        modalImage.src = mission.image_url;
        modalImage.onerror = () => {
            modalImage.src = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=800&q=80';
        };
        modalDescription.textContent = mission.description;

        // 비밀 오버레이 제어 (잠금 상태에서는 도감 내용 물음표 가림 가능하나, 유물은 힌트로 보이게 오프)
        modalMysteryOverlay.style.opacity = isCompleted ? '0' : '1';
        if (isCompleted) {
            modalMysteryOverlay.style.display = 'none';
        } else {
            modalMysteryOverlay.style.display = 'flex';
        }

        // 입력 폼 동적 주입
        missionActionArea.innerHTML = '';

        if (isCompleted) {
            // 이미 성공한 보물인 경우
            const completedData = completedMissions.find(m => m.id === mission.id);
            const viewDiv = document.createElement('div');
            viewDiv.className = 'completed-details';
            viewDiv.style.textAlign = 'center';
            viewDiv.style.padding = '12px 0';

            let responseHTML = '';
            if (mission.type === 'quiz') {
                responseHTML = `<p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 8px;">입력한 정답: <strong style="color: var(--color-gold-light);">${completedData.submittedAnswer || '정답 확인'}</strong></p>`;
            } else if (mission.type === 'action' && completedData.photo) {
                responseHTML = `
                    <div style="width: 100%; max-height: 180px; overflow: hidden; border-radius: 8px; margin-bottom: 8px;">
                        <img src="${completedData.photo}" style="width: 100%; object-fit: cover;">
                    </div>
                `;
            }

            viewDiv.innerHTML = `
                <div style="font-size: 16px; color: var(--color-stamp); font-weight: 700; margin-bottom: 12px;">🏆 완료된 임무</div>
                ${responseHTML}
                <button class="submit-btn" style="background: rgba(255,255,255,0.06); color: var(--color-text-muted); border: 1px solid var(--glass-border); box-shadow: none;" disabled>이 미션은 완전히 복원되었습니다!</button>
            `;
            missionActionArea.appendChild(viewDiv);
        } else {
            // 아직 완료하지 않은 보물인 경우
            if (mission.type === 'quiz') {
                createQuizForm(mission);
            } else if (mission.type === 'action') {
                createActionForm(mission);
            } else if (mission.type === 'discovery') {
                createDiscoveryForm(mission);
            }
        }

        missionModal.classList.add('active');
    }

    // [미션 타입 1] 퀴즈 폼 생성
    function createQuizForm(mission) {
        const form = document.createElement('form');
        form.innerHTML = `
            <div class="form-group">
                <label class="form-label">답변 입력하기</label>
                <input type="text" class="text-input" id="quizInput" placeholder="이곳에 정답을 입력하세요" required autocomplete="off">
            </div>
            <button type="submit" class="submit-btn">🔐 시간 복원하기 (+${mission.point} GP)</button>
        `;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const quizInput = document.getElementById('quizInput');
            const userAns = quizInput.value.trim().replace(/\s+/g, '');
            const correctAns = mission.answer.trim().replace(/\s+/g, '');

            // 관대한 정답 체크 (공백 제거 후 부분 포함 여부 또는 완전 일치)
            if (userAns === correctAns || userAns.includes(correctAns) || correctAns.includes(userAns)) {
                completeMission(mission.id, { submittedAnswer: quizInput.value.trim() });
            } else {
                alert(`❌ 정답이 아닙니다!\n힌트: ${mission.answer.substring(0, 3)}... 형식 또는 알맞은 정답을 적어보세요!\n(어려우면 아빠에게 정답을 물어보세요!)`);
                quizInput.focus();
            }
        });

        missionActionArea.appendChild(form);
    }

    // [미션 타입 2] 인증샷 폼 생성 (가상 카메라 & 이미지 업로드)
    function createActionForm(mission) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="form-group">
                <label class="form-label">인증 사진 올리기 (또는 직접 촬영)</label>
                <div class="file-upload-wrapper">
                    <span class="upload-icon">📸</span>
                    <span class="upload-text">카메라로 촬영하거나 사진 선택</span>
                    <input type="file" class="file-upload-input" id="photoInput" accept="image/*">
                </div>
                <div class="preview-container" id="photoPreviewContainer">
                    <img src="" alt="미리보기" class="preview-img" id="photoPreview">
                </div>
            </div>
            <button class="submit-btn" id="photoSubmitBtn" disabled>🔐 사진 전송 및 복원 (+${mission.point} GP)</button>
        `;

        const photoInput = div.querySelector('#photoInput');
        const photoPreviewContainer = div.querySelector('#photoPreviewContainer');
        const photoPreview = div.querySelector('#photoPreview');
        const photoSubmitBtn = div.querySelector('#photoSubmitBtn');
        let selectedPhotoData = null;

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    selectedPhotoData = event.target.result;
                    photoPreview.src = selectedPhotoData;
                    photoPreviewContainer.style.display = 'block';
                    photoSubmitBtn.removeAttribute('disabled');
                };
                reader.readAsDataURL(file);
            }
        });

        photoSubmitBtn.addEventListener('click', () => {
            if (selectedPhotoData) {
                completeMission(mission.id, { photo: selectedPhotoData });
            }
        });

        missionActionArea.appendChild(div);
    }

    // [미션 타입 3] 발견 폼 생성
    function createDiscoveryForm(mission) {
        const div = document.createElement('div');
        div.innerHTML = `
            <p style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 16px; text-align: center;">🏛️ 해당 유적물 바로 앞에 도착했다면 아래 버튼을 터치하여 도감을 발견 상태로 만드세요!</p>
            <button class="submit-btn" id="discoverySubmitBtn">📍 발견 완료 터치! (+${mission.point} GP)</button>
        `;

        const discoverySubmitBtn = div.querySelector('#discoverySubmitBtn');
        discoverySubmitBtn.addEventListener('click', () => {
            completeMission(mission.id, {});
        });

        missionActionArea.appendChild(div);
    }

    // 8. 미션 완료 성공 처리 (LocalStorage 저장 및 연출)
    function completeMission(missionId, extraData = {}) {
        // 모달 닫기
        missionModal.classList.remove('active');

        // 데이터 기록
        const newRecord = {
            id: missionId,
            completedAt: new Date().toISOString(),
            ...extraData
        };
        completedMissions.push(newRecord);
        localStorage.setItem('yul_gj_completed_missions', JSON.stringify(completedMissions));

        // 도장 효과 재생
        triggerStampEffect();
    }

    // 9. 도장 애니메이션 및 사운드 연출
    function triggerStampEffect() {
        // 1) 사운드 재생 시도
        try {
            soundStamp.currentTime = 0;
            soundStamp.play().catch(e => console.log('사운드 재생 차단됨:', e));
        } catch (e) {
            console.log(e);
        }

        // 2) 도장 레이어 활성화
        stampOverlayEffect.classList.add('active');

        // 3) 도장 쾅 찍히는 타이밍(약 300ms 후)에 화면 흔들림 효과 부여 및 성공 사운드
        setTimeout(() => {
            appContainer.classList.add('shake-screen');
            try {
                soundSuccess.currentTime = 0;
                soundSuccess.play().catch(e => console.log(e));
            } catch (e) { }

            setTimeout(() => {
                appContainer.classList.remove('shake-screen');
            }, 300);
        }, 200);

        // 4) 연출 종료 후 화면 업데이트
        setTimeout(() => {
            stampOverlayEffect.classList.remove('active');
            updateDashboard();
            renderGrids();
        }, 1500);
    }

    // 10. 아빠 전용 제어판 (리셋 및 올클리어)
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    closeSettingsModalBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    closeModalBtn.addEventListener('click', () => {
        missionModal.classList.remove('active');
    });

    // 밖 터치 시 닫기
    window.addEventListener('click', (e) => {
        if (e.target === missionModal) missionModal.classList.remove('active');
        if (e.target === settingsModal) settingsModal.classList.remove('active');
    });

    // 전체 리셋
    resetAppBtn.addEventListener('click', () => {
        if (confirm('⚠️ 정말로 율이의 모든 경주 탐험 기록을 초기화할까요?\n(점수와 획득한 보물이 모두 사라집니다!)')) {
            completedMissions = [];
            localStorage.removeItem('yul_gj_completed_missions');
            settingsModal.classList.remove('active');
            updateDashboard();
            renderGrids();
            alert('🔄 초기화 완료! 타임머신이 가동 전 상태로 돌아갔습니다.');
        }
    });

    // 강제 올클리어 (테스트용)
    completeAllBtn.addEventListener('click', () => {
        if (confirm('⚡ 테스트를 위해 모든 미션을 즉시 완료 처리할까요?')) {
            completedMissions = [];
            missionsData.forEach(cat => {
                cat.missions.forEach(mission => {
                    completedMissions.push({
                        id: mission.id,
                        completedAt: new Date().toISOString(),
                        submittedAnswer: '아빠 헬퍼 정답',
                        photo: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=400&q=80'
                    });
                });
            });
            localStorage.setItem('yul_gj_completed_missions', JSON.stringify(completedMissions));
            settingsModal.classList.remove('active');
            updateDashboard();
            renderGrids();
            alert('⚡ 모든 도감이 복원되었습니다!');
        }
    });

    // 11. 배경용 추가 별 생성
    function createStarsBackground() {
        const starsContainer = document.getElementById('stars');
        if (!starsContainer) return;
        const numStars = 40;
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.position = 'absolute';
            star.style.width = Math.random() * 2 + 1 + 'px';
            star.style.height = star.style.width;
            star.style.background = 'white';
            star.style.borderRadius = '50%';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.opacity = Math.random() * 0.7 + 0.3;
            star.style.animation = `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`;
            starsContainer.appendChild(star);
        }
    }

    // 별 반짝임 애니메이션 스타일을 동적 주입
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
        .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px 20px;
            color: var(--color-text-muted);
            font-size: 13px;
            background: rgba(255,255,255,0.02);
            border-radius: var(--border-radius-md);
            border: 1px dashed rgba(255,255,255,0.06);
        }
    `;
    document.head.appendChild(style);

    // 축하 팡파레 (올클리어 시 가볍게 터짐)
    function triggerAllCompleteConfetti() {
        console.log('🎉 축하합니다! 경주 보물 도감이 완성되었습니다.');
    }

    // 실행 시작
    loadMissions();
});
