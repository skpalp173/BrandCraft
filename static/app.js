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

        // Generate SVG Logo
        const logoContainer = document.getElementById('generatedLogoContainer');
        if (logoContainer && data.brand_names.length > 0) {
            const brandName = data.brand_names[0];
            const primaryColor = data.color_palette[0] || '#333';
            const style = document.getElementById('style').value || 'Modern';
            logoContainer.innerHTML = generateLogoSVG(brandName, style, primaryColor);
        }
    }

    function generateLogoSVG(name, style, color) {
        const initial = name.charAt(0).toUpperCase();
        const width = 400;  // Wider to handle centered text comfortably
        const height = 250; // Taller for vertical stacking

        let iconSvg = '';
        let fontFamily = 'sans-serif';
        let subText = '';

        // Centered Layout Config
        const cx = width / 2;
        const cy_icon = 80;
        const cy_text = 180;
        const cy_sub = 210;

        switch (style) {
            case 'Luxury':
                fontFamily = 'Times New Roman, serif';
                // Crown / Crest Style
                iconSvg = `
                    <g transform="translate(${cx - 30}, ${cy_icon - 30}) scale(1.5)">
                        <path d="M5 25 L15 5 L25 25 L35 5 L45 25 L45 40 L5 40 Z" fill="none" stroke="${color}" stroke-width="2"/>
                        <circle cx="5" cy="25" r="2" fill="${color}"/>
                        <circle cx="15" cy="5" r="2" fill="${color}"/>
                        <circle cx="25" cy="25" r="2" fill="${color}"/>
                        <circle cx="35" cy="5" r="2" fill="${color}"/>
                        <circle cx="45" cy="25" r="2" fill="${color}"/>
                    </g>
                `;
                subText = 'EST. 2025';
                break;

            case 'Modern':
                fontFamily = 'Inter, sans-serif';
                // Geometric Abstract
                iconSvg = `
                    <g transform="translate(${cx - 30}, ${cy_icon - 30}) scale(1.5)">
                        <rect x="10" y="10" width="40" height="40" rx="10" fill="${color}"/>
                        <path d="M20 20 L40 40 M40 20 L20 40" stroke="white" stroke-width="4" stroke-linecap="round"/>
                    </g>
                `;
                subText = 'TEHNOLOGY';
                break;

            case 'Minimal':
                fontFamily = 'Inter, sans-serif';
                // Thin Line Art
                iconSvg = `
                    <g transform="translate(${cx - 30}, ${cy_icon - 30}) scale(1.5)">
                        <circle cx="30" cy="30" r="25" stroke="${color}" stroke-width="2" fill="none"/>
                        <text x="30" y="38" text-anchor="middle" fill="${color}" font-size="20" font-family="${fontFamily}">${initial}</text>
                    </g>
                `;
                break;

            case 'Bold':
                fontFamily = 'Impact, sans-serif';
                // Strong Block
                iconSvg = `
                    <g transform="translate(${cx - 30}, ${cy_icon - 30}) scale(1.5)">
                        <path d="M10 10 H50 V30 H30 V50 H10 Z" fill="${color}"/>
                    </g>
                `;
                subText = 'GROUP';
                break;

            case 'Playful':
                fontFamily = 'Comic Sans MS, cursive';
                // Fun shape
                iconSvg = `
                     <g transform="translate(${cx - 30}, ${cy_icon - 30}) scale(1.5)">
                        <circle cx="30" cy="30" r="25" fill="${color}"/>
                        <path d="M20 35 Q30 45 40 35" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
                        <circle cx="20" cy="20" r="4" fill="white"/>
                        <circle cx="40" cy="20" r="4" fill="white"/>
                    </g>
                `;
                break;

            default:
                iconSvg = `<rect x="${cx - 25}" y="${cy_icon - 25}" width="50" height="50" fill="${color}"/>`;
        }

        const letterSpacing = style === 'Luxury' ? '4px' : '1px';
        const textTransform = style === 'Luxury' || style === 'Bold' ? 'uppercase' : 'none';
        const fontWeight = style === 'Bold' || style === 'Modern' ? '800' : '400';

        let subTextSvg = '';
        if (subText) {
            subTextSvg = `<text x="${cx}" y="${cy_sub}" text-anchor="middle" fill="${color}" font-family="${fontFamily}" font-size="14" letter-spacing="3px" style="opacity: 0.7; text-transform: uppercase;">${subText}</text>`;
        }

        return `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-height: 200px;">
            ${iconSvg}
            <text x="${cx}" y="${cy_text}" 
                  text-anchor="middle" 
                  fill="white" 
                  font-family="${fontFamily}" 
                  font-size="42" 
                  font-weight="${fontWeight}"
                  letter-spacing="${letterSpacing}"
                  style="text-transform: ${textTransform}"
            >${name}</text>
            ${subTextSvg}
        </svg>
        `;
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
