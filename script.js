document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('diagnosisForm');
    const input = document.getElementById('query');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const resultSection = document.getElementById('resultSection');
    const errorNotification = document.getElementById('errorNotification');
    const errorMessage = document.getElementById('errorMessage');

    // IMPORTANT: Replace this with your actual AWS API Gateway Invoke URL once deployed.
    const AWS_API_GATEWAY_URL = 'https://xxxxxuioqxxx.execute-api.ap-south-1.amazonaws.com/diagnose';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;

        // UI Loading state
        setLoading(true);

        try {
            const response = await fetch(AWS_API_GATEWAY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                 throw new Error(`API returned status ${response.status}. Make sure the AWS API Gateway is deployed and the URL is updated in script.js.`);
            }

            const data = await response.json();
            renderResult(data);

        } catch (error) {
            console.error('Diagnostic error:', error);
            showError("Connection Failed: " + error.message + " (Have you replaced the AWS_API_GATEWAY_URL placeholder in script.js?)");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            btnText.style.display = 'none';
            loader.style.display = 'block';
            submitBtn.disabled = true;
            resultSection.classList.add('hidden');
            errorNotification.classList.add('hidden');
        } else {
            btnText.style.display = 'block';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    function renderResult(data) {
        resultSection.innerHTML = '';
        
        if (data.success && data.diagnosis) {
            resultSection.innerHTML = `
                <h2>🩺 Diagnosis Found</h2>
                <div class="result-item">
                    <h3>Issue Recognized</h3>
                    <p>${data.diagnosis.issue}</p>
                </div>
                <div class="result-item">
                    <h3>Root Cause</h3>
                    <p>${data.diagnosis.cause}</p>
                </div>
                <div class="result-item">
                    <h3>Prescribed Fix</h3>
                    <p>${data.diagnosis.fix}</p>
                </div>
            `;
        } else {
             resultSection.innerHTML = `
                <h2>🤷 No Diagnosis Found</h2>
                <p style="color: var(--text-secondary);">${data.message || 'The Cloud Doctor was unable to diagnose this issue based on the provided keywords.'}</p>
            `;
        }
        
        resultSection.classList.remove('hidden');
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorNotification.classList.remove('hidden');
    }
});
