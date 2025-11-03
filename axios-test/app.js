// --- 0. 기본 설정 ---
const logDiv = document.getElementById('log');
function log(message) {
    console.log(message);
    logDiv.innerHTML += message + '\n';
}

const OLD_TOKEN = 'jti_asdf/2'; // 낡은 토큰
const NEW_TOKEN = 'jti_asdf/3'; // 서버가 새로 발급해줄 토큰


// --- 1. '가짜 서버' 시뮬레이션 (수정된 방식: Adapter 교체) ---
// (실제 서버 없이도 서버처럼 동작하도록 axios를 속입니다)

let refreshRequestCount = 0; // 낡은 토큰으로 요청이 몇 번 왔는지 셈

// Axios의 기본 '어댑터'를 '가짜 서버' 함수로 교체합니다.
// 어댑터는 실제 네트워크 요청을 담당하는 부분입니다.
axios.defaults.adapter = (config) => {
    const token = config.headers['Authorization']?.split(' ')[1];
    log(`[➡️ 가짜 서버] 요청 받음: ${config.url}, 토큰: ${token || '없음'}`);

    // 실제 네트워크 딜레이처럼 100ms 지연을 줍니다.
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            
            if (token === OLD_TOKEN) {
                // 낡은 토큰으로 요청이 오면
                refreshRequestCount++;
                
                if (refreshRequestCount === 1) {
                    // 1. [성공] "첫 번째" 갱신 요청 (A)
                    log(`[✅ 가짜 서버] 응답 (A): 200 OK. 새 토큰(${NEW_TOKEN}) 발급!`);
                    // Axios 성공 응답 구조에 맞춰서 반환
                    resolve({
                        data: { message: `성공 (${config.url})` },
                        headers: { 'x-new-token': NEW_TOKEN }, // 헤더에 새 토큰 발급
                        status: 200,
                        statusText: 'OK',
                        config: config
                    });
                } else {
                    // 2. [실패] "두 번째" 동시 요청 (B) (레이스 컨디션)
                    log(`[❌ 가짜 서버] 응답 (B): 401 Error. 낡은 토큰(${OLD_TOKEN}) 거부.`);
                    // Axios 에러 응답 구조에 맞춰서 반환
                    reject({
                        response: { 
                            status: 401, 
                            statusText: 'Unauthorized',
                            data: 'JTI 갱신 실패',
                            headers: {},
                            config: config
                        },
                        config: config,
                        message: 'Request failed with status code 401'
                    });
                }
            } else if (token === NEW_TOKEN) {
                // 3. [성공] "재시도" 요청 (새 토큰으로 옴)
                log(`[✅ 가짜 서버] 응답 (재시도): 200 OK. 새 토큰(${NEW_TOKEN}) 확인.`);
                resolve({
                    data: { message: `재시도 성공 (${config.url})` },
                    headers: {},
                    status: 200,
                    statusText: 'OK',
                    config: config
                });
            } else {
                // 4. [실패] 그 외 (로그인 등)
                log(`[❌ 가짜 서버] 응답: 401 Error. 유효한 토큰 아님.`);
                reject({
                    response: { 
                        status: 401, 
                        statusText: 'Unauthorized',
                        data: '유효한 토큰 아님',
                        headers: {},
                        config: config 
                    },
                    config: config,
                    message: 'Request failed with status code 401'
                });
            }
        }, 100); // 100ms 지연
    });
};


// --- 2. 우리가 만든 'Axios 인터셉터' 로직 ---
// (이 코드는 변경할 필요 없습니다. 그대로 두세요.)

// [인터셉터 1: 요청] 항상 최신 토큰 주입
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        log(`[🚀 요청 인터셉터] 출발! (URL: ${config.url})`);
        return config;
    },
    (error) => Promise.reject(error)
);

// [인터셉터 2: 응답 성공] 새 토큰 수신 시 즉시 저장
axios.interceptors.response.use(
    (response) => {
        const newAccessToken = response.headers['x-new-token'];
        if (newAccessToken) {
            log(`[🎉 응답 인터셉터] 새 토큰(${newAccessToken}) 수신! Local Storage에 저장.`);
            localStorage.setItem('accessToken', newAccessToken);
        }
        return response;
    },
    // (실패 로직은 아래에서 별도 처리)
);

