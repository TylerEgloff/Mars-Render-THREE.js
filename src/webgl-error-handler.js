function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!context;
    } catch (e) {
        return false;
    }
}

function handleWebGLError() {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.height = '100%';
    errorDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    errorDiv.style.color = 'white';
    errorDiv.style.display = 'flex';
    errorDiv.style.flexDirection = 'column';
    errorDiv.style.justifyContent = 'center';
    errorDiv.style.alignItems = 'center';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.textAlign = 'center';

    errorDiv.innerHTML = `
        <h1>WebGL Error Detected</h1>
        <p>To fix this issue, try the following steps:</p>
        <ol>
            <li>For Firefox in particular, try disabling ANGLE:</li>
            <ul>
                <li>Go to <strong>about:config</strong></li>
                <li>Search for <strong>webgl.angle.try-d3d11</strong> and set it to <strong>false</strong>.</li>
            </ul>
            <li>Or try another browser</li>
        </ol>
    `;

    document.body.appendChild(errorDiv);
}

window.addEventListener('load', function() {
    if (!isWebGLSupported()) {
        handleWebGLError();
    }
});
