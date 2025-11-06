class TabNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TabNotFoundError"
    }
}

class TabIdNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TabIdNotFoundError"
    }
}



// CURIOUS: 이건 비동기인듯한데 왜?
async function getCurrentTab(): Promise<chrome.tabs.Tab> {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // 'tab' will either be a 'tabs.Tab' instance or 'undefined'.
    // MEMO: 성공했을 때 undefined가 반환되는 것은 성가시네...그냥 없다고 에러를 내면 될 것 같은데 왜 undefined를 리턴한다는 거지?
    // CURIOUS: [tab]의 []은 무슨 뜻이지?
    // GOTIT: array destructuring을 의미한다.
    // GOTIT = 오른쪽에서 반환된 배열의 첫번째요소를 꺼내서 tab이라는 변수에 할당하라.
    // const tabs = await chrome.tabs.query(queryOptions);
    // tab = tabs[0]와 동일하다.
    let [currentTab] = await chrome.tabs.query(queryOptions);

    if (currentTab === undefined) {
        throw new TabNotFoundError('Current Tab was not found');
    }

    return currentTab;
};

function checkTabIdType(tab: chrome.tabs.Tab): asserts tab is chrome.tabs.Tab & { id: number } {
    if (tab.id === undefined) {
        throw new TabIdNotFoundError("Tab ID was not found");
    }
}

async function sendMessage() {
    
    try {
        const currentTab = await getCurrentTab();
        checkTabIdType(currentTab);

        const response = await chrome.tabs.sendMessage(
            currentTab.id,
            "GET_PDFS"
        ); 
        console.log("Received response: ", response.farewell);
    } catch (error) {

    }
};



document.addEventListener("DOMContentLoaded", sendMessage);
