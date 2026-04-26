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

        showLoading();
        generateBtn.disabled = true;

        try {
            if (apiBase === null) {
                displayPlan(generateStaticPlan({ destination, duration, budget, interests, style }));
                formSection.style.display = 'none';
                resultSection.style.display = 'block';
                window.scrollTo(0, 0);
                return;
            }

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
            if (apiBase === null) {
                displayPlan(generateStaticPlan({ destination, duration, budget, interests, style }));
                formSection.style.display = 'none';
                resultSection.style.display = 'block';
                window.scrollTo(0, 0);
            } else if (apiBase !== '') {
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

    function parseDays(duration) {
        const match = duration.match(/\d+/);
        const days = match ? Number(match[0]) : 2;
        return Math.min(Math.max(days, 1), 7);
    }

    function titleCase(value) {
        return value
            .toLowerCase()
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    function getBudgetDetails(budget) {
        const normalized = budget.toLowerCase();

        if (normalized.includes('luxury') || normalized.includes('high')) {
            return {
                label: 'high',
                stay: 'Rs.6000-Rs.12000/night, premium hotel or resort',
                food: 'Rs.2000-Rs.3500/day',
                transport: 'Rs.2500-Rs.5000/day by private cab',
                activities: 'Rs.2500-Rs.6000/day',
                daily: 'Rs.13000-Rs.26000/day'
            };
        }

        if (normalized.includes('medium') || normalized.includes('moderate')) {
            return {
                label: 'medium',
                stay: 'Rs.2500-Rs.5000/night, 3-star hotel or good homestay',
                food: 'Rs.900-Rs.1800/day',
                transport: 'Rs.900-Rs.2000/day by cab, auto, or rental bike',
                activities: 'Rs.800-Rs.2000/day',
                daily: 'Rs.5000-Rs.10800/day'
            };
        }

        return {
            label: 'low',
            stay: 'Rs.700-Rs.1800/night, hostel, guesthouse, or budget stay',
            food: 'Rs.400-Rs.900/day',
            transport: 'Rs.250-Rs.700/day by bus, walk, or shared auto',
            activities: 'Rs.200-Rs.800/day',
            daily: 'Rs.1550-Rs.4200/day'
        };
    }

    function generateStaticPlan({ destination, duration, budget, interests, style }) {
        const days = parseDays(duration);
        const placeBase = titleCase(destination);
        const budgetDetails = getBudgetDetails(budget);
        const interestText = interests || 'sightseeing, local food, markets, and culture';
        const styleText = style || 'balanced';
        const dayBlocks = [];

        const morningIdeas = ['Old Town / City Center', 'Main Heritage Area', 'Popular Viewpoint', 'Famous Temple or Church', 'Museum Quarter', 'Local Market', 'Lakefront or Beach Area'];
        const afternoonIdeas = ['Signature Attraction', 'Cultural District', 'Garden or Fort Area', 'Shopping Street', 'Waterfront Promenade', 'Historic Monument', 'Art and Cafe Area'];
        const eveningIdeas = ['Food Street', 'Sunset Point', 'Night Market', 'Popular Cafe Area', 'Riverfront Walk', 'Beach Shack Area', 'Local Bazaar'];

        for (let index = 0; index < days; index += 1) {
            const dayNumber = index + 1;
            const morning = `${morningIdeas[index % morningIdeas.length]}, ${placeBase}`;
            const afternoon = `${afternoonIdeas[index % afternoonIdeas.length]}, ${placeBase}`;
            const evening = `${eveningIdeas[index % eveningIdeas.length]}, ${placeBase}`;
            const transportMode = budgetDetails.label === 'high' ? 'Private cab' : budgetDetails.label === 'medium' ? 'Cab / auto / rental bike' : 'Walk / bus / shared auto';
            const transportCost = budgetDetails.label === 'high' ? 'Rs.900-Rs.1800 total' : budgetDetails.label === 'medium' ? 'Rs.400-Rs.900 total' : 'Rs.120-Rs.350 total';

            dayBlocks.push(`Day ${dayNumber}:
- Morning:
  - Place: ${morning}
  - Activity: Start with nearby, well-known local sights focused on ${interestText}.
- Afternoon:
  - Place: ${afternoon}
  - Activity: Visit one major attraction and keep lunch nearby to reduce travel fatigue.
- Evening:
  - Place: ${evening}
  - Activity: Explore food, shopping, or a relaxed walk suited to a ${styleText} travel style.

Transport:
- Mode: ${transportMode}
- Route: ${morning} -> ${afternoon} -> ${evening}
- Time: 20-45 minutes between nearby places
- Cost: ${transportCost}`);
        }

        return `--- TRAVEL PLAN ---

Destination:
- ${placeBase}
Duration:
- ${days} days

Day-wise Itinerary:

${dayBlocks.join('\n\n')}

--------------------------------------------------

Food Recommendations:
- Local dishes: Try popular regional snacks, thali meals, sweets, seafood or vegetarian specials depending on the destination.
- Restaurants / food areas: Main market area, old city food street, popular cafe district, and highly rated local restaurants near your stay.

--------------------------------------------------

Stay Suggestions:
- Budget: ${budgetDetails.stay}
- Mid-range: Rs.2500-Rs.5000/night, 3-star hotel near central attractions
- Luxury: Rs.7000+/night, premium hotel or resort with private transport access

--------------------------------------------------

Overall Transport Tips:
- Best transport options: ${budgetDetails.label === 'high' ? 'Private cab for comfort and time saving.' : budgetDetails.label === 'medium' ? 'Use cabs for longer hops and walk between nearby places.' : 'Use public transport, walking, and shared autos.'}
- Estimated daily travel cost: ${budgetDetails.transport}

--------------------------------------------------

Budget Breakdown (in Rs):
- Stay: ${budgetDetails.stay}
- Food: ${budgetDetails.food}
- Transport: ${budgetDetails.transport}
- Activities: ${budgetDetails.activities}
- Total: ${budgetDetails.daily}; multiply by ${days} days for trip estimate

--------------------------------------------------

Travel Tips:
- Safety tips: Keep IDs, cash, and phone backup handy. Avoid isolated areas late at night.
- Best time to visit: Prefer early mornings and evenings for outdoor places.
- Things to avoid: Avoid overpacking each day, unverified guides, and long cross-city travel during peak hours.`;
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
