document.addEventListener('DOMContentLoaded', () => {
    const exitPreviewBtn = document.getElementById('exit-preview');
    const desktopModeBtn = document.getElementById('desktop-mode');
    const content = document.getElementById('content');

    exitPreviewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.close();
    });

    desktopModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        content.classList.toggle('desktop');
        const isDesktop = content.classList.contains('desktop');
        desktopModeBtn.textContent = isDesktop ? 'Mobile Mode' : 'Desktop Mode';
    });

    window.addEventListener('message', (event) => {
        if (event.data.type === 'code') {
            const { html, css, js } = event.data;
            const iframeContent = `
                <html>
                    <head>
                        <style>${css}</style>
                    </head>
                    <body>
                        ${html}
                        <script>${js}<\/script>
                    </body>
                </html>
            `;
            content.innerHTML = iframeContent;
        }
    });
});
