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
    const modalHeritageBadge = document.getElementById('modalHeritageBadge');
    const heritageExplainBox = document.getElementById('heritageExplainBox');
    const heritageExplainContent = document.getElementById('heritageExplainContent');

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
                    "title": "아름다운 종소리, 성덕대왕신종",
                    "type": "quiz",
                    "description": "신라 시대에 돌아가신 아버지 성덕대왕을 위해 정성껏 만든 아주 크고 아름다운 종이에요. 몸에는 날아갈 듯 예쁜 비천상이 새겨져 있고 맑고 여운이 긴 소리가 나요. 이 종의 이름은 무엇일까요? (힌트: ㅅㄷㄷㅇㅅㅈ)",
                    "answer": "성덕대왕신종",
                    "point": 100,
                    "image_url": "성덕대왕신종.jpg"
                },
                {
                    "id": "m1_2",
                    "title": "흙인형이 붙은 토우장식 항아리",
                    "type": "quiz",
                    "description": "목이 긴 항아리에 신라인들이 흙으로 만든 여러 모양의 인형(토우)을 붙여 장식한 그릇이에요. 항아리에 붙어 있는 흙인형들을 가리키는 말은 무엇일까요? (힌트: ㅌㅇ)",
                    "answer": "토우",
                    "point": 100,
                    "image_url": "토우장식 항아리.jpg"
                },
                {
                    "id": "m1_3",
                    "title": "하늘을 나는 날개, 관꾸미개",
                    "type": "quiz",
                    "description": "고깔 모양의 모자 정면에 끼워 쓰던 화려한 금빛 장식입니다. 이 장식은 하늘을 훨훨 날아다니는 힘찬 '이 동물'의 날개 모양을 닮았어요. 하늘을 나는 깃털 달린 이 동물은 무엇일까요? (힌트: ㅅ)",
                    "answer": "새",
                    "point": 100,
                    "image_url": "관꾸미개.jpg"
                },
                {
                    "id": "m1_4",
                    "title": "의자에 앉은 미륵삼존불",
                    "type": "quiz",
                    "description": "가운데 불상이 아주 특이하게 '이것'에 앉아 있는 모습을 하고 있어요. 삼국시대 불상 중에서 유일하게 '이것'에 앉아 있는 자세라 신기하답니다. 우리가 공부할 때나 엉덩이를 대고 앉는 가구의 이름은 무엇일까요? (힌트: ㅇㅈ)",
                    "answer": "의자",
                    "point": 100,
                    "image_url": "미륵삼존불.jpg"
                },
                {
                    "id": "m1_5",
                    "title": "천진난만한 미소, 얼굴무늬 수막새",
                    "type": "quiz",
                    "description": "신라의 미소라고 불리는 이 유물은 도톰한 입술과 위로 들린 입꼬리로 온화하게 웃고 있어요. 기와를 지붕 위에 얹어 나쁜 기운을 쫓아내려고 했지요. 온화하고 따뜻한 표정으로 짓고 있는 천진난만한 '이것'은 무엇일까요? (힌트: ㅁㅅ)",
                    "answer": "미소",
                    "point": 100,
                    "image_url": "얼굴무늬 수막새.jpg"
                },
                {
                    "id": "m1_6",
                    "title": "금관총의 대표 보물, 금관",
                    "type": "quiz",
                    "description": "이 무덤에서 번쩍이는 금으로 만든 멋진 왕관이 처음으로 나와서 무덤 이름도 '금관총'이라고 부르게 되었어요. 번쩍번쩍 빛나는 이 왕관을 무엇이라고 할까요? (힌트: ㄱㄱ)",
                    "answer": "금관",
                    "point": 100,
                    "image_url": "금관.jpg"
                },
                {
                    "id": "m1_7",
                    "title": "천마총의 화려한 금관",
                    "type": "quiz",
                    "description": "천마총에서 나온 이 금관은 나뭇가지 모양 장식과 '이 동물'의 뿔 모양 장식으로 화려하게 꾸며져 있어요. 숲속을 껑충껑충 뛰어다니고 멋진 뿔을 가진 이 동물은 무엇일까요? (힌트: ㅅㅅ)",
                    "answer": "사슴",
                    "point": 100,
                    "image_url": "금관(천마총).jpg"
                },
                {
                    "id": "m1_8",
                    "title": "지배자의 황금 모자, 금제 관모",
                    "type": "quiz",
                    "description": "이것은 신라의 높은 사람이 쓰던 아주 멋진 금빛 모자 장식이에요. 머리를 보호하거나 멋을 내기 위해 머리에 쓰는 이것은 무엇일까요? (힌트: ㅁㅈ)",
                    "answer": "모자",
                    "point": 100,
                    "image_url": "금제 관모.jpg"
                },
                {
                    "id": "m1_9",
                    "title": "하늘을 나는 날개 장식",
                    "type": "quiz",
                    "description": "이 장식은 모자 앞에 꽂는 것으로, 하늘을 훨훨 날아다니는 '이 곤충'이나 새의 날개 모양을 닮았어요. 알록달록 이쁜 날개를 가지고 꽃을 찾아 날아다니는 이 곤충은 무엇일까요? (힌트: ㄴㅂ)",
                    "answer": "나비",
                    "point": 100,
                    "image_url": "금제 새날개모양금관장식.jpg"
                },
                {
                    "id": "m1_10",
                    "title": "대롱대롱 흔들리는 드리개",
                    "type": "quiz",
                    "description": "금관이나 귀걸이 밑에 대롱대롱 매달아 화려하게 늘어뜨리는 장식이에요. 맨 아래에는 반달이나 애벌레처럼 구부러진 모양의 '이것'을 매달았어요. 신라 보석에 꼭 들어가는 굽은 모양의 보석 이름은 무엇일까요? (힌트: ㄱㅇㅇ)",
                    "answer": "곱은옥",
                    "point": 100,
                    "image_url": "드리개.jpg"
                },
                {
                    "id": "m1_11",
                    "title": "알록달록 가슴 장식, 목걸이",
                    "type": "quiz",
                    "description": "여러 가지 예쁜 보석 구슬과 유리 구슬을 실에 꿰어 목에 걸어 꾸미는 장신구예요. 목에 거는 보석 이름은 무엇일까요? (힌트: ㅁㄱㅇ)",
                    "answer": "목걸이",
                    "point": 100,
                    "image_url": "목걸이.jpg"
                },
                {
                    "id": "m1_12",
                    "title": "여러 장식이 달린 허리띠",
                    "type": "quiz",
                    "description": "바지가 흘러내리지 않게 허리에 두르는 끈으로, 신라 시대에는 여기에 물고기나 약병 모양의 여러 장식을 매달아 꾸몄어요. 허리에 두르는 이것은 무엇일까요? (힌트: ㅎㄹㄸ)",
                    "answer": "허리띠",
                    "point": 100,
                    "image_url": "허리띠.jpg"
                },
                {
                    "id": "m1_13",
                    "title": "황금빛 화려한 장식보검",
                    "type": "quiz",
                    "description": "이것은 황금과 붉은 보석으로 아주 화려하게 꾸민 칼이에요. 뾰족하고 날카로워 무언가를 자르거나 스스로를 지키기 위해 쓰는 도구는 무엇일까요? (힌트: ㅋ)",
                    "answer": "칼",
                    "point": 100,
                    "image_url": "장식보검.jpg"
                },
                {
                    "id": "m1_14",
                    "title": "봉황이 새겨진 고리자루큰칼",
                    "type": "quiz",
                    "description": "이 칼의 손잡이 끝에는 동그란 고리가 있고, 그 안에는 전설 속의 상서로운 새인 '이것'의 무늬가 새겨져 있어요. 꼬리가 길고 아름다우며 용과 함께 자주 나타나는 이 새는 무엇일까요? (힌트: ㅂㅎ)",
                    "answer": "봉황",
                    "point": 100,
                    "image_url": "봉황무늬 고리자루큰칼.jpg"
                },
                {
                    "id": "m1_15",
                    "title": "팔을 보호하는 팔뚝가리개",
                    "type": "quiz",
                    "description": "싸움터에 나갈 때 적의 공격으로부터 팔을 보호하기 위해 단단하게 덮는 갑옷의 일부예요. 몸의 일부분인 '이곳'을 보호하기 위해 끼는 가리개는 무엇일까요? (힌트: ㅍ)",
                    "answer": "팔",
                    "point": 100,
                    "image_url": "팔뚝가리개.jpg"
                },
                {
                    "id": "m1_16",
                    "title": "반짝이는 유리제 잔",
                    "type": "quiz",
                    "description": "모래를 뜨거운 열로 녹여 만든 투명하고 반짝이는 물건이에요. 멀리 유라시아 대륙에서 수입한 아주 귀한 그릇으로, 물이나 주스를 따라 마실 때 써요. 이것은 무엇일까요? (힌트: ㅇㄹㅈ)",
                    "answer": "유리잔",
                    "point": 100,
                    "image_url": "유리제 잔.jpg"
                },
                {
                    "id": "m1_17",
                    "title": "화려한 금제 달개달린굽다리접시",
                    "type": "quiz",
                    "description": "신라 왕족들의 무덤에서 나온 아주 화려한 그릇이에요. 음식을 담는 둥글고 넓적한 판 아래에 높다란 다리가 달려 있어요. 음식을 담아 놓는 이 납작한 그릇은 무엇일까요? (힌트: ㅈㅅ)",
                    "answer": "접시",
                    "point": 100,
                    "image_url": "금제 달개달린굽다리접시.jpg"
                },
                {
                    "id": "m1_18",
                    "title": "동물 모양의 서수모양 주전자",
                    "type": "quiz",
                    "description": "이 그릇은 몸통은 거북이, 머리와 꼬리는 용의 모양을 하고 있어요. 등에는 물을 넣는 구멍이 있고 가슴에는 물을 따르는 부리가 달린 '이 도구'예요. 차나 물을 담아 따르는 이 도구는 무엇일까요? (힌트: ㅈㅈㅈ)",
                    "answer": "주전자",
                    "point": 100,
                    "image_url": "서수모양 주전자.jpg"
                },
                {
                    "id": "m1_19",
                    "title": "말을 탄 사람, 기마인물형토기",
                    "type": "quiz",
                    "description": "신라 무사가 씩씩하게 갑옷을 입고 '이 동물'을 타고 있는 모습을 흙으로 빚은 그릇이에요. 다리가 네 개 있고 사람이 등 위에 타서 달리는 이 동물은 무엇일까요? (힌트: ㅁ)",
                    "answer": "말",
                    "point": 100,
                    "image_url": "기마인물형토기.jpg"
                },
                {
                    "id": "m1_20",
                    "title": "병을 고쳐주는 부처님, 약사여래",
                    "type": "quiz",
                    "description": "아픈 사람들의 병을 고쳐주고, 건강하게 오래 살 수 있게 도와주는 착하고 인자한 부처님이에요. 한 손에는 약그릇이나 약상자를 들고 있는 이 부처님을 무엇이라고 부를까요? (힌트: ㅇㅅㅇㄹ)",
                    "answer": "약사여래",
                    "point": 100,
                    "image_url": "약사여래.jpg"
                },
                {
                    "id": "m1_21",
                    "title": "약속을 새긴 임신서기석",
                    "type": "quiz",
                    "description": "신라의 젊은 화랑들이 나라에 충성하고 열심히 공부하겠다고 약속을 새겨놓은 돌이에요. 단단한 '이것'에 글자를 새겨 남겼는데, 길가나 산에서 흔히 볼 수 있는 단단하고 무거운 이 물건은 무엇일까요? (힌트: ㄷ)",
                    "answer": "돌",
                    "point": 100,
                    "image_url": "임신서기석.jpg"
                },
                {
                    "id": "m1_22",
                    "title": "왕족의 상징, 금제 허리띠",
                    "type": "quiz",
                    "description": "왕족이 쓰던 허리띠로, 황금으로 아주 눈부시게 만들고 아래에 약통, 물고기 등 여러 물건을 주렁주렁 매달아 꾸몄어요. 황금으로 만든 이 허리띠를 무엇이라고 할까요? (힌트: ㄱㅈㅎㄹㄸ)",
                    "answer": "금제허리띠",
                    "point": 100,
                    "image_url": "금제 허리띠.jpg"
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
                    "image_url": "cheomseongdae.jpg"
                },
                {
                    "id": "m2_2",
                    "title": "꼭대기 우물 정(井)자",
                    "type": "quiz",
                    "description": "첨성대 꼭대기를 자세히 보면 돌이 '#' 모양으로 쌓여 있어요. 한자로는 우물을 뜻하는 이 글자의 이름은 무엇일까요?",
                    "answer": "우물 정",
                    "point": 100,
                    "image_url": "top_stone.jpg",
                    "heritage_type": "국보"
                },
                {
                    "id": "m2_3",
                    "title": "별을 관측하던 첨성대",
                    "type": "quiz",
                    "description": "신라 선덕여왕 때 세워진, 동양에서 가장 오래된 별을 보는 관측대예요. 돌을 동그랗고 높게 쌓아 올린 이 유명한 건물의 이름은 무엇일까요? (힌트: ㅊㅅㄷ)",
                    "answer": "첨성대",
                    "point": 100,
                    "image_url": "첨성대.jpg",
                    "heritage_type": "국보"
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
                    "image_url": "pond_night.jpg"
                },
                {
                    "id": "m3_2",
                    "title": "신라의 주사위, 주령구",
                    "type": "quiz",
                    "description": "신라 귀족들이 놀던 주사위입니다. 일반 주사위는 6면이지만, 이 주령구는 총 몇 개의 면으로 이루어져 있을까요? 현장 안내판에서 숫자를 찾아보세요!",
                    "answer": "14면",
                    "point": 100,
                    "image_url": "dice.jpg",
                    "heritage_type": "사적"
                },
                {
                    "id": "m3_3",
                    "title": "손님을 맞이하던 동궁과 월지",
                    "type": "quiz",
                    "description": "신라 왕궁의 별궁터로, 나라에 기쁜 일이 있을 때 귀한 손님들을 모셔 잔치를 열던 곳이에요. 아름다운 연못인 '안압지'와 함께 불리는 이곳의 이름은 무엇일까요? (힌트: ㄷㄱㄱㅇㅈ)",
                    "answer": "동궁과 월지",
                    "point": 100,
                    "image_url": "동궁과 월지.jpg",
                    "heritage_type": "사적"
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
                    "image_url": "lake_view.jpg"
                },
                {
                    "id": "m4_2",
                    "title": "경주산책 (북카페)",
                    "type": "discovery",
                    "description": "라한셀렉트 내에 있는 북카페 '경주산책'에 방문하여 마음에 드는 공간을 발견하고 타임머신 임무를 공식 종료합니다.",
                    "answer": "경주산책 방문 완료",
                    "point": 100,
                    "image_url": "book_cafe.jpg",
                    "heritage_type": ""
                },
                {
                    "id": "m4_3",
                    "title": "아름다운 인공 호수, 보문호",
                    "type": "quiz",
                    "description": "경주 보문관광단지에 있는 아주 크고 아름다운 호수예요. 봄이 되면 주변에 벚꽃이 예쁘게 피어나고 산책하기 좋은 이 호수의 이름은 무엇일까요? (힌트: ㅂㅁㅎ)",
                    "answer": "보문호",
                    "point": 100,
                    "image_url": "보문호.jpg",
                    "heritage_type": ""
                },
                {
                    "id": "m4_4",
                    "title": "울부짖는 형상들",
                    "type": "action",
                    "description": "라한셀렉트 호텔 안에 전시된 프랑스의 유명한 조각가 부르델의 '울부짖는 형상들' 조각상 앞에서, 멋지게 인증 사진을 찍어 도감을 완성하세요!",
                    "answer": "인증샷 촬영 완료",
                    "point": 100,
                    "image_url": "울부짖는 형상들.webp",
                    "heritage_type": "미술품"
                }
            ]
        }
    ];

    // 3. 미션 데이터 초기 로드
    async function loadMissions() {
        try {
            const response = await fetch('missions.json?v=1.3');
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

        // 국보/보물 뱃지 생성 (카드의 좌측 상단 모서리)
        if (mission.heritage_type) {
            const badgeWrapper = document.createElement('div');
            badgeWrapper.className = 'heritage-badge-wrapper';
            
            const badge = document.createElement('span');
            badge.className = 'heritage-badge';
            
            if (mission.heritage_type === '국보') {
                badge.classList.add('national-treasure');
                badge.textContent = '👑 국보';
            } else if (mission.heritage_type === '보물') {
                badge.classList.add('treasure');
                badge.textContent = '💎 보물';
            } else if (mission.heritage_type === '사적') {
                badge.classList.add('historical-site');
                badge.textContent = '🏛️ 사적';
            } else if (mission.heritage_type === '미술품') {
                badge.classList.add('artpiece');
                badge.textContent = '🖼️ 미술품';
            }
            
            if (badge.classList.contains('national-treasure') || badge.classList.contains('treasure') || badge.classList.contains('historical-site') || badge.classList.contains('artpiece')) {
                badgeWrapper.appendChild(badge);
                imgWrapper.appendChild(badgeWrapper);
            }
        }

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

        // 국보/보물 뱃지 설정 및 설명 토글 제어
        if (mission.heritage_type) {
            modalHeritageBadge.style.display = 'inline-flex';
            modalHeritageBadge.className = 'modal-heritage-badge'; // 기존 클래스 리셋
            
            if (mission.heritage_type === '국보') {
                modalHeritageBadge.classList.add('national-treasure');
                modalHeritageBadge.textContent = '👑 국보';
            } else if (mission.heritage_type === '보물') {
                modalHeritageBadge.classList.add('treasure');
                modalHeritageBadge.textContent = '💎 보물';
            } else if (mission.heritage_type === '사적') {
                modalHeritageBadge.classList.add('historical-site');
                modalHeritageBadge.textContent = '🏛️ 사적';
            } else if (mission.heritage_type === '미술품') {
                modalHeritageBadge.classList.add('artpiece');
                modalHeritageBadge.textContent = '🖼️ 미술품';
            } else {
                modalHeritageBadge.style.display = 'none';
            }
        } else {
            modalHeritageBadge.style.display = 'none';
        }

        // 설명 박스 기본 닫힘 및 뱃지 클릭 이벤트 바인딩
        heritageExplainBox.classList.remove('active');
        
        modalHeritageBadge.onclick = () => {
            if (mission.heritage_type === '국보') {
                heritageExplainContent.innerHTML = '👑 <strong>국보</strong>는 우리나라에 딱 하나밖에 없거나 정말정말 소중해서 나라의 대표가 된 엄청난 보물이에요!';
                heritageExplainBox.classList.toggle('active');
            } else if (mission.heritage_type === '보물') {
                heritageExplainContent.innerHTML = '💎 <strong>보물</strong>은 옛날 조상님들의 모습을 알 수 있는 아주 귀하고 훌륭한 가치를 인정받은 멋진 보물이에요!';
                heritageExplainBox.classList.toggle('active');
            } else if (mission.heritage_type === '사적') {
                heritageExplainContent.innerHTML = '🏛️ <strong>사적</strong>은 옛날 조상님들이 살았거나 역사적으로 아주 특별한 일이 있었던 소중한 장소예요!';
                heritageExplainBox.classList.toggle('active');
            } else if (mission.heritage_type === '미술품') {
                heritageExplainContent.innerHTML = '🖼️ <strong>미술품</strong>은 호텔 안에 전시되어 있는 아주 멋지고 훌륭한 진짜 예술 작품이에요!';
                heritageExplainBox.classList.toggle('active');
            }
        };

        // 잠금 상태에서도 유물 그림이 힌트로 보이도록 물음표 오버레이 비활성화 및 흑백 필터 연출
        modalMysteryOverlay.style.display = 'none';
        modalMysteryOverlay.style.opacity = '0';
        modalImage.style.filter = isCompleted ? 'none' : 'grayscale(100%) brightness(0.8)';

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