// [인터셉터 3: 응답 실패] 401 감지 시 '지연' 후 재시도
axios.interceptors.response.use(
    (response) => response, // 성공은 통과
    async (error) => {
        const { config, response } = error;
        const originalRequest = config;

        // 재시도 횟수 카운트
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

        if (response && response.status === 401 && originalRequest._retryCount <= 3) {
            log(`[⚠️ 응답 인터셉터] 401 감지! (URL: ${originalRequest.url}, 시도: ${originalRequest._retryCount})`);

            // *** 핵심: 지연 (Delay) ***
            const delay = 100 * originalRequest._retryCount;
            log(`[⏳ 응답 인터셉터] ${delay}ms 지연 후 재시도합니다...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // 재시도 실행
            log(`[♻️ 응답 인터셉터] 재시도 실행! (URL: ${originalRequest.url})`);
            // originalRequest 객체의 내부 구조를 자세히 살펴보고 싶을 때는 아래처럼 console.log를 사용하세요.
            console.log('[DEBUG] originalRequest:', originalRequest);

            /*
            [💡TIP]
            - originalRequest는 axios의 config 객체입니다. error 객체에서 error.config로 전달됩니다.
            - 에디터에서 마우스 커서를 올리면 타입 정보(tooltips)를 볼 수 있으려면:
                1. 타입스크립트(.ts, .tsx) 환경일 것
                2. axios 타입 정의(typings)가 프로젝트에 설치되어 있을 것 (예: npm install --save-dev @types/axios)
                3. 변수를 명확하게 타입 선언하거나 타입 추론이 동작하는 문맥이어야 함
            - 순수 자바스크립트(.js) 파일에서는 타입 정보가 나오지 않습니다. 타입 지원이 필요한 경우 파일을 .ts로 바꾸고
            //   코드에 적절한 타입 힌트(예: /** @type {import('axios').AxiosRequestConfig} 를 추가하는 것도 방법입니다.
            // */
            // originalRequest 객체의 내부 구조(모든 속성/값)를 확인하고 싶다면 다음처럼 콘솔에 찍어보면 됩니다:
            // CURIOUS: JSON.stringify에 거네는, originalRequest, null, 2의 null과 2는 뭐지?
            // 2 같은 경우 내부에 파고는 단위같은데?
            console.log('[INFO] originalRequest 전체 구조:', JSON.stringify(originalRequest, null, 2));
            // 또는 객체 그대로 볼 수도 있습니다:
            console.dir(originalRequest);
            // 크롬 개발자도구에서는 객체 확장해서 탐색이 가능합니다.
            return axios(originalRequest);
        }

        if (originalRequest._retryCount > 3) {
            log(`[⛔ 응답 인터셉터] 3회 재시도 실패. 로그아웃 처리.`);
            // logoutUser();
        }

        return Promise.reject(error);
    }
);


// --- 3. 테스트 버튼 실행 로직 ---
// (이 코드는 변경할 필요 없습니다. 그대로 두세요.)

document.getElementById('testButton').onclick = async () => {
    logDiv.innerHTML = ''; // 로그 초기화
    log('--- 🚀 테스트 시작! ---');

    // 1. 상태 초기화 (가짜 서버, Local Storage)
    refreshRequestCount = 0;
    localStorage.setItem('accessToken', OLD_TOKEN);
    log(`[준비] Local Storage에 낡은 토큰(${OLD_TOKEN}) 저장.`);

    // 2. API 2개 "동시" 요청
    log('[준비] API (A, B) 2개 동시 요청 시작...');
    
    const promiseA = axios.get('/api/user-list');
    const promiseB = axios.get('/api/user-detail');

    // Promise.allSettled: 둘 중 하나가 실패해도 끝까지 기다림
    const results = await Promise.allSettled([promiseA, promiseB]);

    log('--- 🏁 테스트 종료! ---');
    
    // 3. 최종 결과 확인
    log(`[결과 A] ${results[0].status}: ${results[0].status === 'fulfilled' ? '성공' : results[0].reason.message}`);
    log(`[결과 B] ${results[1].status}: ${results[1].status === 'fulfilled' ? '성공' : results[1].reason.message}`);
    
    const finalToken = localStorage.getItem('accessToken');
    log(`[최종 토큰] Local Storage: ${finalToken} (목표: ${NEW_TOKEN})`);

    if (results.every(r => r.status === 'fulfilled') && finalToken === NEW_TOKEN) {
        log('\n🎉🎉🎉 [최종 판정: 성공!] 두 요청 모두 성공하고 토큰 갱신 완료!');
    } else {
        log('\n🔥🔥🔥 [최종 판정: 실패!]');
    }
};