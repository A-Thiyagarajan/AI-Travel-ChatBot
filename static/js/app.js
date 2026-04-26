document.addEventListener('DOMContentLoaded', function() {
    const travelForm = document.getElementById('travelForm');
    const formSection = document.getElementById('formSection');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const generateBtn = document.getElementById('generateBtn');
    const backBtn = document.getElementById('backBtn');
    const apiBase = getApiBase();

    travelForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const destination = document.getElementById('destination').value.trim();
        const duration = document.getElementById('duration').value.trim();
        const budget = document.getElementById('budget').value;
        const interests = document.getElementById('interests').value.trim();
        const style = document.getElementById('style').value.trim();

        if (!destination || !duration || !budget) {
            showError('Please fill in all required fields: Destination, Duration, and Budget.');
            return;
        }

        if (apiBase === null) {
            showError('Backend URL is not configured. Set window.TRAVEL_API_BASE in static/js/config.js to your deployed backend URL.');
            return;
        }

        showLoading();
        generateBtn.disabled = true;

        try {
            const response = await fetch(`${apiBase}/generate-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ destination, duration, budget, interests, style })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate plan');
            }

            displayPlan(data.plan);
            formSection.style.display = 'none';
            resultSection.style.display = 'block';
            window.scrollTo(0, 0);
        } catch (error) {
            hideLoading();
            if (apiBase !== '') {
                showError(`Backend is not reachable at ${apiBase}. Check the deployed API URL. Details: ${error.message}`);
            } else {
                showError(`Error: ${error.message}`);
            }
        } finally {
            generateBtn.disabled = false;
        }
    });

    function getApiBase() {
        const configuredBase = (window.TRAVEL_API_BASE || '').trim().replace(/\/$/, '');

        if (configuredBase) {
            return configuredBase;
        }

        if (window.location.port === '5000') {
            return '';
        }

        if (['localhost', '127.0.0.1', ''].includes(window.location.hostname)) {
            return 'http://127.0.0.1:5000';
        }

        return null;
    }

    backBtn.addEventListener('click', function() {
        resultSection.style.display = 'none';
        formSection.style.display = 'block';
        travelForm.reset();
        window.scrollTo(0, 0);
    });

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        travelForm.insertBefore(errorDiv, travelForm.firstChild);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 7000);
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function displayPlan(plan) {
        hideLoading();

        const headingNames = [
            'Destination',
            'Duration',
            'Day-wise Itinerary',
            'Transport',
            'Food Recommendations',
            'Stay Suggestions',
            'Overall Transport Tips',
            'Budget Breakdown',
            'Budget Breakdown \\(in Rs\\)',
            'Travel Tips'
        ];

        const headingPattern = new RegExp(`^(${headingNames.join('|')}):?\\s*$`, 'i');
        const html = plan.split(/\r?\n/).map((rawLine) => {
            const line = rawLine.trim();
            const normalizedLine = line.replace(/^[^\w-]+/, '').trim();

            if (!line) {
                return '';
            }

            if (/^-{3,}\s*TRAVEL PLAN\s*-{3,}$/i.test(line)) {
                return '<div class="plan-title">TRAVEL PLAN</div>';
            }

            if (/^Day\s+\d+:/i.test(line)) {
                return `<h4>${escapeHtml(line)}</h4>`;
            }

            if (headingPattern.test(normalizedLine)) {
                return `<h3>${escapeHtml(line.replace(/:$/, ''))}</h3>`;
            }

            if (line.startsWith('- ')) {
                return `<p class="plan-bullet">${escapeHtml(line)}</p>`;
            }

            return `<p>${escapeHtml(line)}</p>`;
        }).join('');

        resultContent.innerHTML = html;
    }

    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
});
