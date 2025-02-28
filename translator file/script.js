let apiKey = localStorage.getItem('apiKey') || '';
let currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

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
        alert('لطفاً یک فایل انتخاب کنید!');
        return;
    }

    document.getElementById('processingMessage').classList.remove('hidden');

    if (file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const text = event.target.result;
            translateText(text, file.name);
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.pdf')) {
        readPdf(file).then(text => translateText(text, file.name));
    } else if (file.name.endsWith('.docx')) {
        readDocx(file).then(text => translateText(text, file.name));
    } else {
        document.getElementById('processingMessage').classList.add('hidden');
        alert('فقط فایل‌های .txt، .pdf و .docx پشتیبانی می‌شوند!');
    }
}

async function readPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
}

async function readDocx(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

function translateText(text, originalFileName) {
    const language = document.getElementById('languageSelect').value;
    const languageNames = {
        'fa': 'Persian',
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French'
    };
    const targetLanguage = languageNames[language];

    const prompt = `Translate the following text to ${targetLanguage} and return only the translated text without any additional explanation or content:\n\n${text}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const data = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('processingMessage').classList.add('hidden');
        const translatedText = data.candidates[0].content.parts[0].text;
        downloadTranslatedFile(translatedText, originalFileName);
    })
    .catch(error => {
        document.getElementById('processingMessage').classList.add('hidden');
        alert('مشکلی پیش آمد! کلید API رو چک کن یا بعداً امتحان کن.');
        console.error(error);
    });
}

function downloadTranslatedFile(translatedText, originalFileName) {
    const blob = new Blob([translatedText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = originalFileName.replace(/\.(txt|pdf|docx)$/, '_translated.txt');
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
    document.getElementById('themeToggle').innerText = currentTheme === 'light' ? 'تم دارک' : 'تم نایت';
}

function openGuide() {
    document.getElementById('guideModal').style.display = 'flex';
}

function closeGuide() {
    document.getElementById('guideModal').style.display = 'none';
}