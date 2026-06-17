/**
 * scanner.js (長府デジタルスタンプラリー用)
 */

// ★Makeで発行したWebhook URLに書き換えてください
const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/058kwaoykob9k5upnh3vlojcq68y4er8';

// ★7箇所のスポットID（A01-A04, S05-S07）
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
        alert("エラー: ユーザー情報が取得できません。ページを更新してください。");
        isProcessingScan = false;
        return;
    }

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
        updateResultsDisplay('エラー: 記録に失敗しました。', 'error');
        alert('通信エラーが発生しました。再度お試しください。');
        isProcessingScan = false;
    }
}

function onScanFailure(error) {}

document.addEventListener('DOMContentLoaded', () => {
    const userEmail = getQueryParam('email');
    if (!userEmail) {
        updateResultsDisplay('エラー: 参加者情報が不明です。', 'error');
        return;
    }

    try {
        html5QrcodeScannerInstance = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: 250, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
            false
        );
        html5QrcodeScannerInstance.render(onScanSuccess, onScanFailure);
        updateResultsDisplay('QRコードをかざしてください', 'info');
    } catch (e) {
        updateResultsDisplay('スキャナー起動エラー', 'error');
    }
});
