let apiKey = localStorage.getItem('apiKey') || '';
let currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
let timerInterval;

document.body.classList.add(currentTheme + '-theme');
updateThemeButtonText();

if (apiKey) {
    document.getElementById('apiSection').classList.add('hidden');
    document.getElementById('apiSavedSection').classList.remove('hidden');
    document.getElementById('uploadSection').classList.remove('hidden');
    document.getElementById('apiKeyDisplay').innerText = apiKey;
}

function saveApiKey() {
    apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        document.getElementById('apiStatus').innerText = 'لطفاً کلید API را وارد کنید!';
        return;
    }
    localStorage.setItem('apiKey', apiKey);
    document.getElementById('apiStatus').innerText = 'کلید ثبت شد!';
    document.getElementById('apiSection').classList.add('hidden');
    document.getElementById('apiSavedSection').classList.remove('hidden');
    document.getElementById('uploadSection').classList.remove('hidden');
    document.getElementById('apiKeyDisplay').innerText = apiKey;
}

function changeApiKey() {
    localStorage.removeItem('apiKey');
    apiKey = '';
    document.getElementById('apiSection').classList.remove('hidden');
    document.getElementById('apiSavedSection').classList.add('hidden');
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('apiStatus').innerText = '';
    document.getElementById('apiKey').value = '';
}

function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('لطفاً یک فایل زیرنویس (.srt) انتخاب کنید!');
        return;
    }

    if (!file.name.endsWith('.srt')) {
        alert('فقط فایل‌های زیرنویس با فرمت .srt پشتیبانی می‌شوند!');
        return;
    }

    document.getElementById('processingMessage').classList.remove('hidden');
    document.getElementById('timer').classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        processSrtFile(text, file.name);
    };
    reader.readAsText(file);
}

function processSrtFile(srtText, originalFileName) {
    const lines = srtText.split('\n');
    let subtitleBlocks = [];
    let currentBlock = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) {
            if (currentBlock) subtitleBlocks.push(currentBlock);
            currentBlock = null;
            continue;
        }
        if (/^\d+$/.test(line)) {
            currentBlock = { index: line, timecode: '', text: [] };
        } else if (line.includes('-->')) {
            if (currentBlock) currentBlock.timecode = line;
        } else if (currentBlock) {
            currentBlock.text.push(line);
        }
    }
    if (currentBlock) subtitleBlocks.push(currentBlock);

    console.log('تعداد بلوک‌های زیرنویس:', subtitleBlocks.length);

    const totalSeconds = Math.ceil(subtitleBlocks.length / 100) * 19;
    startTimer(totalSeconds);
    const startTime = Date.now();

    translateSrtInChunks(subtitleBlocks, originalFileName, startTime);
}

function startTimer(seconds) {
    let timeLeft = seconds;
    updateTimerDisplay(timeLeft);

    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft >= 0) {
            updateTimerDisplay(timeLeft);
        } else {
            clearInterval(timerInterval);
        }
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    document.getElementById('timer').innerText = `زمان تقریبی باقی‌مانده: ${minutes} دقیقه و ${remainingSeconds} ثانیه`;
}

