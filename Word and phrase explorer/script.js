let apiKey = localStorage.getItem('apiKey') || '';
let currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
let isWordMode = true; // پیش‌فرض: حالت کلمات

document.body.classList.add(currentTheme + '-theme');
updateThemeButtonText();

if (apiKey) {
    document.getElementById('apiSection').classList.add('hidden');
    document.getElementById('apiSavedSection').classList.remove('hidden');
    document.getElementById('wordSection').classList.remove('hidden');
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
    document.getElementById('wordSection').classList.remove('hidden');
    document.getElementById('apiKeyDisplay').innerText = apiKey;
}

function changeApiKey() {
    localStorage.removeItem('apiKey');
    apiKey = '';
    document.getElementById('apiSection').classList.remove('hidden');
    document.getElementById('apiSavedSection').classList.add('hidden');
    document.getElementById('wordSection').classList.add('hidden');
    document.getElementById('phraseSection').classList.add('hidden');
    document.getElementById('apiStatus').innerText = '';
    document.getElementById('apiKey').value = '';
}

function toggleMode() {
    isWordMode = !isWordMode;
    document.getElementById('toggleMode').innerText = isWordMode ? 'معانی بیت/عبارت' : 'معانی کلمات';
    if (isWordMode) {
        document.getElementById('wordSection').classList.remove('hidden');
        document.getElementById('phraseSection').classList.add('hidden');
    } else {
        document.getElementById('wordSection').classList.add('hidden');
        document.getElementById('phraseSection').classList.remove('hidden');
    }
}

function exploreWord() {
    const word = document.getElementById('wordInput').value.trim();
    if (!word) {
        alert('لطفاً یک کلمه وارد کنید!');
        return;
    }

    document.getElementById('resultMessage').classList.remove('hidden');
    document.getElementById('resultSection').classList.add('hidden');

    const prompt = `برای کلمه "${word}" در زبان فارسی، موارد زیر را ارائه دهید:
    1. سه معنی مختلف (هر کدام در یک خط جداگانه)
    2. سه متضاد (هر کدام در یک خط جداگانه)
    3. سه کلمه هم‌خانواده (هر کدام در یک خط جداگانه)
    پاسخ را به صورت زیر فرمت کنید بدون توضیح اضافی:
    معانی:
    - معنی 1
    - معنی 2
    - معنی 3
    متضادها:
    - متضاد 1
    - متضاد 2
    - متضاد 3
    هم‌خانواده:
    - هم‌خانواده 1
    - هم‌خانواده 2
    - هم‌خانواده 3`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const data = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('resultMessage').classList.add('hidden');
        const resultText = data.candidates[0].content.parts[0].text;
        displayWordResults(resultText);
    })
    .catch(error => {
        document.getElementById('resultMessage').classList.add('hidden');
        alert('مشکلی پیش آمد! کلید API را چک کنید یا بعداً امتحان کنید.');
        console.error(error);
    });
}

function explorePhrase() {
    const phrase = document.getElementById('phraseInput').value.trim();
    if (!phrase) {
        alert('لطفاً یک بیت یا عبارت وارد کنید!');
        return;
    }

    document.getElementById('phraseResultMessage').classList.remove('hidden');
    document.getElementById('phraseResultSection').classList.add('hidden');

    const prompt = `معنی "${phrase}" را به زبان فارسی ساده و روان توضیح دهید. فقط معنی را بنویسید بدون توضیح اضافی.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const data = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('phraseResultMessage').classList.add('hidden');
        const resultText = data.candidates[0].content.parts[0].text;
        displayPhraseResults(resultText);
    })
    .catch(error => {
        document.getElementById('phraseResultMessage').classList.add('hidden');
        alert('مشکلی پیش آمد! کلید API را چک کنید یا بعداً امتحان کنید.');
        console.error(error);
    });
}

function displayWordResults(text) {
    const lines = text.split('\n');
    const meanings = [];
    const antonyms = [];
    const related = [];

    let currentSection = '';
    for (const line of lines) {
        if (line === 'معانی:') currentSection = 'meanings';
        else if (line === 'متضادها:') currentSection = 'antonyms';
        else if (line === 'هم‌خانواده:') currentSection = 'related';
        else if (line.startsWith('- ') && currentSection) {
            const item = line.substring(2).trim();
            if (currentSection === 'meanings' && meanings.length < 3) meanings.push(item);
            else if (currentSection === 'antonyms' && antonyms.length < 3) antonyms.push(item);
            else if (currentSection === 'related' && related.length < 3) related.push(item);
        }
    }

    const meaningsList = document.getElementById('meanings');
    const antonymsList = document.getElementById('antonyms');
    const relatedList = document.getElementById('related');

    meaningsList.innerHTML = '';
    antonymsList.innerHTML = '';
    relatedList.innerHTML = '';

    meanings.forEach(meaning => {
        const li = document.createElement('li');
        li.innerText = meaning;
        meaningsList.appendChild(li);
    });
    antonyms.forEach(antonym => {
        const li = document.createElement('li');
        li.innerText = antonym;
        antonymsList.appendChild(li);
    });
    related.forEach(rel => {
        const li = document.createElement('li');
        li.innerText = rel;
        relatedList.appendChild(li);
    });

    document.getElementById('resultSection').classList.remove('hidden');
}

function displayPhraseResults(text) {
    document.getElementById('phraseMeaning').innerText = text.trim();
    document.getElementById('phraseResultSection').classList.remove('hidden');
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