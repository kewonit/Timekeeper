// Service Worker for TimeKeeper PiP Widget
// Handles background updates and notifications

const CACHE_NAME = 'timekeeper-pip-v1';
const EXAM_DATA_CACHE = 'timekeeper-exam-data-v1';

// Install service worker
self.addEventListener('install', (event) => {
    console.log('TimeKeeper PiP Service Worker installing...');
    self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
    console.log('TimeKeeper PiP Service Worker activated');
    event.waitUntil(clients.claim());
});

// Handle messages from main app
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'CACHE_EXAM_DATA':
            cacheExamData(data);
            break;
        case 'GET_CACHED_EXAM_DATA':
            getCachedExamData(event.source);
            break;
        case 'SETUP_BACKGROUND_SYNC':
            setupBackgroundSync(data);
            break;
        default:
            console.log('Unknown message type:', type);
    }
});

// Cache exam data for offline access
async function cacheExamData(examData) {
    try {
        const cache = await caches.open(EXAM_DATA_CACHE);
        await cache.put('current-exam', new Response(JSON.stringify(examData)));
        console.log('Exam data cached successfully');
    } catch (error) {
        console.error('Failed to cache exam data:', error);
    }
}

// Retrieve cached exam data
async function getCachedExamData(client) {
    try {
        const cache = await caches.open(EXAM_DATA_CACHE);
        const response = await cache.match('current-exam');

        if (response) {
            const examData = await response.json();
            client.postMessage({
                type: 'CACHED_EXAM_DATA',
                data: examData
            });
        }
    } catch (error) {
        console.error('Failed to retrieve cached exam data:', error);
    }
}

// Set up background sync for countdown updates
function setupBackgroundSync(examData) {
    // Store exam data for background updates
    self.currentExam = examData;

    // Start periodic updates
    if (self.updateInterval) {
        clearInterval(self.updateInterval);
    }

    self.updateInterval = setInterval(() => {
        updateCountdownInBackground();
    }, 1000);
}

// Update countdown in background
function updateCountdownInBackground() {
    if (!self.currentExam) return;

    const now = new Date().getTime();
    const target = new Date(self.currentExam.date).getTime();
    const distance = target - now;

    if (distance <= 0) {
        // Exam has started/passed
        notifyExamTime();
        clearInterval(self.updateInterval);
        return;
    }

    // Calculate time remaining
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Send updates to all clients
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'COUNTDOWN_UPDATE',
                data: { days, hours, minutes, seconds, examName: self.currentExam.name }
            });
        });
    });

    // Check for milestone notifications
    checkMilestoneNotifications(days, hours, minutes);
}

// Check if we should send milestone notifications
function checkMilestoneNotifications(days, hours, minutes) {
    const totalMinutes = days * 24 * 60 + hours * 60 + minutes;

    // Send notifications at specific milestones
    const milestones = [
        { time: 7 * 24 * 60, message: '7 days until exam!' },
        { time: 24 * 60, message: '24 hours until exam!' },
        { time: 60, message: '1 hour until exam!' },
        { time: 10, message: '10 minutes until exam!' }
    ];

    milestones.forEach(milestone => {
        if (totalMinutes === milestone.time) {
            showNotification(milestone.message);
        }
    });
}

// Show notification to user
function showNotification(message) {
    if ('Notification' in self && Notification.permission === 'granted') {
        self.registration.showNotification('TimeKeeper - Exam Alert', {
            body: message,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: 'exam-countdown',
            requireInteraction: true,
            actions: [
                {
                    action: 'view',
                    title: 'View Countdown'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        });
    }
}

// Notify when exam time arrives
function notifyExamTime() {
    if (self.currentExam) {
        showNotification(`${self.currentExam.name} exam is starting now!`);
    }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        // Open the exam page
        event.waitUntil(
            clients.openWindow(`/exams/${self.currentExam?.slug || ''}`)
        );
    }
});

// Handle background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'countdown-sync') {
        event.waitUntil(updateCountdownInBackground());
    }
});

// Clean up on termination
self.addEventListener('beforeunload', () => {
    if (self.updateInterval) {
        clearInterval(self.updateInterval);
    }
});
