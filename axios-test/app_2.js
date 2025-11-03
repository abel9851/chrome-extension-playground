
const logDiv = document.getElementById('log');
function log(message) {
    console.log(message);
    logDiv.innerHTML += message + '\n';
}

const OLD_TOKEN = 'jti_asdf/2';
const NEW_TOKEN = 'jti_asdf/3';

let refreshRequestCount = 0;

axios.defaults.adapter = (config) => {
    //
    const token = config.headers['Authorization']?.split(' ')[1];
    log(`[가짜서버] 요청 받음: ${config.url}, 토큰: ${token || '없음'}`);

    return new Promise((resolve, reject) => {
        setTimeout(() => {

            if (token == OLD_TOKEN) {
                refreshRequestCount++;

                if (refreshRequestCount ===1) {
                    log(`[가짜 서버] 응답 (A): 200 OK. 새 토큰 (${NEW_TOKEN}) 발급!`);

                    resolve(
                        {
                            data: {message: `성공 (${config.url})`},
                            headers: {' x-new-token': NEW_TOKEN },
                            status: 200,
                            statusText: 'OK',
                            config: config
                        }
                    );
                } else {
                    log(`[가짜 서버] 응답 (B): 401 Error. 낡은 토큰(${OLD_TOKEN} 거부.`);

                    reject({
                        response: {
                            status: 401,
                            statusText: 'Unauthorized',
                            data: 'JTI 갱신 실패',
                            headers: {},
                            config: config
                        },
                        config: config,
                        message: `Request failed with status code 401`
                    });
                }
            } else if (token === NEW_TOKEN) {
                log(`[가짜 서버] 응답 (재시도): 200 OK. 새 토큰(${NEW_TOKEN}) 확인.`);
                resolve(
                    {
                        data: { message: `재시도 성공 (${config.url})`},
                        headers: {},
                        status: 200,
                        statusText: 'OK',
                        config: config
                    }
                );
            } else {
                log(`[가짜 서버] 응답: 401 Error. 유효한 토큰 아님.`);
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
        }, 100) // 바로 주면 Cannot read properties of undefined (reading '_retryCount') 이렇게 되는건가? 왜?
    })
}

// CURIOUS: Promise.reject(error)는 뭐지?
axios.interceptors.request.use(
    (config) => {
        // Request할 때 local storage에서 access token을 취득한다.
        // 있다면 토큰을 request의 authorization header에 Bearer prefix를 추가해서
        // 리퀘스트한다.
        // token이 local storage가 없는 경우는 로그인 화면으로 전이시키는게 일반적일듯?
        // 그리고 원래 request하려고 했던 api가 아니라, 로그인 화면으로 가는 걸로 화면 전이를 해야한다.
        // api는 안보내도 된다.
        // GOTIT: Cannot read properties of undefined ('reading '_retryCount')이 발생했을 때 반환된  
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        // return config;
    },
    // CURIOUS: Promise.reject는 뭐지? 왜 이런식으로 사용하는거지?
    (error) => Promise.reject(error)
);

// response가 200일 경우,
axios.interceptors.response.use(
    (response) => {
        // response에 있던 x-new-token header가 있다면 토큰을 갱신한다.
        // CURIOUS: x-new-token은 뭐지?
        const newAccessToken = response.headers['x-new-token'];
        if (newAccessToken) {
            log(`[🎉 응답 인터셉터] 새 토큰(${newAccessToken}) 수신! Local Storage`)
            
            localStorage.setItem('accessToken', newAccessToken);
        }
    }
);

// CURIOUS: 여기서 (response) => response를 하면 그냥 response를 주는 것 뿐인가?
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        
        // error안에 config와 Response가 있구나.
        const { config, response } = error;
        // console.log(`error의 내용물을 확인중: ${error}`);
        // console.log(`error 매개변수의 객체인지 확인한다. : ${typeof error === 'object'}`);
        // console.log(`error객체는 object이다. ${typeof error}`)
        // console.log(`error 매개변수가 TypeError객체인지 확인한다. : ${error instanceof TypeError}`)
        // console.dir(error);
        // console.log(`error의 stack을 확인해보자: ${error.stack}`)
        // console.log(`error.response의 내용물을 확인중: ${response}`);
        // console.log(`config의 내용물을 확인중: ${config}`);
        const originalRequest = config;

        // 재시도 횟수 카운트
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        // CURIOUS: response를 체크하는 이유는? runtime error를 방지하기 위해서
        // runtime error란 실행중에 발생하는 에러. 문법적으로는 맞지만 논리적으로 는 터지는 것. ex. response.status를 할 때
        // response가 undefined라면 undefined에서 status를 read하는 것은 말이 안된다.(논리적이지 않다.)
        if (response && response.status === 401 && originalRequest._retryCount <= 3) {
            log(`[⚠️응답 인터셉터] 401감지! (URL: ${originalRequest.url}, 시도: ${originalRequest._retryCount})`);

            // *** 핵심 지연 (Delay) ***
            const delay = 100 * originalRequest._retryCount;
            log(`[⌛️ 응답 인터셉터] ${delay}ms 지연 후 재시도 합니다...`);
            // CURIOUS: Promise객체에 await를 하는 이유는?
            await new Promise(resolve => setTimeout(resolve, delay));

            // 재시도 실행
            log(`[♻️ 응답 인터셉터] 재시도 실행! (URL" ${originalRequest.url})`);
            // CHECK: 이 문법을 모르겠으니 찾아서 이해하자. -> 확인완료!
            console.log(`${originalRequest} 이게 config다! 안을 살펴보자!`);
            // https://axios-http.com/docs/api_intro에서 axios(config)를 사용하고 있다.
            // originalRequest는  config이므로 사용방법이 올바르다.
            // 이 originalRequest에는 method property가 있으므로 그걸로 확인한다.
            // axios.create, axios.get같은 것들은 alias이다.
            return axios(originalRequest);
        }

        if (originalRequest._retryCount > 3) {
            log(`[🛑 응답 인터셉터] 3회 재시도 실패. 로그아웃 처리.`);
        }

        // CURIOUS: axios(originalRequest)로 return하는 것과 여기처럼 Promise.reject(error);돌랴주는 것은 무슨 차이가 있는거지?
        return Promise.reject(error); 
    }
);

