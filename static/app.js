document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('brandForm');
    const generateBtn = document.getElementById('generateBtn');
    const resultSection = document.getElementById('resultSection');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentData = null;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show Loader
        const btnText = generateBtn.querySelector('.btn-text');
        const loader = generateBtn.querySelector('.loader');
        btnText.textContent = 'Generating...';
        loader.classList.remove('hidden');
        generateBtn.disabled = true;

        // Prepare Data
        const formData = new FormData(form);
        const data = {
            idea: formData.get('idea'),
            style: formData.get('style'),
            audience: formData.get('audience')
        };

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Generation failed');

            const result = await response.json();
            currentData = result;
            renderResults(result);

            // Scroll to results
            resultSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            // Reset Button
            btnText.textContent = 'Generate Branding';
            loader.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    function renderResults(data) {
        resultSection.classList.remove('hidden');

        // Brand Names
        const namesList = document.getElementById('brandNamesList');
        namesList.innerHTML = '';
        data.brand_names.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            namesList.appendChild(li);
        });

        // Text Fields
        document.getElementById('tagline').textContent = data.tagline;
        document.getElementById('description').textContent = data.description;
        document.getElementById('targetAudienceResult').textContent = data.target_audience;
        document.getElementById('instagramBio').textContent = data.instagram_bio;
        document.getElementById('logoPrompt').textContent = data.logo_prompt;

        // Color Palette
        const paletteContainer = document.getElementById('colorPalette');
        paletteContainer.innerHTML = '';
        data.color_palette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;

            const tooltip = document.createElement('span');
            tooltip.className = 'color-code';
            tooltip.textContent = color;

            swatch.appendChild(tooltip);
            swatch.onclick = () => {
                navigator.clipboard.writeText(color);
                const originalText = tooltip.textContent;
                tooltip.textContent = 'Copied!';
                tooltip.style.opacity = '1';
                setTimeout(() => {
                    tooltip.textContent = originalText;
                    tooltip.style.opacity = '';
                }, 1500);
            };

            paletteContainer.appendChild(swatch);
        });
    }

    // Copy All
    copyBtn.addEventListener('click', () => {
        if (!currentData) return;

        const textToCopy = `
Brand Names: ${currentData.brand_names.join(', ')}
Tagline: ${currentData.tagline}
Description: ${currentData.description}
Audience: ${currentData.target_audience}
Colors: ${currentData.color_palette.join(', ')}
IG Bio: ${currentData.instagram_bio}
Logo Prompt: ${currentData.logo_prompt}
        `.trim();

        navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = 'Copy All', 2000);
        });
    });

    // Download TXT
    downloadBtn.addEventListener('click', () => {
        if (!currentData) return;

        const textToDownload = `
BrandCraft Generation
=====================
Idea: ${document.getElementById('idea').value}
Style: ${document.getElementById('style').value}

Results:
--------
Brand Names:
${currentData.brand_names.map(n => '- ' + n).join('\n')}

Tagline:
${currentData.tagline}

Description:
${currentData.description}

Target Audience:
${currentData.target_audience}

Color Palette:
${currentData.color_palette.join(', ')}

Instagram Bio:
${currentData.instagram_bio}

Logo Prompt:
${currentData.logo_prompt}
        `.trim();

        const blob = new Blob([textToDownload], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brand-identity.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    // Demo Button Logic
    const demoBtn = document.getElementById('demoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            // Scroll to form
            const genSection = document.getElementById('generator-section');
            if (genSection) {
                genSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Populate Form with Sample Data
            const ideas = [
                "A sustainable coffee shop that uses 100% recycled materials and solar power.",
                "AI-powered personal fitness trainer app for busy professionals.",
                "Handcrafted luxury leather bags made by artisans in Italy.",
                "Urban vertical farming solution for smart cities."
            ];
            const styles = ["Modern", "Minimal", "Luxury", "Bold", "Playful"];

            // Randomly select idea and style
            const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];

            // Typewriter Effect
            const ideaInput = document.getElementById('idea');
            const styleInput = document.getElementById('style');
            const audienceInput = document.getElementById('audience');

            ideaInput.value = '';
            styleInput.value = randomStyle; // Select style instantly
            if (audienceInput) audienceInput.value = "Eco-conscious millennials and Gen Z";

            let i = 0;
            const typeWriter = () => {
                if (i < randomIdea.length) {
                    ideaInput.value += randomIdea.charAt(i);
                    i++;
                    setTimeout(typeWriter, 30); // Speed of typing
                } else {
                    // After typing is done, click generate
                    setTimeout(() => {
                        if (generateBtn) generateBtn.click();
                    }, 500);
                }
            };

            typeWriter();
        });
    }
});

function copyText(elementId) {
    const text = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
}
