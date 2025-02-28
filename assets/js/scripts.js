const texts = [
    "examel text test 1",
    "examel text test 2",
    "examel text test 3"
];
let index = 0;
let charIndex = 0;
let currentText = '';
const typingElement = document.querySelector('.typing-animation .text');

function type() {
    if (charIndex < texts[index].length) {
        currentText += texts[index].charAt(charIndex);
        typingElement.textContent = currentText;
        charIndex++;
        setTimeout(type, 100);
    } else {
        setTimeout(erase, 1000);
    }
}

function erase() {
    if (charIndex > 0) {
        currentText = currentText.slice(0, -1);
        typingElement.textContent = currentText;
        charIndex--;
        setTimeout(erase, 50);
    } else {
        index = (index + 1) % texts.length;
        setTimeout(type, 500);
    }
}

type();