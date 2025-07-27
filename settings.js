// settings.js

document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Get the target tab content ID
            const targetTabId = button.getAttribute('data-tab') + '-tab';

            // Show the corresponding content
            const targetContent = document.getElementById(targetTabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Optionally activate the first tab by default if none are active
    // (Although the HTML sets the first one as active)
    // const firstTabBtn = document.querySelector('.tab-btn');
    // if (firstTabBtn && !document.querySelector('.tab-btn.active')) {
    //     firstTabBtn.click();
    // }
});