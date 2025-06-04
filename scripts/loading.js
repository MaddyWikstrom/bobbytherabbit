// Loading Screen JavaScript for Bobby Streetwear

// Remove auto-initialization - will be called manually after password entry

function initializeLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainSite = document.getElementById('main-site');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const loadingText = document.querySelector('.loading-text .glitch-text');
    const cyberCookie = document.getElementById('cyber-cookie');
    const loadingLogo = document.querySelector('.loading-logo');
    
    let progress = 0;
    const loadingSteps = [
        { text: 'INITIALIZING', duration: 800 },
        { text: 'GOBBLING COOKIES', duration: 1200 },
        { text: 'READY', duration: 500 }
    ];
    
    let currentStep = 0;
    
    // Start loading sequence
    startLoadingSequence();
    
    function startLoadingSequence() {
        // Initially hide the logo
        loadingLogo.classList.remove('visible');
        
        // Add glitch effects to logo
        addLogoGlitchEffects();
        
        // Start progress animation
        animateProgress();
        
        // Cycle through loading steps
        cycleLoadingSteps();
        
        // Start cookie morph timer
        setTimeout(() => {
            morphCookieToLogo();
        }, 1500); // Delayed to match longer loading time
    }
    
    function addLogoGlitchEffects() {
        const logo = document.querySelector('.loading-logo');
        const glitchOverlay = document.querySelector('.glitch-overlay');
        
        // Random glitch effects
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance
                logo.style.filter = 'invert(1) hue-rotate(90deg) saturate(2)';
                glitchOverlay.style.opacity = '0.8';
                
                setTimeout(() => {
                    logo.style.filter = 'invert(1)';
                    glitchOverlay.style.opacity = '0';
                }, 150);
            }
        }, 2000);
        
        // Digital distortion effect
        setInterval(() => {
            if (Math.random() < 0.2) { // 20% chance
                logo.style.transform = `scale(${0.95 + Math.random() * 0.1}) skew(${Math.random() * 2 - 1}deg)`;
                
                setTimeout(() => {
                    logo.style.transform = 'scale(1) skew(0deg)';
                }, 100);
            }
        }, 1500);
    }
    
    function animateProgress() {
        const progressInterval = setInterval(() => {
            progress += Math.random() * 3.5 + 1.5; // Random increment between 1.5-5 (slower)
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                completeLoading();
            }
            
            // Update progress bar
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.floor(progress) + '%';
            
            // Add glitch effect to progress text
            if (Math.random() < 0.1) {
                progressText.style.color = 'var(--accent-yellow)';
                progressText.style.textShadow = '0 0 10px var(--glow-yellow)';
                
                setTimeout(() => {
                    progressText.style.color = 'var(--accent-yellow)';
                    progressText.style.textShadow = '0 0 5px var(--glow-yellow)';
                }, 100);
            }
            
        }, 40 + Math.random() * 80); // Variable speed (slower for 2 sec longer duration)
    }
    
    function cycleLoadingSteps() {
        if (currentStep < loadingSteps.length) {
            const step = loadingSteps[currentStep];
            
            // Update loading text with glitch effect
            updateLoadingText(step.text);
            
            setTimeout(() => {
                currentStep++;
                cycleLoadingSteps();
            }, step.duration);
        }
    }
    
    function updateLoadingText(text) {
        loadingText.setAttribute('data-text', text);
        loadingText.textContent = text;
        
        // Add typing effect
        let displayText = '';
        let charIndex = 0;
        
        const typingInterval = setInterval(() => {
            if (charIndex < text.length) {
                displayText += text[charIndex];
                loadingText.textContent = displayText;
                charIndex++;
                
                // Random glitch during typing
                if (Math.random() < 0.1) {
                    const glitchChar = String.fromCharCode(33 + Math.random() * 94);
                    loadingText.textContent = displayText.slice(0, -1) + glitchChar;
                    
                    setTimeout(() => {
                        loadingText.textContent = displayText;
                    }, 50);
                }
            } else {
                clearInterval(typingInterval);
            }
        }, 50 + Math.random() * 50);
    }
    
    function morphCookieToLogo() {
        // Add morphing class to cookie
        cyberCookie.classList.add('morphing');
        
        // Show logo after cookie starts morphing
        setTimeout(() => {
            loadingLogo.classList.add('visible');
        }, 750);
        
        // Hide cookie completely after morph
        setTimeout(() => {
            cyberCookie.style.display = 'none';
        }, 1500);
    }
    
    function completeLoading() {
        // Final glitch effect
        performFinalGlitch();
        
        setTimeout(() => {
            // Fade out loading screen
            loadingScreen.classList.add('loading-complete');
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                mainSite.classList.remove('hidden');
                
                // Trigger entrance animations
                triggerEntranceAnimations();
                
            }, 1000);
        }, 500);
    }
    
    function performFinalGlitch() {
        const logo = document.querySelector('.loading-logo');
        const container = document.querySelector('.loading-container');
        
        // Intense glitch sequence
        let glitchCount = 0;
        const maxGlitches = 8;
        
        const glitchInterval = setInterval(() => {
            // Random transformations
            logo.style.transform = `
                scale(${0.8 + Math.random() * 0.4})
                rotate(${Math.random() * 10 - 5}deg)
                skew(${Math.random() * 4 - 2}deg)
                translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)
            `;
            
            // Random colors
            const hue = Math.random() * 360;
            logo.style.filter = `invert(1) hue-rotate(${hue}deg) saturate(${1 + Math.random()})`;
            
            // Container shake
            container.style.transform = `translate(${Math.random() * 6 - 3}px, ${Math.random() * 6 - 3}px)`;
            
            glitchCount++;
            
            if (glitchCount >= maxGlitches) {
                clearInterval(glitchInterval);
                
                // Reset to normal
                logo.style.transform = 'scale(1) rotate(0deg) skew(0deg) translate(0px, 0px)';
                logo.style.filter = 'invert(1)';
                container.style.transform = 'translate(0px, 0px)';
            }
        }, 100);
    }
    
    function triggerEntranceAnimations() {
        // Animate hero section
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                heroContent.style.transition = 'all 1s ease';
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'translateY(0)';
            }, 200);
        }
        
        // Animate navigation
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.transform = 'translateY(-100%)';
            
            setTimeout(() => {
                navbar.style.transition = 'transform 0.8s ease';
                navbar.style.transform = 'translateY(0)';
            }, 500);
        }
        
        // Staggered animation for other elements
        const animatedElements = document.querySelectorAll('.product-card, .about-content');
        animatedElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 800 + (index * 100));
        });
    }
    
    // Add particle effects during loading
    createLoadingParticles();
    
    function createLoadingParticles() {
        const particleContainer = document.querySelector('.loading-particles');
        
        // Create additional floating particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: ${Math.random() > 0.5 ? 'var(--accent-purple)' : 'var(--accent-yellow)'};
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float-particle ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                box-shadow: 0 0 10px currentColor;
            `;
            
            particleContainer.appendChild(particle);
        }
    }
    
    // Add CSS for floating particles
    const particleStyles = `
        @keyframes float-particle {
            0%, 100% {
                transform: translateY(0px) translateX(0px);
                opacity: 0.5;
            }
            25% {
                transform: translateY(-20px) translateX(10px);
                opacity: 1;
            }
            50% {
                transform: translateY(-10px) translateX(-5px);
                opacity: 0.8;
            }
            75% {
                transform: translateY(-30px) translateX(15px);
                opacity: 0.6;
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = particleStyles;
    document.head.appendChild(styleSheet);
}