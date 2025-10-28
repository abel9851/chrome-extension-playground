
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
        })
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
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
    },
    // CURIOUS: Promise.reject는 뭐지? 왜 이런식으로 사용하는거지?
    (error) => Promise.reject(error)
);

// response가 200일 경우,
axios.interceptors.response.use(
    (response) => {
        // response에 있던 x-new-token header가 있다면 토큰을 갱신한다.
        // CURIOS: x-new-token은 뭐지?
        const newAccessToken = response.headers['x-new-token'];
    }
);

// CURIOUS: 여기서 (response) => response를 하면 그냥 response를 주는 것 뿐인가?
// 
axios.interceptors.response.use(
    (response) => response,
    async (error) => {}
);