// --- 3. 테스트 버튼 실행 로직 ---

// document는 eventTarget object
// onclick부분은 addEventListener로 리팩토링하자.
// CURIOUS: async를 사용하고 있다는 것은 내부에 await new Promise를 사용하고 있다는 건가?
document.getElementById('testButton').onclick = async () => {
    logDiv.innerHTML = ''; // 로그 초기화
    log('--- 🚀 테스트 시작! ---');
    
    // 1. 상태 초기화 (가짜 서버, Local Storage)
    refreshRequestCount = 0;
    localStorage.setItem("accessToken", OLD_TOKEN);
    log(`[준비] Local Storage에 낡은 토큰(${OLD_TOKEN}) 저장.`);
    
    // 2. API 2개 "동시" 요청
    log('[준비] API (A, B) 2개 동시 요청 시작...');

    const promiseA = axios.get('/api/user-list');
    const promiseB = axios.get('/api/user-detail');

    // CURIOUS: 이건 왜 new Promise를 사용하지 않는거지?
    // CURIOUS: 위의 prmoiseA, B를 allSettled에 넣었는데 
    // CURIOUS: 위의 변수안에 함수를 호춣한 결과가 담기는데 await라는 키워드를 안썼기 때문에
    // CURIOUS: await가 있는 Promise.allSettled로 호출해서 resolve값을 얻는건가?
    const results = await Promise.allSettled([promiseA, promiseB]);

    // CURIOUS: 왜 console.log대신해서 log를 사용하는거지?
    // CURIOUS:  logDiv.innerHTML안에 텍스트를 추가하기 위해서인가?
    log('---🏁 테스트 종료! ---');

    // 3. 최종 결과 확인
    log(`[결과 A] ${results[0].status}: ${results[0].status === 'fulfilled' ? '성공' : results[0].reason.message}`)
    log(`[결과 B] ${results[1].status}: ${results[1].status === 'fulfilled' ? '성공' : results[1].reason.message}`)


    const finalToken = localStorage.getItem('accessToken');
    log(`[최종 토큰] Local Storage: ${finalToken} (목표: ${NEW_TOKEN})`);

    // CURIOUS: results.every가 뭔지 모르겠지만 예상으로는 배열안의 요소를 인자로 받고 활용하는 용도
    if (results.every( r => r.status === 'fulfilled') && finalToken === NEW_TOKEN) {
        log('\n🎉🎉🎉 [최종 판정: 성공!] 두 요청 모두 성공하고 토큰 갱신 완료!');
    } else {
        log(`\n🔥🔥🔥 [최종 판정: 실패!]`);
    }

}