async function translateSrtInChunks(subtitleBlocks, originalFileName, startTime) {
    const chunkSize = 200;
    let translatedChunks = [];
    
    for (let i = 0; i < subtitleBlocks.length; i += chunkSize) {
        const chunk = subtitleBlocks.slice(i, i + chunkSize);
        const textToTranslate = chunk.map(block => block.text.join('\n')).join('\n\n');
        console.log(`در حال ترجمه تکه ${i / chunkSize + 1} با ${chunk.length} خط`);
        const translatedText = await translateChunk(textToTranslate);
        translatedChunks.push(translatedText);
        if (i + chunkSize < subtitleBlocks.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    const finalTranslatedText = translatedChunks.join('\n\n');
    reassembleSrt(subtitleBlocks, finalTranslatedText, originalFileName, startTime);
}

function translateChunk(text) {
    const language = document.getElementById('languageSelect').value;
    const languageNames = {
        'fa': 'Persian',
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French'
    };
    const targetLanguage = languageNames[language];

    const prompt = `Translate the following subtitle text to ${targetLanguage}. Only translate the text content and do not modify or include any timestamps or numbering. Return only the translated text in the same structure:\n\n${text}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const data = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('خطا در درخواست API: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        return data.candidates[0].content.parts[0].text || '';
    })
    .catch(error => {
        console.error('خطا در ترجمه تکه:', error);
        document.getElementById('processingMessage').classList.add('hidden');
        document.getElementById('timer').classList.add('hidden');
        alert('مشکلی پیش آمد! کلید API رو چک کن یا بعداً امتحان کن.');
        throw error;
    });
}

function reassembleSrt(subtitleBlocks, translatedText, originalFileName, startTime) {
    const translatedLines = translatedText.split('\n\n').filter(line => line.trim() !== '');
    console.log('تعداد خطوط ترجمه‌شده:', translatedLines.length);
    console.log('تعداد بلوک‌های زیرنویس:', subtitleBlocks.length);

    let finalSrt = '';

    // اضافه کردن تبلیغ به اول فایل
    finalSrt += `1\n`;
    finalSrt += `00:00:00,000 --> 00:00:02,000\n`;
    finalSrt += `[ترجمه شده توسط ابزار ترجمه آنلاین AliDeveloop.ir]\n\n`;

    // اضافه کردن زیرنویس‌های ترجمه‌شده
    for (let i = 0; i < subtitleBlocks.length; i++) {
        finalSrt += `${parseInt(subtitleBlocks[i].index) + 1}\n`;
        finalSrt += `${subtitleBlocks[i].timecode}\n`;
        finalSrt += `${translatedLines[i] || 'ترجمه نشد'}\n\n`;
        if (!translatedLines[i]) {
            console.log(`خط ${i + 1} ترجمه نشد. متن اصلی:`, subtitleBlocks[i].text.join(' '));
        }
    }

    // اضافه کردن تبلیغ به آخر فایل
    const lastIndex = subtitleBlocks.length + 2;
    const lastTimecode = subtitleBlocks[subtitleBlocks.length - 1].timecode.split(' --> ')[1];
    finalSrt += `${lastIndex}\n`;
    finalSrt += `${lastTimecode} --> ${addSecondsToTimecode(lastTimecode, 2)}\n`;
    finalSrt += `[ترجمه شده توسط ابزار ترجمه آنلاین AliDeveloop.ir]\n\n`;

    downloadTranslatedFile(finalSrt, originalFileName.replace('.srt', '_Alideveloop.ir.srt'));

    const endTime = Date.now();
    const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    clearInterval(timerInterval);
    document.getElementById('processingMessage').innerText = 'فایل شما آمادست و دانلود شدش';
    document.getElementById('timer').innerText = `ترجمه در ${minutes} دقیقه و ${seconds} ثانیه انجام شد`;
}

function addSecondsToTimecode(timecode, seconds) {
    const [hours, minutes, secsAndMs] = timecode.split(':');
    const [secondsPart, milliseconds] = secsAndMs.split(',');
    let totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secondsPart) + seconds;
    const newHours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const newMinutes = Math.floor(totalSeconds / 60);
    const newSeconds = totalSeconds % 60;
    return `${pad(newHours)}:${pad(newMinutes)}:${pad(newSeconds)},${milliseconds}`;
}

function pad(number) {
    return number < 10 ? `0${number}` : number;
}

function downloadTranslatedFile(translatedText, fileName) {
    const blob = new Blob([translatedText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

function toggleTheme() {
    if (currentTheme === 'light') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        currentTheme = 'dark';
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        currentTheme = 'light';
    }
    localStorage.setItem('theme', currentTheme);
    updateThemeButtonText();
}

function updateThemeButtonText() {
    document.getElementById('themeToggle').innerText = currentTheme === 'light' ? 'تم شب' : 'تم روز';
}

function openGuide() {
    document.getElementById('guideModal').style.display = 'flex';
}

function closeGuide() {
    document.getElementById('guideModal').style.display = 'none';
}