- 다음으로는 cross-extension messaging확인해볼것
- `chrome.runtime.sendMessage`는 기본적으로 해당 chrome extension내부에서 데이터를 보낸다. 다른 chrome extension에 보내고 싶다면 별도 id를 지정하면 된다.
- `chrome.runtime.sendMessage`로 보낸 데이터는 `chrome.runtime.onMessage`의 `request.<key>`로 받을 수 있다.
  - ```javascript
    
    // content.js
    (async () => {
        const response = await chrome.runtime.sendMessage({greeting: "hello"});
        // do something with response here, not outside the function
        console.log(response);
    })();


    // background.js
    chrome.runtime.onMessage.addEventListener((request, sender, sendResponse) => {
        console.log(request.greeting, "확인완료");
        sendResponse("태스트 완료");
        }
    );
    

    ```
- background에서 content.js로 메시지를 보낼 때는 `chrome.runtime.sendMessage`대신에 `chrome.tabs.sendMessage`를 사용하는것이 표준적인 방법이다.
  - 어떤 탭의 content.js에게 메시지를 보낼지 반드시 지정해야하기 때문이다.
  - content.js는 여러 탭에 동시에 실행되고 있을수 있기 때문이다.
  - 일반적으로 tab.id를 구분하는 것은 background.js에서 하고, content.js에서는 tab.id를 식벽하지 못하기 때문에 tab별로 동작을 원한다면 action을 추가로 정해줘야한다.
  - ```javascript
    
    // background.js
    chrome.action.onClicked.addListener((tab) => {
        if (tab.id == 123) {
            chrome.tabs.sendMessage(tab.id, 
                {
                    action: "CHANGE_BACKGROUND_COLOR",
                    color: "blue"
                });
            }
    });

    // content.js
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action == "CHANGE_BACKGROUND_COLOR") {
            console.log(request.color, "파란색");
        }
    });
    
    ```


### Reference
- https://developer.chrome.com/docs/extensions/get-started/tutorial/
- https://developer.chrome.com/docs/extensions/reference/api/runtime
- https://developer.chrome.com/docs/extensions/develop/concepts/messaging#connect