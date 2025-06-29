// Simplified SEO optimization utilities (without analytics tracking)
export class SEOOptimizer {
    constructor() {
        this.init();
    }

    init() {
        if (typeof window !== 'undefined') {
            this.optimizePageLoad();
            this.setupDynamicSEO();
        }
    }

    optimizePageLoad() {
        // Optimize Critical Rendering Path
        this.preloadCriticalResources();
        this.optimizeImages();
        this.setupServiceWorker();
    }

    preloadCriticalResources() {
        // Preload critical fonts
        const fontUrls = [
            'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap',
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
        ];

        fontUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = url;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });

        // Preload critical images
        const criticalImages = ['/favicon.svg'];
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    optimizeImages() {
        // Lazy load images that are not critical
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }
    }

    setupDynamicSEO() {
        // Update meta tags based on user interaction
        this.updateMetaDescription();
        this.generateDynamicKeywords();
        this.updateOpenGraph();
    }

    updateMetaDescription() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/exams/')) {
            const examSlug = currentPath.split('/exams/')[1];
            if (examSlug) {
                this.updateExamPageSEO(examSlug);
            }
        }
    }

    updateExamPageSEO(examSlug) {
        // Get current countdown and update meta description
        const countdownElement = document.querySelector('.countdown-display');
        if (countdownElement) {
            const timeData = this.extractCountdownTime(countdownElement);
            if (timeData && !timeData.expired) {
                const newDescription = this.generateTimeBasedDescription(examSlug, timeData);
                this.updateMetaTag('description', newDescription);
                this.updateMetaTag('og:description', newDescription);
            }
        }
    }

    extractCountdownTime(element) {
        const numbers = element.querySelectorAll('.countdown-number');
        if (numbers.length >= 4) {
            return {
                expired: false,
                days: parseInt(numbers[0].textContent) || 0,
                hours: parseInt(numbers[1].textContent) || 0,
                minutes: parseInt(numbers[2].textContent) || 0,
                seconds: parseInt(numbers[3].textContent) || 0
            };
        }
        return null;
    }

    generateTimeBasedDescription(examSlug, timeData) {
        const examName = examSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const timeString = timeData.days > 0 ? 
            `${timeData.days} days, ${timeData.hours} hours remaining` :
            `${timeData.hours} hours, ${timeData.minutes} minutes remaining`;
        
        return `${examName} countdown timer - ${timeString}. Track exact time until exam with real-time precision. Never miss your exam date with TimeKeeper.`;
    }

    updateMetaTag(name, content) {
        let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        if (meta) {
            meta.setAttribute('content', content);
        } else {
            meta = document.createElement('meta');
            if (name.startsWith('og:')) {
                meta.setAttribute('property', name);
            } else {
                meta.setAttribute('name', name);
            }
            meta.setAttribute('content', content);
            document.head.appendChild(meta);
        }
    }

    generateDynamicKeywords() {
        const currentPath = window.location.pathname;
        const existingKeywords = document.querySelector('meta[name="keywords"]')?.content || '';
        
        // Add dynamic keywords based on current context
        const dynamicKeywords = this.getDynamicKeywords(currentPath);
        const allKeywords = [...new Set([...existingKeywords.split(', '), ...dynamicKeywords])];
        
        this.updateMetaTag('keywords', allKeywords.join(', '));
    }

    getDynamicKeywords(path) {
        const keywords = [];
        const currentTime = new Date();
        const timeOfDay = this.getTimeOfDay(currentTime);
        
        // Time-based keywords
        keywords.push(`${timeOfDay} study timer`, `${timeOfDay} exam countdown`);
        
        // Date-based keywords
        const monthName = currentTime.toLocaleString('en', { month: 'long' });
        keywords.push(`${monthName} 2026 exams`, `${monthName} exam countdown`);
        
        // Page-specific keywords
        if (path.includes('/exams/')) {
            keywords.push('live countdown', 'real time timer', 'exam date tracker');
        } else if (path === '/') {
            keywords.push('exam calendar', 'all exam dates', 'exam schedule');
        }
        
        return keywords;
    }

    getTimeOfDay(date) {
        const hour = date.getHours();
        if (hour < 6) return 'early morning';
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        if (hour < 21) return 'evening';
        return 'night';
    }

    updateOpenGraph() {
        // Update Open Graph tags for better social sharing
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.content;
        const url = window.location.href;
        
        this.updateMetaTag('og:title', title);
        this.updateMetaTag('og:description', description);
        this.updateMetaTag('og:url', url);
        this.updateMetaTag('twitter:title', title);
        this.updateMetaTag('twitter:description', description);
    }

    // Method to manually trigger SEO updates
    updatePageSEO(examData = null) {
        if (examData) {
            this.updateExamPageSEOWithData(examData);
        }
        this.updateMetaDescription();
        this.generateDynamicKeywords();
        this.updateOpenGraph();
    }

    updateExamPageSEOWithData(examData) {
        const timeRemaining = this.calculateTimeRemaining(examData.sessions?.[0]?.date);
        
        if (!timeRemaining.expired) {
            const newTitle = this.generateDynamicTitle(examData, timeRemaining);
            const newDescription = this.generateDynamicDescription(examData, timeRemaining);
            
            document.title = newTitle;
            this.updateMetaTag('description', newDescription);
            this.updateMetaTag('og:title', newTitle);
            this.updateMetaTag('og:description', newDescription);
            this.updateMetaTag('twitter:title', newTitle);
            this.updateMetaTag('twitter:description', newDescription);
        }
    }

    calculateTimeRemaining(targetDate) {
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        const distance = target - now;
        
        if (distance < 0) {
            return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        return { expired: false, days, hours, minutes, seconds };
    }

    generateDynamicTitle(examData, timeRemaining) {
        const timeString = timeRemaining.days > 0 ? 
            `${timeRemaining.days} Days ${timeRemaining.hours}h Left` :
            `${timeRemaining.hours}h ${timeRemaining.minutes}m Left`;
        
        return `${examData.name} Countdown Timer - ${timeString} | ${examData.fullName} 2026`;
    }

    generateDynamicDescription(examData, timeRemaining) {
        const timeString = `${timeRemaining.days} days, ${timeRemaining.hours} hours, ${timeRemaining.minutes} minutes remaining`;
        return `${examData.fullName} countdown timer - ${timeString}. Track exact time until ${examData.name} 2026 exam. Real-time countdown with precision timing.`;
    }
}

// Initialize SEO optimizer
export const seoOptimizer = new SEOOptimizer();

// Make it globally available
if (typeof window !== 'undefined') {
    window.seoOptimizer = seoOptimizer;
}
