// Promise를 사용해보기 위해 콜백지옥을 먼저 경험해보자.

const start = Date.now()

// 보다시피 코드가 안쪽으로 점점 들어가서 이해하기가 힘들어진다.
// 바깥함수 실행이 끝나면 내부함수를, 그 내부함수 실행이 끝나면, 그 내부함수에 있는 내부함수를 실행하는 식이니
// 점점 보기가 힘들어질거다.
// 코드가 옆으로가 아닌, 안으로 파고들어가는게 문제다.
// setTimeout(() => {
//     // 1. 1초 후에 A가 출력된다. (이는 비동기에서 1초 후에 결과값을 받는 것과 같다고 상정한다.)
//     console.log("A");
//     console.log(performance.now());
//     console.log(Math.floor((Date.now() - start) / 1000));

//     // 2. 1에서 1초 후, 즉 이 전체스크립트가 실행된 후인 2초 후에 B가 출력된다.
//     setTimeout(() => {
//         console.log("B");
//         console.log(performance.now());
//         console.log(Math.floor((Date.now() - start) / 1000));

//         // 3. 마찬가지로 2에서 1초 뒤, 전체에서는 3초 후에 C가 출력된다.
//         setTimeout(() => {
//             console.log("C");
//             console.log(performance.now());
//             console.log(Math.floor((Date.now() - start) / 1000));

//             // 4. 마찬가지로 3에서 1초 뒤, 전체에서는 4초 뒤에 D가 출력된다.
//             setTimeout(() => {
//                 console.log("D");
//                 console.log(performance.now());
//                 console.log(Math.floor((Date.now() - start) / 1000));
//             } ,1000);

//         }, 1000);
//     }, 1000);
// }, 1000);

// // 실제 Promise를 사용해보자.
// const myPromise = new Promise((resolve, reject) => {
//     console.log("실행자 함수가 작동 중입니다.");
//     // resolve에서 보낸 인자가, then에 설정한 콜백함수의 인자로 들어간다.
//     resolve("Promise resolved"); // then

// });

// // 왜 에러가 발생하지 않고 작동하지? 이해가 안가네? 
// myPromise.then((resolve) => {console.log(`${resolve}: good`)});

myExecutor = (onSuccess, onFailure) => {
    console.log("myExecutor: 도구들을 받았습니다. 1초간 작업합니다.");

    const isSuccess = false;

    setTimeout(
        () => {
            if (isSuccess) {
                onSuccess("실행자 결과, 성공했습니다!");
            } else {
                onFailure("실행자 결과, 실패했습니다!");
            };
        }
        , 1000
    )
};


// 함수로 Promise의 원리를 구현해보자.
// 포인트는
// 1. Promise안에서 콜백함수인 실행자 함수를 호출한다는 것.
// 2. Promise는 resolve, reject라는 함수를 콜백함수의 인자로 전달한다는 것.
// 3. callback함수인 실행자 함수는 resolve와 reject를 실행한다는 것.
// 4. 즉, Promise안에서는 실행자 함수가 시간이 걸리는, 비동기라는 것, 즉 시간이 걸리는 주체다.
// 5. Promise는 그 주체를 담는 상자이고, 주체가 성공하면 resolve를 호출하는 거고,
// 실패하면 reject를 호출하도록 실행자 함수 안에서는 그렇게 설정되어있어야한다.
// 6. resolve
function runTask(myCallback) {
    const tool1_success = (message) => {
        console.log(`[도구1] 성공!: ${message}`);
    };

    const tool2_failure = (message) => {
        console.log(`[도구2] 실패! ${message}`);
    }

    myCallback(tool1_success, tool2_failure);
}

runTask(myExecutor);

class myCustomPromise {
    constructor(myCallback) {
        const resolve = (message) => {
            console.log(`성공했습니다. ${message}`);
        };
        
        const reject = (message) => {
            console.log(`실패했습니다. ${message}`)
        }
    };
};