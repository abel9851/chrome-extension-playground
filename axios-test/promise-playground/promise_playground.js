// Promise를 사용해보기 위해 콜백지옥을 먼저 경험해보자.

const start = Date.now()

setTimeout(() => {
    // 1. 1초 후에 A가 출력된다. (이는 비동기에서 1초 후에 결과값을 받는 것과 같다고 상정한다.)
    console.log("A");
    console.log(performance.now());
    console.log(Math.floor((Date.now() - start) / 1000));

    // 2. 1에서 1초 후, 즉 이 전체스크립트가 실행된 후인 2초 후에 B가 출력된다.
    setTimeout(() => {
        console.log("B");
        console.log(performance.now());
        console.log(Math.floor((Date.now() - start) / 1000));

        // 3. 마찬가지로 2에서 1초 뒤, 전체에서는 3초 후에 C가 출력된다.
        setTimeout(() => {
            console.log("C");
            console.log(performance.now());
            console.log(Math.floor((Date.now() - start) / 1000));

            // 4. 마찬가지로 3에서 1초 뒤, 전체에서는 4초 뒤에 D가 출력된다.
            setTimeout(() => {
                console.log("D");
                console.log(performance.now());
                console.log(Math.floor((Date.now() - start) / 1000));
            } ,1000);

        }, 1000);
    }, 1000);
}, 1000);