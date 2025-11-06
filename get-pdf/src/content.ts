// MEMO: pdf파일은 url을 사용해서 fetch해야하므로 네트워크 리퀘스트가 발생한다. 그러므로 async를 사용해야한다. I/O(from network)
// https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/web-accessible-resources
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#sending_an_asynchronous_response_using_a_promise


async function getPDF(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) : Promise<void> {
    
    if (message === "GET_PDFS") {    
        let downloadUrl: string | null = ""
        const el = document.querySelector("span[download_url]");
        if (el) {
            downloadUrl = el.getAttribute('download_url');

            if (downloadUrl) {
                const res = await fetch(downloadUrl);
            }

        }
    }
};

chrome.runtime.onMessage.addListener(
    getPDF
);