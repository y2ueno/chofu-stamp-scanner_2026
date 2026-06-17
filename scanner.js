/**
 * scanner.js (長府デジタルスタンプラリー用・修正版)
 */

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/aajx7c9rxilbjpeak72iqbj6l9e9lct3';
const VALID_QR_CODES = ["A01", "A02", "A03", "A04", "S05", "S06", "S07"];

let html5QrcodeScannerInstance = null;
let isProcessingScan = false;

function debugLog(message, isError = false) {
    const logEl = document.getElementById('qr-reader-results');
    if (logEl) {
        logEl.style.display = 'block';
        logEl.style.color = isError ? 'red' : 'black';
        logEl.innerText = `[DEBUG]: ${message}`;
    }
}

function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function onScanSuccess(decodedText, decodedResult) {
    if (isProcessingScan) return;
    isProcessingScan = true;
    
    debugLog(`認識成功: ${decodedText}`);

    if (html5QrcodeScannerInstance) {
        await html5QrcodeScannerInstance.clear();
    }

    if (!VALID_QR_CODES.includes(decodedText)) {
        debugLog(`対象外QR: ${decodedText}`, true);
        alert(`このQRコードは対象外です。`);
        isProcessingScan = false;
        return;
    }

    const userEmail = getQueryParam('email');
    if (!userEmail) {
        debugLog(`メールアドレス取得失敗`, true);
        alert("エラー: 参加者情報が取得できません。");
        isProcessingScan = false;
        return;
    }

    debugLog(`送信中...`);

    try {
        // 【修正ポイント】POST/JSONではなく、GETパラメータ方式で送信
        const params = new URLSearchParams({
            email: userEmail,
            spot_id: decodedText,
            scanned_at: new Date().toISOString()
        });
        
        const response = await fetch(`${MAKE_WEBHOOK_URL}?${params.toString()}`, {
            method: 'GET' 
        });

        const result = await response.text();
        debugLog(`サーバー応答: ${response.status} - ${result}`);

        if (response.ok) {
            alert(`スタンプを獲得しました！`);
        } else {
            alert(`サーバーエラー: ${response.status}`);
        }
    } catch (error) {
        debugLog(`通信エラー: ${error.message}`, true);
        alert('通信エラーが発生しました。');
    } finally {
        isProcessingScan = false;
    }
}

function onScanFailure(error) {}

document.addEventListener('DOMContentLoaded', () => {
    try {
        html5QrcodeScannerInstance = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: 250, aspectRatio: 1.0, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
            false
        );
        html5QrcodeScannerInstance.render(onScanSuccess, onScanFailure);
        debugLog('スキャナー準備完了。QRをかざしてください。');
    } catch (e) {
        debugLog('スキャナー初期化エラー: ' + e.message, true);
    }
});
