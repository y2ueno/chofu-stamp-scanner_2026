/**
 * scanner.js (長府デジタルスタンプラリー用・確定版)
 */

// ★Makeで発行したWebhook URLに書き換えてください
const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/c9u4w66v38wvwvlrohkotbowgixce8kb';

// ★7箇所のスポットID
const VALID_QR_CODES = [
    "A01", "A02", "A03", "A04", 
    "S05", "S06", "S07"
];

let html5QrcodeScannerInstance = null;
let isProcessingScan = false;

function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function updateResultsDisplay(message, type = 'info') {
    const resultsEl = document.getElementById('qr-reader-results');
    if (resultsEl) {
        resultsEl.innerText = message;
        resultsEl.className = 'qr-reader-results ' + type;
        resultsEl.style.display = 'flex';
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    if (isProcessingScan) return;
    isProcessingScan = true;
    
    updateResultsDisplay(`QRコード認識中...`, 'info');

    // スキャナーを停止
    if (html5QrcodeScannerInstance) {
        await html5QrcodeScannerInstance.clear();
    }

    // 有効QR判定
    if (!VALID_QR_CODES.includes(decodedText)) {
        const invalidQrMsg = `このQRコードは対象外です。`;
        updateResultsDisplay(invalidQrMsg, 'warning');
        alert(invalidQrMsg);
        isProcessingScan = false;
        return;
    }

    const userEmail = getQueryParam('email');

    if (!userEmail) {
        alert("エラー: 参加者情報（メール）が取得できません。ページを更新してください。");
        isProcessingScan = false;
        return;
    }

    // データ送信
    const dataToSend = {
        email: userEmail,
        spot_id: decodedText,
        scanned_at: new Date().toISOString()
    };

    try {
        const response = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });

        if (response.ok) {
            updateResultsDisplay(`スポット「${decodedText}」を記録しました！`, 'success');
            alert(`スタンプを獲得しました！`);
        } else {
            throw new Error(`Server returned ${response.status}`);
        }
    } catch (error) {
        console.error('Webhook送信エラー:', error);
        updateResultsDisplay('記録に失敗しました。', 'error');
        alert('通信エラーが発生しました。再度お試しください。');
        isProcessingScan = false;
    }
}

function onScanFailure(error) {
    // 頻繁なエラーログを抑止
}

document.addEventListener('DOMContentLoaded', () => {
    const userEmail = getQueryParam('email');
    if (!userEmail) {
        updateResultsDisplay('エラー: メールアドレスがURLに含まれていません。', 'error');
        return;
    }

    try {
        // 設定を簡素化してAndroidのカメラ競合を回避
        html5QrcodeScannerInstance = new Html5QrcodeScanner(
            "qr-reader",
            { 
                fps: 10, 
                qrbox: 250, 
                aspectRatio: 1.0,
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] 
            },
            false
        );
        html5QrcodeScannerInstance.render(onScanSuccess, onScanFailure);
        updateResultsDisplay('QRコードをかざしてください', 'info');
    } catch (e) {
        updateResultsDisplay('カメラ起動エラー: カメラ権限を確認してください', 'error');
    }
});
