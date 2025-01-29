// Configuration object
const config = {
    letters: ['H', 'e', 'l', 'l', 'o'],
    boxWidth: 300,
    boxHeight: 300,
    spacing: 300,  // Space between box start positions
    letterSpacing: 30,  // Adjust this value to control space between letter and line
    minDistance: 80,
    maxMovement: 50
};

// Store references to all letter elements and lines
const elements = {
    letters: {},
    lines: []
};

// Utility function to get SVG coordinates of element's center
function getSVGCenterCoords(element) {
    const svg = document.querySelector('svg');
    const pt = svg.createSVGPoint();
    const bbox = element.getBBox();
    const matrix = element.getScreenCTM();
    
    pt.x = bbox.x + bbox.width/2;
    pt.y = bbox.y + bbox.height/2;
    
    return pt.matrixTransform(matrix).matrixTransform(svg.getScreenCTM().inverse());
}

function calculateLayout() {
    // Calculate total width including all boxes and spaces between them
    const totalWidth = config.spacing * (config.letters.length - 1) + config.boxWidth;
    
    // Center horizontally (viewport width - total width) / 2
    config.startX = (1920 - totalWidth) / 2;
    
    // Center vertically
    config.startY = (1080 - config.boxHeight) / 2;
}

function generateSVGElements() {
    const svg = document.querySelector('svg');
    svg.innerHTML = '';
    
    calculateLayout();
    
    config.letters.forEach((letter, i) => {
        // Position each box with proper spacing
        const x = config.startX + (i * config.spacing);
        
        // Add bounding box
        svg.innerHTML += `
            <rect id="bounds${i}" 
                  x="${x}" y="${config.startY}" 
                  width="${config.boxWidth}" 
                  height="${config.boxHeight}"
                  >
        `;
        
        // Add letter with index-based ID instead of letter-based
        svg.innerHTML += `
            <text id="letter${i}" 
                  x="${x + config.boxWidth/2}" 
                  y="${config.startY + config.boxHeight/2}"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  class="floating-letter">
                ${letter}
            </text>
        `;
        
        // Add connecting line (except for last letter)
        if (i < config.letters.length - 1) {
            svg.innerHTML += `
                <line id="connectingLine${i}" 
                      x1="0" y1="0" x2="0" y2="0" 
                      stroke="rgba(255,255,255,0.2)"
                      stroke-width="3"/>
            `;
        }
    });
}

function updateLines() {
    for (let i = 0; i < config.letters.length - 1; i++) {
        const currentLetter = elements.letters[i];
        const nextLetter = elements.letters[i + 1];
        const line = elements.lines[i];
        
        if (currentLetter && nextLetter && line) {
            const currentPt = getSVGCenterCoords(currentLetter);
            const nextPt = getSVGCenterCoords(nextLetter);
            
            const angle = Math.atan2(nextPt.y - currentPt.y, nextPt.x - currentPt.x);
            
            line.setAttribute('x1', currentPt.x + Math.cos(angle) * config.letterSpacing);
            line.setAttribute('y1', currentPt.y + Math.sin(angle) * config.letterSpacing);
            line.setAttribute('x2', nextPt.x - Math.cos(angle) * config.letterSpacing);
            line.setAttribute('y2', nextPt.y - Math.sin(angle) * config.letterSpacing);
        }
    }
}

function floatLetter(letter) {
    const letterIndex = elements.letters.indexOf(letter);  // Get index from elements.letters array
    const bounds = {
        x: config.startX + (letterIndex * config.spacing),
        y: config.startY,
        width: config.boxWidth,
        height: config.boxHeight
    };
    
    // Get the current transform or initialize to 0,0
    const currentTransform = letter.getAttribute('transform');
    let currentX = 0;
    let currentY = 0;
    if (currentTransform) {
        const match = currentTransform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
        if (match) {
            currentX = parseFloat(match[1]);
            currentY = parseFloat(match[2]);
        }
    }
    
    let newX = gsap.utils.random(-config.maxMovement, config.maxMovement);
    let newY = gsap.utils.random(-config.maxMovement, config.maxMovement);
    
    const letterWidth = letter.getBBox().width;
    const letterHeight = letter.getBBox().height;
    
    // Calculate the center position of the bounding box
    const centerX = bounds.x + bounds.width/2;
    const centerY = bounds.y + bounds.height/2;
    
    // Calculate the new absolute position
    const targetX = centerX + newX - letterWidth/2;
    const targetY = centerY + newY - letterHeight/2;
    
    // Constrain to bounds
    const margin = 10;
    if (targetX < bounds.x + margin) newX = bounds.x + margin - centerX + letterWidth/2;
    if (targetX + letterWidth > bounds.x + bounds.width - margin) newX = bounds.x + bounds.width - margin - centerX - letterWidth/2;
    if (targetY < bounds.y + margin) newY = bounds.y + margin - centerY + letterHeight/2;
    if (targetY + letterHeight > bounds.y + bounds.height - margin) newY = bounds.y + bounds.height - margin - centerY - letterHeight/2;

    gsap.to(letter, {
        x: newX,
        y: newY,
        duration: gsap.utils.random(2, 4),
        ease: "sine.inOut",
        onUpdate: updateLines,
        onComplete: () => floatLetter(letter)
    });
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Initialize
function init() {
    generateSVGElements();
    
    elements.letters = [];  // Change to array instead of object
    elements.lines = [];
    
    // Store references to all letters using index
    for (let i = 0; i < config.letters.length; i++) {
        elements.letters[i] = document.getElementById(`letter${i}`);
    }
    
    // Store references to all lines
    for (let i = 0; i < config.letters.length - 1; i++) {
        elements.lines.push(document.getElementById(`connectingLine${i}`));
    }
    
    // Start animation for each letter
    elements.letters.forEach(letter => {
        floatLetter(letter);
    });
    
    updateLines();
}

// Add input handler
document.getElementById('letterInput').addEventListener('input', (e) => {
    // Remove spaces and split into array
    const newLetters = e.target.value.replace(/\s+/g, '').split('');
    
    // Update config
    config.letters = newLetters;
    
    // Stop all current animations
    elements.letters.forEach(letter => {
        gsap.killTweensOf(letter);
    });
    
    // Reinitialize with new letters
    init();
});

// Set initial input value
document.getElementById('letterInput').value = config.letters.join('');

init();
