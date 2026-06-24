class PoolGame {
    constructor() {
        this.canvas = document.getElementById('poolCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.balls = [];
        this.cueBall = null;
        this.pockets = [];
        this.cueAngle = 0;
        this.cuePower = 50;
        this.isAiming = false;
        this.isShooting = false;
        this.isMoving = false;
        this.aimLocked = false;
        this.currentPlayer = 'player'; // 'player' or 'ai'
        this.aiThinking = false; // Track if AI is currently thinking/aiming
        this.aiBaseAngle = 0; // Base angle AI is aiming at
        this.aiThinkStartTime = 0; // When AI started thinking (for animation)
        this.playerScore = 0;
        this.aiScore = 0;
        this.aiDifficulty = 'easy';
        this.gameRunning = false;
        this.ballPottedThisTurn = false; // Track if ball was potted this turn
        
        // DOM elements
        this.playerScoreElement = document.getElementById('playerScore');
        this.aiScoreElement = document.getElementById('aiScore');
        this.pointsScoreElement = document.getElementById('poolPointsScore');
        this.powerSlider = document.getElementById('powerSlider');
        this.powerValue = document.getElementById('powerValue');
        this.poolStartBtn = document.getElementById('poolStartBtn');
        this.poolShootBtn = document.getElementById('poolShootBtn');
        this.poolRestartBtn = document.getElementById('poolRestartBtn');
        this.poolGameOverDiv = document.getElementById('poolGameOver');
        this.poolPlayAgainBtn = document.getElementById('poolPlayAgainBtn');
        this.poolSettingsBtn = document.getElementById('poolSettingsBtn');
        this.difficultyOptions = document.querySelectorAll('.difficulty-option');
        this.settingsJustOpened = false; // Flag to prevent immediate closing
        
        // Image assets
        this.images = {
            table: null,
            cue: null,
            background: null
        };
        this.imagesLoaded = false;
        
        // Sound assets
        this.sounds = {
            cueHit: null,          // Cue stick hitting the cue ball (normal shot)
            ballHit: null,          // Ball hitting another ball (normal shot)
            breakCueHit: null,     // Cue stick hitting the cue ball (break shot)
            breakBallHit: null,    // Ball hitting another ball (break shot)
            potting: null          // Ball being potted
        };
        this.soundsLoaded = false;
        this.firstShot = true;     // Track if this is the first shot (breaking)
        this.isBreakSequence = false; // Track if we're currently in a break shot sequence
        this.collisionPairs = new Set(); // Track which ball pairs have already played collision sounds
        this.ballHitSoundPlayed = false; // Track if we've already played ball-hit sound for this shot
        
        // Spin control - click/drag on cue ball to set spin
        this.spinOffsetX = 0; // Spin offset X (-1 to 1, normalized)
        this.spinOffsetY = 0; // Spin offset Y (-1 to 1, normalized)
        this.isDraggingSpin = false;
        this.spinRotationAngle = 0; // Current rotation angle for visual spin effect
        this.initialDotAngle = 0; // Initial angle where the dot starts (top of ball)
        
        // Table image transform properties
        this.tableScale = 0.7; // Scale factor (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)
        this.tableRotationDegrees = 90; // Rotation in degrees (0 = no rotation, 90 = 90 degrees)
        this.tableX = 0; // X position offset
        this.tableY = 0; // Y position offset
        
        // Cue stick rotation offset (adjust if cue image orientation is different)
        this.cueRotationOffset = Math.PI / 2; // Math.PI/2 = 90 degrees rotation
        
        // Rail width - controls where balls bounce (the border area)
        this.railWidth = 70; // Increase to make bounce area larger, decrease to make it smaller
        
        // Center pocket scale - makes center pockets (side pockets) bigger
        this.centerPocketScale = 1.1; // 1.0 = same size as corners, 1.2 = 20% bigger, 1.5 = 50% bigger
        
        // Invisible point that all corner pocket gold rings face toward
        // Adjust this point to control where all gaps face
        // Set to null to use center of table (will be set in init() after canvas is ready)
        this.goldRingTargetPoint = null; // Will default to center of canvas in init()
        
        // Rotation offsets for gold rings (in degrees) - one for each corner pocket
        // Array order: [top-left, top-right, bottom-left, bottom-right]
        // Indices: 0=top-left, 2=top-right, 3=bottom-left, 5=bottom-right
        // Positive = clockwise rotation, negative = counterclockwise rotation
        this.goldRingRotationOffsets = [20, -20, -20, 20]; // In degrees, order: [top-left, top-right, bottom-left, bottom-right]
        
        // Invisible bounce rectangle - defines the playable area where balls can move
        // Balls will bounce off the edges of this rectangle
        // Set to null to use default (based on railWidth), or define custom bounds
        // Canvas is 600x400, so this creates a playable area with margins
        this.bounceBounds = {
            x: 27,        // Left edge - 30 pixels from left
            y: 68,        // Top edge - 30 pixels from top
            width: 532,   // Width - from x to right edge (600 - 30 - 30 = 540)
            height: 260   // Height - from y to bottom edge (400 - 30 - 30 = 340)
        };
        
        // Pocket position offsets (applied to all pockets)
        this.pocketOffsetX = 0; // X offset for all pockets
        this.pocketOffsetY = 0; // Y offset for all pockets
        
        // Custom pocket positions (set to null to use default positions, or set to false to disable auto-detection)
        // Format: Array of 6 objects with x and y properties
        // Indices: 0=top-left, 1=top-center, 2=top-right, 3=bottom-left, 4=bottom-center, 5=bottom-right
        this.customPocketPositions = null; // Set to array to override default positions
        this.autoDetectPockets = false; // Set to true to enable automatic pocket detection from image
        
        // Example manual positions:
         this.customPocketPositions = [
             {x: 27, y: 60},    // top-left
             {x: 300.8, y: 56},   // top-center
             {x: 565, y: 60},   // top-right
             {x: 27, y: 333},   // bottom-left
             {x: 300.8, y: 337},  // bottom-center
             {x: 565, y: 333}   // bottom-right
         ];
        
        this.init();
    }
    
    async init() {
        await this.loadImages();
        await this.loadSounds();
        this.initSpinControl();
        this.setupEventListeners();
        // Initialize gold ring target point to center of table if not set
        if (this.goldRingTargetPoint === null) {
            this.goldRingTargetPoint = {
                x: this.canvas.width / 2,
                y: this.canvas.height / 2
            };
        }
        // Try to detect pockets from image if enabled (can be enabled by setting autoDetectPockets = true)
        if (this.autoDetectPockets && this.customPocketPositions === null) {
            const detected = await this.detectPocketsFromImage();
            if (!detected) {
                console.log('Auto-detection failed, using default pocket positions');
            }
        }
        this.setupPockets(); // Use detected or default positions
        this.setupBalls();
        this.draw();
    }
    
    initSpinControl() {
        this.spinControlCanvas = document.getElementById('spinControlCanvas');
        if (!this.spinControlCanvas) return;
        
        this.spinControlCtx = this.spinControlCanvas.getContext('2d');
        this.drawSpinControl();
        
        // Mouse events - use window for mousemove and mouseup to track dragging outside canvas
        this.spinControlCanvas.addEventListener('mousedown', (e) => {
            this.handleSpinMouseDown(e);
        });
        
        // Use window for mousemove and mouseup to track dragging even outside canvas
        // But only when we're actually dragging
        const boundMouseMove = (e) => this.handleSpinMouseMove(e);
        const boundMouseUp = () => this.handleSpinMouseUp();
        
        // Add listeners that we can remove later
        this.spinMouseMoveHandler = boundMouseMove;
        this.spinMouseUpHandler = boundMouseUp;
        
        // Add global listeners
        window.addEventListener('mousemove', boundMouseMove);
        window.addEventListener('mouseup', boundMouseUp);
        
        // Touch events
        this.spinControlCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleSpinTouchStart(e);
        });
        this.spinControlCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleSpinTouchMove(e);
        });
        this.spinControlCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleSpinMouseUp();
        });
    }
    
    drawSpinControl() {
        if (!this.spinControlCtx) return;
        
        const canvas = this.spinControlCanvas;
        const ctx = this.spinControlCtx;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 5;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw white cue ball
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw black dot at spin position
        const dotX = centerX + this.spinOffsetX * (radius * 0.7);
        const dotY = centerY + this.spinOffsetY * (radius * 0.7);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
    }
    
    getSpinPositionFromEvent(e) {
        const canvas = this.spinControlCanvas;
        const rect = canvas.getBoundingClientRect();
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 5;
        const maxDistance = radius * 0.7;
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) {
            // Clamp to circle edge
            const angle = Math.atan2(dy, dx);
            this.spinOffsetX = Math.cos(angle) * 0.7;
            this.spinOffsetY = Math.sin(angle) * 0.7;
        } else {
            // Normalize to -1 to 1 range
            this.spinOffsetX = dx / maxDistance;
            this.spinOffsetY = dy / maxDistance;
        }
        
        this.drawSpinControl();
    }
    
    handleSpinMouseDown(e) {
        if (this.currentPlayer !== 'player' || this.isMoving || !this.gameRunning) return;
        if (!this.spinControlCanvas) return;
        
        // Check if click is on the spin control canvas
        const rect = this.spinControlCanvas.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        if (mouseX >= rect.left && mouseX <= rect.right && 
            mouseY >= rect.top && mouseY <= rect.bottom) {
            e.preventDefault();
            e.stopPropagation();
            this.isDraggingSpin = true;
            this.getSpinPositionFromEvent(e);
        }
    }
    
    handleSpinMouseMove(e) {
        if (!this.isDraggingSpin || !this.spinControlCanvas) return;
        e.preventDefault();
        this.getSpinPositionFromEvent(e);
    }
    
    handleSpinMouseUp() {
        if (this.isDraggingSpin) {
            this.isDraggingSpin = false;
        }
    }
    
    handleSpinTouchStart(e) {
        if (this.currentPlayer !== 'player' || this.isMoving || !this.gameRunning) return;
        if (!this.spinControlCanvas) return;
        this.isDraggingSpin = true;
        this.getSpinPositionFromEvent(e);
    }
    
    handleSpinTouchMove(e) {
        if (!this.isDraggingSpin) return;
        this.getSpinPositionFromEvent(e);
    }
    
    loadImages() {
        return new Promise((resolve) => {
            // Check if images are already loaded (prevent reloading)
            if (this.images.table && this.images.cue) {
                this.imagesLoaded = true;
                resolve();
                return;
            }
            
            const imagePaths = [
                { key: 'table', paths: ['assets/images/pool/table.png', 'assets/images/pool/table.jpg', 'assets/images/pool/table-background.png', 'assets/images/pool/table-background.jpg'] },
                { key: 'cue', paths: ['assets/images/pool/cue.png', 'assets/images/pool/cue.jpg', 'assets/images/pool/cue-stick.png', 'assets/images/pool/cue-stick.jpg'] },
                { key: 'background', paths: ['assets/images/pool/background.png', 'assets/images/pool/background.jpg', 'assets/images/pool/bg.png', 'assets/images/pool/bg.jpg'] }
            ];
            
            let loadedCount = 0;
            const totalImages = imagePaths.length;
            
            const tryLoadImage = (key, paths, pathIndex = 0) => {
                // Skip if image already loaded
                if (this.images[key]) {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        this.imagesLoaded = true;
                        resolve();
                    }
                    return;
                }
                
                if (pathIndex >= paths.length) {
                    // All paths failed, image will remain null
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        this.imagesLoaded = true;
                        resolve();
                    }
                    return;
                }
                
                const img = new Image();
                
                img.onload = () => {
                    // Only set if not already set (prevent overwriting)
                    if (!this.images[key]) {
                        this.images[key] = img;
                    }
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        this.imagesLoaded = true;
                        resolve();
                    }
                };
                
                img.onerror = () => {
                    // Try next path
                    tryLoadImage(key, paths, pathIndex + 1);
                };
                
                // Start loading with current path
                img.src = paths[pathIndex];
            };
            
            // Try to load each image
            imagePaths.forEach(({ key, paths }) => {
                tryLoadImage(key, paths, 0);
            });
            
            // Timeout fallback in case images take too long
            setTimeout(() => {
                if (!this.imagesLoaded) {
                    console.log('Some images failed to load, continuing without them');
                    this.imagesLoaded = true;
                    resolve();
                }
            }, 3000);
        });
    }
    
    loadSounds() {
        return new Promise((resolve) => {
            // Check if sounds are already loaded
            if (this.sounds.cueHit && this.sounds.ballHit && this.sounds.breakCueHit && this.sounds.breakBallHit && this.sounds.potting) {
                this.soundsLoaded = true;
                resolve();
                return;
            }
            
            const soundPaths = [
                { key: 'cueHit', paths: [
                    'assets/sounds/normal-cue-hit.MP3',
                    'assets/sounds/normal-cue-hit.mp3',
                    'assets/sounds/cue-hit.mp3',
                    'assets/sounds/cue-hit.wav',
                    'assets/sounds/cuehitting.mp3',
                    'assets/sounds/cue-hitting-ball.mp3',
                    'assets/sounds/cue-hitting-ball.wav',
                    'assets/sounds/cue.mp3'
                ]},
                { key: 'ballHit', paths: [
                    'assets/sounds/normal-ball-hit.MP3',
                    'assets/sounds/normal-ball-hit.mp3',
                    'assets/sounds/ball-hit.mp3',
                    'assets/sounds/ball-hit.wav',
                    'assets/sounds/ballhitting.mp3',
                    'assets/sounds/ball-hitting-ball.mp3',
                    'assets/sounds/ball-hitting-ball.wav',
                    'assets/sounds/collision.mp3'
                ]},
                { key: 'breakCueHit', paths: [
                    'assets/sounds/break-cue-hitting-ball.MP3',
                    'assets/sounds/break-cue-hitting-ball.mp3',
                    'assets/sounds/break-cue-hit.mp3',
                    'assets/sounds/breakcuehit.mp3',
                    'assets/sounds/breaking-cue.mp3',
                    'assets/sounds/break.mp3'
                ]},
                { key: 'breakBallHit', paths: [
                    'assets/sounds/break-ball-hitting-ball.MP3',
                    'assets/sounds/break-ball-hitting-ball.mp3',
                    'assets/sounds/break-ball-hit.mp3',
                    'assets/sounds/breakballhit.mp3',
                    'assets/sounds/breaking-ball-hit.mp3'
                ]},
                { key: 'potting', paths: [
                    'assets/sounds/potting.MP3',
                    'assets/sounds/potting.mp3',
                    'assets/sounds/pot.mp3',
                    'assets/sounds/pocket.mp3'
                ]}
            ];
            
            let loadedCount = 0;
            const totalSounds = soundPaths.length;
            
            const tryLoadSound = (key, paths, pathIndex = 0) => {
                // Skip if sound already loaded
                if (this.sounds[key]) {
                    loadedCount++;
                    if (loadedCount === totalSounds) {
                        this.soundsLoaded = true;
                        resolve();
                    }
                    return;
                }
                
                // If we've tried all paths, mark as failed and continue
                if (pathIndex >= paths.length) {
                    console.log(`Sound ${key} not found, continuing without it`);
                    loadedCount++;
                    if (loadedCount === totalSounds) {
                        this.soundsLoaded = true;
                        resolve();
                    }
                    return;
                }
                
                const audio = new Audio();
                let soundResolved = false;

                const markLoaded = () => {
                    if (soundResolved) return;
                    soundResolved = true;
                    if (!this.sounds[key]) {
                        this.sounds[key] = audio;
                    }
                    loadedCount++;
                    if (loadedCount === totalSounds) {
                        this.soundsLoaded = true;
                        resolve();
                    }
                };
                
                audio.oncanplaythrough = markLoaded;
                audio.oncanplay = markLoaded;
                
                audio.onerror = () => {
                    if (soundResolved) return;
                    // Try next path
                    tryLoadSound(key, paths, pathIndex + 1);
                };
                
                // Start loading with current path
                audio.src = paths[pathIndex];
                audio.load();
            };
            
            // Try to load each sound
            soundPaths.forEach(({ key, paths }) => {
                tryLoadSound(key, paths, 0);
            });
            
            // Timeout fallback
            setTimeout(() => {
                if (!this.soundsLoaded) {
                    console.log('Some sounds failed to load, continuing without them');
                    this.soundsLoaded = true;
                    resolve();
                }
            }, 3000);
        });
    }
    
    playSound(soundName, volume = 0.5) {
        const sound = this.sounds[soundName];
        if (sound) {
            // Clone the audio to allow overlapping sounds
            const audioClone = sound.cloneNode();
            audioClone.volume = volume;
            audioClone.play().catch(err => {
                // Ignore errors (e.g., user hasn't interacted with page yet)
                console.log('Could not play sound:', err);
            });
        }
    }
    
    setupEventListeners() {
        this.poolStartBtn.addEventListener('click', () => this.startGame());
        this.poolShootBtn.addEventListener('click', () => this.shoot());
        this.poolRestartBtn.addEventListener('click', () => this.restartGame());
        this.poolPlayAgainBtn.addEventListener('click', () => this.restartGame());
        this.powerSlider.addEventListener('input', (e) => {
            this.cuePower = parseInt(e.target.value);
            this.powerValue.textContent = this.cuePower;
        });
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        this.difficultyOptions.forEach(option => {
            option.addEventListener('click', () => this.selectDifficulty(option.dataset.difficulty));
        });
        
        // Theme options (shared with snake game)
        const allThemeOptions = document.querySelectorAll('.theme-option');
        allThemeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const normalized = saveTheme(option.dataset.theme);
                applyTheme(normalized);
            });
        });
        
        this.loadDifficulty();
        this.loadTheme();
    }
    
    async detectPocketsFromImage() {
        if (!this.images.table) return false;
        
        try {
            // Create a temporary canvas to analyze the image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Draw the table image scaled to canvas size
            tempCtx.drawImage(this.images.table, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // Get image data
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            // Find dark spots (pockets are black/dark)
            // Lower threshold to catch very dark pixels
            const darkThreshold = 80; // Pixels darker than this are considered "black"
            const minPocketSize = 50; // Minimum number of dark pixels to be considered a pocket
            const maxPocketSize = 5000; // Maximum size to filter out large dark areas
            
            const darkRegions = [];
            const visited = new Set();
            
            // Scan for dark regions - check every pixel for better accuracy
            for (let y = 0; y < tempCanvas.height; y += 1) {
                for (let x = 0; x < tempCanvas.width; x += 1) {
                    const index = (y * tempCanvas.width + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const brightness = (r + g + b) / 3;
                    
                    const key = `${x},${y}`;
                    // Check for very dark pixels (black pockets)
                    if (brightness < darkThreshold && !visited.has(key)) {
                        // Found a dark pixel, flood fill to find the region
                        const region = this.floodFillDarkRegion(
                            data, tempCanvas.width, tempCanvas.height, 
                            x, y, darkThreshold, visited
                        );
                        
                        // Filter by size - pockets should be medium-sized dark regions
                        if (region.pixels.length >= minPocketSize && region.pixels.length <= maxPocketSize) {
                            // Calculate center of the region
                            let sumX = 0, sumY = 0;
                            region.pixels.forEach(p => {
                                sumX += p.x;
                                sumY += p.y;
                            });
                            darkRegions.push({
                                x: Math.round(sumX / region.pixels.length),
                                y: Math.round(sumY / region.pixels.length),
                                size: region.pixels.length
                            });
                        }
                    }
                }
            }
            
            // Sort by size and take the 6 largest (should be the 6 pockets)
            darkRegions.sort((a, b) => b.size - a.size);
            
            console.log(`Detected ${darkRegions.length} dark regions, taking top 6`);
            
            if (darkRegions.length >= 6) {
                // Take the 6 largest dark regions
                const detectedPockets = darkRegions.slice(0, 6).map(region => ({
                    x: region.x,
                    y: region.y
                }));
                
                // Sort pockets: top row first (smaller y), then bottom row
                detectedPockets.sort((a, b) => {
                    const yDiff = Math.abs(a.y - b.y);
                    if (yDiff < 50) {
                        // Same row (within 50 pixels), sort by x
                        return a.x - b.x;
                    }
                    return a.y - b.y;
                });
                
                console.log('Detected pockets:', detectedPockets);
                
                // Store detected pockets
                this.customPocketPositions = detectedPockets;
                return true;
            } else {
                console.warn(`Only found ${darkRegions.length} dark regions, need 6 for pockets`);
            }
        } catch (error) {
            console.warn('Failed to detect pockets from image:', error);
        }
        
        return false;
    }
    
    floodFillDarkRegion(data, width, height, startX, startY, threshold, visited) {
        const pixels = [];
        const stack = [{x: startX, y: startY}];
        const maxIterations = 10000; // Increased limit for larger regions
        let iterations = 0;
        
        while (stack.length > 0 && iterations < maxIterations) {
            iterations++;
            const {x, y} = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const brightness = (r + g + b) / 3;
            
            if (brightness < threshold) {
                visited.add(key);
                pixels.push({x, y});
                
                // Add neighbors to stack (4-directional)
                stack.push({x: x + 1, y});
                stack.push({x: x - 1, y});
                stack.push({x, y: y + 1});
                stack.push({x, y: y - 1});
            }
        }
        
        return {pixels};
    }
    
    setupPockets() {
        // If custom positions are set, use those
        if (this.customPocketPositions && Array.isArray(this.customPocketPositions) && this.customPocketPositions.length === 6) {
            this.pockets = this.customPocketPositions.map(pos => ({
                x: pos.x || pos[0] || 0,
                y: pos.y || pos[1] || 0
            }));
            return;
        }
        
        // Otherwise use default positions with offsets
        const pocketRadius = 15;
        const railWidth = 30;
        const margin = railWidth;
        this.pockets = [
            { x: margin + this.pocketOffsetX, y: margin + this.pocketOffsetY },
            { x: this.canvas.width / 2 + this.pocketOffsetX, y: margin + this.pocketOffsetY },
            { x: this.canvas.width - margin + this.pocketOffsetX, y: margin + this.pocketOffsetY },
            { x: margin + this.pocketOffsetX, y: this.canvas.height - margin + this.pocketOffsetY },
            { x: this.canvas.width / 2 + this.pocketOffsetX, y: this.canvas.height - margin + this.pocketOffsetY },
            { x: this.canvas.width - margin + this.pocketOffsetX, y: this.canvas.height - margin + this.pocketOffsetY }
        ];
    }
    
    setupBalls() {
        this.balls = [];
        const ballRadius = 10;
        const railWidth = 30;
        const margin = railWidth + 10;
        
        // Rack of balls on the left side
        const rackX = margin + 40;
        const rackY = this.canvas.height / 2;
        
        // Cue ball (white) on the right side
        this.cueBall = {
            x: this.canvas.width * 0.7,
            y: this.canvas.height / 2,
            vx: 0,
            vy: 0,
            radius: ballRadius,
            color: '#ffffff',
            number: 0,
            type: 'cue',
            spinX: 0,  // Spin on X axis (-1 to 1)
            spinY: 0   // Spin on Y axis (-1 to 1)
        };
        this.balls.push(this.cueBall);
        
        // Rack of balls in proper 8-ball triangle formation
        // Arrangement: 1 at apex, 8 in center, with specific ball order (reversed)
        const rackPattern = [
            [15, 14, 13, 12, 11],    // Row 1: base row
            [10, 9, 7, 6],          // Row 2
            [5, 8, 4],              // Row 3: 8-ball in center
            [3, 2],                 // Row 4
            [1]                     // Row 5: 1-ball at apex
        ];
        
        for (let row = 0; row < rackPattern.length; row++) {
            const rowBalls = rackPattern[row];
            // Center the row vertically
            const rowHeight = (rowBalls.length - 1) * ballRadius * 2.1;
            const rowStartY = rackY - (rowHeight / 2);
            
            for (let col = 0; col < rowBalls.length; col++) {
                const number = rowBalls[col];
                const x = rackX + (row * ballRadius * 2.1);
                const y = rowStartY + (col * ballRadius * 2.1);
                
                // Assign ball types: 1-7 and 9-15 score points, 8 ends the game
                const type = number === 8 ? 'special' : 'point';
                
                this.balls.push({
                    x: x,
                    y: y,
                    vx: 0,
                    vy: 0,
                    radius: ballRadius,
                    color: this.getBallColor(number),
                    number: number,
                    type: type,
                    pocketed: false,
                    spinX: 0,  // Spin on X axis (-1 to 1)
                    spinY: 0   // Spin on Y axis (-1 to 1)
                });
            }
        }
    }
    
    getBallColor(number) {
        const colors = {
            0: '#ffffff', // Cue ball (white)
            1: '#ff0000', // Red
            2: '#0000ff', // Blue
            3: '#ffa500', // Orange
            4: '#800080', // Purple
            5: '#ffa500', // Orange
            6: '#008000', // Green
            7: '#ff0000', // Red
            8: '#000000', // Black
            9: '#ffff00', // Yellow
            10: '#0000ff', // Blue
            11: '#ff0000', // Red
            12: '#800080', // Purple
            13: '#ff0000', // Red
            14: '#008000', // Green
            15: '#0000ff'  // Blue
        };
        return colors[number] || '#cccccc';
    }
    
    handleMouseMove(e) {
        if (!this.gameRunning || this.isMoving || this.currentPlayer !== 'player') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // If dragging spin on cue ball
        if (this.isDraggingSpin && this.aimLocked) {
            const dx = mouseX - this.cueBall.x;
            const dy = mouseY - this.cueBall.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = this.cueBall.radius * 0.7; // Limit to 70% of radius
            
            if (distance > maxDistance) {
                // Clamp to circle edge
                const angle = Math.atan2(dy, dx);
                this.spinOffsetX = Math.cos(angle) * 0.7;
                this.spinOffsetY = Math.sin(angle) * 0.7;
            } else {
                // Normalize to -1 to 1 range
                this.spinOffsetX = dx / maxDistance;
                this.spinOffsetY = dy / maxDistance;
            }
            this.draw();
        } else if (!this.aimLocked) {
            // Normal aiming
            const dx = mouseX - this.cueBall.x;
            const dy = mouseY - this.cueBall.y;
            this.cueAngle = Math.atan2(dy, dx);
            this.draw();
        }
    }
    
    handleClick(e) {
        if (!this.gameRunning || this.isMoving || this.currentPlayer !== 'player') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Check if clicking on cue ball (when aim is locked, allow setting spin)
        const dx = mouseX - this.cueBall.x;
        const dy = mouseY - this.cueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.aimLocked && distance <= this.cueBall.radius) {
            // Clicking on cue ball to set spin
            const maxDistance = this.cueBall.radius * 0.7;
            if (distance > maxDistance) {
                // Clamp to circle edge
                const angle = Math.atan2(dy, dx);
                this.spinOffsetX = Math.cos(angle) * 0.7;
                this.spinOffsetY = Math.sin(angle) * 0.7;
            } else {
                // Normalize to -1 to 1 range
                this.spinOffsetX = dx / maxDistance;
                this.spinOffsetY = dy / maxDistance;
            }
            this.isDraggingSpin = true;
            this.draw();
        } else {
            // Lock aim to clicked position
            this.cueAngle = Math.atan2(dy, dx);
            this.aimLocked = true;
            this.draw();
        }
    }
    
    handleMouseUp() {
        this.isDraggingSpin = false;
    }
    
    startGame() {
        this.gameRunning = true;
        this.poolStartBtn.disabled = true;
        this.poolShootBtn.disabled = false;
        this.poolRestartBtn.disabled = false;
        this.currentPlayer = 'player';
        this.firstShot = true; // Reset first shot flag
        this.isBreakSequence = false; // Reset break sequence flag
        this.collisionPairs = new Set(); // Reset collision tracking
        this.ballHitSoundPlayed = false; // Reset ball-hit sound flag
        // Reset spin control
        this.spinOffsetX = 0;
        this.spinOffsetY = 0;
        this.drawSpinControl();
        this.gameLoop();
    }
    
    shoot() {
        if (this.isMoving || !this.gameRunning) return;
        if (this.currentPlayer === 'player' && !this.aimLocked) return; // Player must lock aim first
        
        this.ballPottedThisTurn = false; // Reset at start of shot
        this.ballHitSoundPlayed = false; // Reset ball-hit sound flag for new shot
        
        // Play appropriate cue hitting ball sound based on whether it's the break or normal shot
        if (this.firstShot) {
            this.playSound('breakCueHit', 0.6);
            this.isBreakSequence = true; // Mark that we're in a break sequence
        } else {
            this.playSound('cueHit', 0.5);
            this.isBreakSequence = false; // Ensure break sequence is false for normal shots
        }
        
        const power = this.cuePower / 100 * 15;
        this.cueBall.vx = Math.cos(this.cueAngle) * power;
        this.cueBall.vy = Math.sin(this.cueAngle) * power;
        
        // Apply spin to cue ball
        this.cueBall.spinX = this.spinOffsetX;
        this.cueBall.spinY = this.spinOffsetY;
        
        // Don't reset spin rotation angle - let it continue from where it is
        
        // Reset spin control after applying
        this.spinOffsetX = 0;
        this.spinOffsetY = 0;
        this.drawSpinControl();
        
        this.isMoving = true;
        this.aimLocked = false;
        
        // Mark that first shot has been taken
        if (this.firstShot) {
            this.firstShot = false;
        }
        
        if (this.currentPlayer === 'player') {
            this.poolShootBtn.disabled = true;
        }
    }
    
    update() {
        if (!this.gameRunning || !this.isMoving) return;
        
        let allStopped = true;
        
        // Update ball positions
        this.balls.forEach(ball => {
            // Skip pocketed balls completely - don't update them at all
            if (ball.pocketed) return;
            
            // Get bounce bounds - use custom rectangle or default based on railWidth
            let bounds;
            if (this.bounceBounds) {
                bounds = {
                    left: this.bounceBounds.x,
                    right: this.bounceBounds.x + this.bounceBounds.width,
                    top: this.bounceBounds.y,
                    bottom: this.bounceBounds.y + this.bounceBounds.height
                };
            } else {
                // Default bounds based on railWidth
                bounds = {
                    left: this.railWidth,
                    right: this.canvas.width - this.railWidth,
                    top: this.railWidth,
                    bottom: this.canvas.height - this.railWidth
                };
            }
            
            // Check for wall collisions BEFORE moving to prevent going through walls
            const nextX = ball.x + ball.vx;
            const nextY = ball.y + ball.vy;
            
            // FIRST: Check pocket collisions BEFORE wall collisions
            // This allows balls to go into pockets even if they're near the bounce bounds
            let ballPocketed = false;
            for (let i = 0; i < this.pockets.length; i++) {
                const pocket = this.pockets[i];
                const dx = nextX - pocket.x;
                const dy = nextY - pocket.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Check if ball will be close enough to pocket
                if (dist < 25) {
                    ball.pocketed = true;
                    ballPocketed = true;
                    // Stop ball movement immediately when pocketed
                    ball.vx = 0;
                    ball.vy = 0;
                    this.handleBallPocketed(ball);
                    break; // Exit loop once pocketed
                }
            }
            
            // If ball was pocketed, skip wall collision checks and movement
            if (ballPocketed || ball.pocketed) {
                return;
            }
            
            // Check if ball is near any pocket AND moving toward it
            // Only allow passing through bounds if actually approaching a pocket
            let isApproachingPocket = false;
            this.pockets.forEach(pocket => {
                const currentDist = Math.sqrt(
                    Math.pow(ball.x - pocket.x, 2) + 
                    Math.pow(ball.y - pocket.y, 2)
                );
                const nextDist = Math.sqrt(
                    Math.pow(nextX - pocket.x, 2) + 
                    Math.pow(nextY - pocket.y, 2)
                );
                // Only allow if: near pocket (< 50px) AND getting closer to it
                if (currentDist < 50 && nextDist < currentDist) {
                    isApproachingPocket = true;
                }
            });
            
            // Check horizontal walls (left and right) - but allow if approaching pocket
            if (!isApproachingPocket) {
                // Check left wall
                if (nextX - ball.radius < bounds.left) {
                    // Hit left wall - reverse velocity and clamp position
                    ball.vx *= -0.8; // Bounce with some energy loss
                    // Apply spin effect (sidespin affects vertical velocity after bounce)
                    if (ball.spinX !== undefined && ball.spinY !== undefined) {
                        ball.vy += ball.spinX * 0.3; // Sidespin affects vertical movement
                        ball.spinX *= -0.5; // Reverse and reduce spin after bounce
                    }
                    // Position ball exactly at the wall boundary
                    ball.x = bounds.left + ball.radius;
                } 
                // Check right wall
                else if (nextX + ball.radius > bounds.right) {
                    // Hit right wall - reverse velocity and clamp position
                    ball.vx *= -0.8; // Bounce with some energy loss
                    // Apply spin effect (sidespin affects vertical velocity after bounce)
                    if (ball.spinX !== undefined && ball.spinY !== undefined) {
                        ball.vy += ball.spinX * 0.3; // Sidespin affects vertical movement
                        ball.spinX *= -0.5; // Reverse and reduce spin after bounce
                    }
                    // Position ball exactly at the wall boundary
                    ball.x = bounds.right - ball.radius;
                } 
                else {
                    ball.x = nextX; // Safe to move
                }
            } else {
                // Approaching pocket - allow movement but still check if it goes too far
                if (nextX - ball.radius < bounds.left - 20) {
                    // Too far outside, bounce back
                    ball.vx *= -0.8;
                    ball.x = bounds.left + ball.radius;
                } else if (nextX + ball.radius > bounds.right + 20) {
                    // Too far outside, bounce back
                    ball.vx *= -0.8;
                    ball.x = bounds.right - ball.radius;
                } else {
                    ball.x = nextX; // Allow movement when approaching pocket
                }
            }
            
            // Check vertical walls (top and bottom) - but allow if approaching pocket
            if (!isApproachingPocket) {
                // Check top wall
                if (nextY - ball.radius < bounds.top) {
                    // Hit top wall - reverse velocity and clamp position
                    ball.vy *= -0.8; // Bounce with some energy loss
                    // Position ball exactly at the wall boundary
                    ball.y = bounds.top + ball.radius;
                } 
                // Check bottom wall
                else if (nextY + ball.radius > bounds.bottom) {
                    // Hit bottom wall - reverse velocity and clamp position
                    ball.vy *= -0.8; // Bounce with some energy loss
                    // Position ball exactly at the wall boundary
                    ball.y = bounds.bottom - ball.radius;
                } 
                else {
                    ball.y = nextY; // Safe to move
                }
            } else {
                // Approaching pocket - allow movement but still check if it goes too far
                if (nextY - ball.radius < bounds.top - 20) {
                    // Too far outside, bounce back
                    ball.vy *= -0.8;
                    ball.y = bounds.top + ball.radius;
                } else if (nextY + ball.radius > bounds.bottom + 20) {
                    // Too far outside, bounce back
                    ball.vy *= -0.8;
                    ball.y = bounds.bottom - ball.radius;
                } else {
                    ball.y = nextY; // Allow movement when approaching pocket
                }
            }
            
            // Safety check: Ensure ball is never inside the bounds (fix any glitches)
            if (ball.x - ball.radius < bounds.left) {
                ball.x = bounds.left + ball.radius;
                ball.vx = Math.abs(ball.vx); // Ensure moving away from wall
            }
            if (ball.x + ball.radius > bounds.right) {
                ball.x = bounds.right - ball.radius;
                ball.vx = -Math.abs(ball.vx); // Ensure moving away from wall
            }
            if (ball.y - ball.radius < bounds.top) {
                ball.y = bounds.top + ball.radius;
                ball.vy = Math.abs(ball.vy); // Ensure moving away from wall
            }
            if (ball.y + ball.radius > bounds.bottom) {
                ball.y = bounds.bottom - ball.radius;
                ball.vy = -Math.abs(ball.vy); // Ensure moving away from wall
            }
            
            // Friction
            ball.vx *= 0.98;
            ball.vy *= 0.98;
            
            // Spin decay (friction reduces spin over time)
            if (ball.spinX !== undefined) {
                ball.spinX *= 0.95;
                if (Math.abs(ball.spinX) < 0.01) ball.spinX = 0;
            }
            if (ball.spinY !== undefined) {
                ball.spinY *= 0.95;
                if (Math.abs(ball.spinY) < 0.01) ball.spinY = 0;
            }
            
            // Stop very slow balls
            if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
            if (Math.abs(ball.vy) < 0.1) ball.vy = 0;
            
            if (ball.vx !== 0 || ball.vy !== 0) allStopped = false;
        });
        
        // Ball-to-ball collisions
        // Clear collision pairs at start of each frame - we'll rebuild it
        const newCollisionPairs = new Set();
        
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const ball1 = this.balls[i];
                const ball2 = this.balls[j];
                
                if (ball1.pocketed || ball2.pocketed) continue;
                
                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < ball1.radius + ball2.radius) {
                    // Create a unique key for this ball pair
                    const pairKey = `${Math.min(i, j)}-${Math.max(i, j)}`;
                    newCollisionPairs.add(pairKey);
                    
                    // Only play sound if this is a new collision (balls weren't colliding last frame)
                    if (!this.collisionPairs.has(pairKey)) {
                        // Check if cue ball is involved in the collision
                        const isCueBallCollision = (ball1.type === 'cue' || ball2.type === 'cue');
                        
                        // Only play ball-hit sound once per shot (when cue ball hits another ball)
                        if (isCueBallCollision && !this.ballHitSoundPlayed) {
                            // Play appropriate ball hitting ball sound
                            // If it's the break sequence and cue ball is involved, play break sound
                            // Otherwise play normal sound
                            const relativeSpeed = Math.sqrt(
                                Math.pow(ball1.vx - ball2.vx, 2) + 
                                Math.pow(ball1.vy - ball2.vy, 2)
                            );
                            const volume = Math.min(0.6, Math.max(0.2, relativeSpeed / 20));
                            
                            if (this.isBreakSequence) {
                                // Break: cue ball hitting other balls
                                this.playSound('breakBallHit', volume);
                            } else {
                                // Normal: cue ball hitting other balls
                                this.playSound('ballHit', volume);
                            }
                            
                            // Mark that we've played the sound for this shot
                            this.ballHitSoundPlayed = true;
                        }
                    }
                    
                    // Collision response
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
                    
                    // Rotate velocities
                    const vx1 = ball1.vx * cos + ball1.vy * sin;
                    const vy1 = ball1.vy * cos - ball1.vx * sin;
                    const vx2 = ball2.vx * cos + ball2.vy * sin;
                    const vy2 = ball2.vy * cos - ball2.vx * sin;
                    
                    // Swap velocities
                    const finalVx1 = vx2;
                    const finalVx2 = vx1;
                    
                    // Rotate back
                    ball1.vx = finalVx1 * cos - vy1 * sin;
                    ball1.vy = vy1 * cos + finalVx1 * sin;
                    ball2.vx = finalVx2 * cos - vy2 * sin;
                    ball2.vy = vy2 * cos + finalVx2 * sin;
                    
                    // Separate balls
                    const overlap = ball1.radius + ball2.radius - dist;
                    ball1.x -= overlap * cos * 0.5;
                    ball1.y -= overlap * sin * 0.5;
                    ball2.x += overlap * cos * 0.5;
                    ball2.y += overlap * sin * 0.5;
                }
            }
        }
        
        // Update collision pairs for next frame
        this.collisionPairs = newCollisionPairs;
        
        if (allStopped && this.isMoving) {
            this.isMoving = false;
            this.isBreakSequence = false; // Break sequence ends when all balls stop
            if (!this.gameRunning) return; // Don't switch if game ended
            
            // If a ball was potted, current player gets another shot
            if (this.ballPottedThisTurn) {
                if (this.currentPlayer === 'player') {
                    // Player gets another shot
                    this.aimLocked = false;
                    this.poolShootBtn.disabled = false;
                } else {
                    // AI gets another shot
                    setTimeout(() => {
                        if (this.gameRunning && this.currentPlayer === 'ai' && !this.isMoving) {
                            this.aiTurn();
                        }
                    }, 1000);
                }
            } else {
                // No ball potted, switch turns
                if (this.currentPlayer === 'player') {
                    // Switch to AI
                    this.currentPlayer = 'ai';
                    this.poolShootBtn.disabled = true;
                    setTimeout(() => {
                        if (this.gameRunning && this.currentPlayer === 'ai') {
                            this.aiTurn();
                        }
                    }, 1000);
                } else {
                    // Switch to player
                    this.currentPlayer = 'player';
                    this.aimLocked = false;
                    this.ballPottedThisTurn = false;
                    this.aiThinking = false;
                    this.poolShootBtn.disabled = false;
                }
            }
        }
    }
    
    handleBallPocketed(ball) {
        // Play potting sound when any ball is pocketed (including cue ball)
        this.playSound('potting', 0.5);
        
        if (ball.type === 'cue' && ball.number === 0) {
            // Cue ball pocketed - reset position
            ball.pocketed = false;
            ball.x = this.canvas.width * 0.7;
            ball.y = this.canvas.height / 2;
            ball.vx = 0;
            ball.vy = 0;
            ball.spinX = 0;
            ball.spinY = 0;
            // Switch turns
            if (!this.gameRunning) return;
            if (this.currentPlayer === 'player') {
                this.currentPlayer = 'ai';
                this.poolShootBtn.disabled = true;
                setTimeout(() => {
                    if (this.gameRunning && this.currentPlayer === 'ai') {
                        this.aiTurn();
                    }
                }, 1000);
            } else {
                this.currentPlayer = 'player';
                this.aimLocked = false;
                this.aiThinking = false;
                this.poolShootBtn.disabled = false;
            }
            return;
        }
        
        if (ball.type === 'point') {
            if (this.currentPlayer === 'player') {
                this.playerScore += 1;
                this.ballPottedThisTurn = true;
            } else {
                this.aiScore += 1;
                this.ballPottedThisTurn = true;
            }
        } else if (ball.type === 'special' && ball.number === 8) {
            // 8-ball - game ends
            if (this.currentPlayer === 'player') {
                this.endGame('You Win! You pocketed the 8-ball!');
            } else {
                this.endGame('AI Wins! AI pocketed the 8-ball!');
            }
            return;
        }
        
        this.updateScore();
        this.checkGameOver();
    }
    
    aiTurn() {
        if (!this.gameRunning || this.currentPlayer !== 'ai') return;
        
        // AI difficulty affects accuracy and strategy
        const accuracy = this.aiDifficulty === 'easy' ? 0.6 : (this.aiDifficulty === 'medium' ? 0.8 : 0.98);
        const powerMultiplier = this.aiDifficulty === 'easy' ? 0.7 : (this.aiDifficulty === 'medium' ? 0.85 : 1.0);
        
        // On hard mode, use advanced shot selection
        if (this.aiDifficulty === 'hard') {
            const bestShot = this.findBestShot();
            if (bestShot) {
                this.aiBaseAngle = bestShot.angle;
                this.cueAngle = this.aiBaseAngle;
                this.cuePower = bestShot.power;
                this.powerSlider.value = this.cuePower;
                this.powerValue.textContent = Math.round(this.cuePower);
                
                // Start AI thinking animation
                this.aiThinking = true;
                this.aiThinkStartTime = Date.now();
                
                // Shoot after a delay (longer for hard mode to show thinking)
                setTimeout(() => {
                    if (this.gameRunning && this.currentPlayer === 'ai' && !this.isMoving) {
                        this.aiThinking = false;
                        this.shoot();
                    }
                }, 800);
                return;
            }
        }
        
        // Easy and medium mode: simpler logic
        // Find best target (prefer point-scoring balls)
        let target = null;
        let bestScore = -1;
        
        const pointBonus = this.aiDifficulty === 'easy' ? 5 : (this.aiDifficulty === 'medium' ? 15 : 25);
        
        this.balls.forEach(ball => {
            if (ball.pocketed || ball.type === 'cue' || ball.type === 'special') return;
            
            const dx = ball.x - this.cueBall.x;
            const dy = ball.y - this.cueBall.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            let score = 5; // Base score
            if (ball.type === 'point') {
                score += pointBonus;
            }
            score -= dist / 10; // Prefer closer balls
            
            if (score > bestScore) {
                bestScore = score;
                target = ball;
            }
        });
        
        if (target) {
            // Calculate angle with some randomness based on difficulty
            const dx = target.x - this.cueBall.x;
            const dy = target.y - this.cueBall.y;
            const baseAngle = Math.atan2(dy, dx);
            const angleError = (Math.random() - 0.5) * (1 - accuracy) * 0.5;
            this.aiBaseAngle = baseAngle + angleError;
            this.cueAngle = this.aiBaseAngle;
            
            // Set power
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.cuePower = Math.min(100, Math.max(30, dist / 3 * powerMultiplier));
            this.powerSlider.value = this.cuePower;
            this.powerValue.textContent = Math.round(this.cuePower);
            
            // Start AI thinking animation
            this.aiThinking = true;
            this.aiThinkStartTime = Date.now();
            
            // Shoot after a delay
            setTimeout(() => {
                if (this.gameRunning && this.currentPlayer === 'ai' && !this.isMoving) {
                    this.aiThinking = false;
                    this.shoot();
                }
            }, 500);
        } else {
            // No targets, check if game should end
            if (this.gameRunning) {
                const remainingBalls = this.balls.filter(b => !b.pocketed && b.type !== 'cue' && b.number !== 0);
                if (remainingBalls.length === 0) {
                    this.checkGameOver();
                } else {
                    // Switch to player turn
                    this.currentPlayer = 'player';
                    this.aimLocked = false;
                    this.aiThinking = false;
                    this.poolShootBtn.disabled = false;
                }
            }
        }
    }
    
    findBestShot() {
        // Advanced shot selection for hard mode
        let bestShot = null;
        let bestScore = -Infinity;
        
        const availableBalls = this.balls.filter(b => 
            !b.pocketed && 
            b.type !== 'cue' && 
            b.type !== 'special' &&
            b.number !== 0
        );
        
        if (availableBalls.length === 0) return null;
        
        // For each ball, try each pocket
        availableBalls.forEach(ball => {
            this.pockets.forEach(pocket => {
                const shot = this.evaluateShot(ball, pocket);
                if (shot && shot.score > bestScore) {
                    bestScore = shot.score;
                    bestShot = shot;
                }
            });
        });
        
        // If no good pocket shots found, try simple shots
        if (!bestShot || bestScore < 0) {
            availableBalls.forEach(ball => {
                const dx = ball.x - this.cueBall.x;
                const dy = ball.y - this.cueBall.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                // Check if path is clear
                if (!this.hasObstacle(this.cueBall, ball)) {
                    const power = Math.min(100, Math.max(35, dist / 2.8));
                    const score = 10 - (dist / 20);
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestShot = { angle, power, score };
                    }
                }
            });
        }
        
        return bestShot;
    }
    
    evaluateShot(targetBall, pocket) {
        // Calculate if we can pot this ball into this pocket
        const distToBall = Math.sqrt(
            Math.pow(targetBall.x - this.cueBall.x, 2) + 
            Math.pow(targetBall.y - this.cueBall.y, 2)
        );
        
        const distToPocket = Math.sqrt(
            Math.pow(pocket.x - targetBall.x, 2) + 
            Math.pow(pocket.y - targetBall.y, 2)
        );
        
        // Check if path from cue ball to target ball is clear
        if (this.hasObstacle(this.cueBall, targetBall)) {
            return null; // Path blocked
        }
        
        // Calculate the angle needed to hit the ball toward the pocket
        // This is a simplified calculation - we want to hit the ball so it goes to the pocket
        const pocketAngle = Math.atan2(pocket.y - targetBall.y, pocket.x - targetBall.x);
        const ballToCueAngle = Math.atan2(this.cueBall.y - targetBall.y, this.cueBall.x - targetBall.x);
        
        // Calculate where to hit the ball (aim for the side that will send it to the pocket)
        // Simplified: aim slightly offset from center to send ball toward pocket
        const angleDiff = pocketAngle - ballToCueAngle;
        const hitAngle = Math.atan2(targetBall.y - this.cueBall.y, targetBall.x - this.cueBall.x);
        
        // Adjust angle to account for ball-to-pocket direction
        // This is a simplified physics model
        const adjustedAngle = hitAngle + (angleDiff * 0.3);
        
        // Calculate power needed
        const totalDist = distToBall + distToPocket;
        const power = Math.min(100, Math.max(40, totalDist / 2.5));
        
        // Score the shot
        let score = 0;
        
        if (targetBall.type === 'point') {
            score += 40;
        }
        
        // Prefer closer shots (easier to make)
        score += 50 / (distToBall / 10 + 1);
        
        // Prefer shots where pocket is close to target ball
        score += 30 / (distToPocket / 10 + 1);
        
        // Penalize very long shots
        if (distToBall > 250) {
            score -= 30;
        }
        
        // Check scratch risk (cue ball going into pocket)
        const scratchRisk = this.calculateScratchRisk(adjustedAngle, power, pocket);
        score -= scratchRisk * 100; // Heavy penalty for scratch risk
        
        // Penalize shots with obstacles between ball and pocket
        if (this.hasObstacle(targetBall, pocket)) {
            score -= 50; // Obstacle between ball and pocket
        }
        
        // Bonus for straight shots (easier to make)
        const straightness = Math.abs(angleDiff);
        if (straightness < 0.3) {
            score += 20; // Nearly straight shot
        }
        
        return {
            angle: adjustedAngle,
            power: power,
            score: score
        };
    }
    
    hasObstacle(ball1, ball2) {
        // Check if any other ball is blocking the path between ball1 and ball2
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        for (let ball of this.balls) {
            if (ball.pocketed || ball === ball1 || ball === ball2) continue;
            
            // Check if this ball is in the path
            const ballDx = ball.x - ball1.x;
            const ballDy = ball.y - ball1.y;
            const distToBall = Math.sqrt(ballDx * ballDx + ballDy * ballDy);
            
            if (distToBall < dist) {
                // Check perpendicular distance from line
                const ballAngle = Math.atan2(ballDy, ballDx);
                const angleDiff = Math.abs(ballAngle - angle);
                // Normalize angle difference
                const normalizedAngleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
                const perpDist = distToBall * Math.sin(normalizedAngleDiff);
                
                // If ball is within 2 ball radii of the line, it's blocking
                if (perpDist < ball.radius * 2.5) {
                    return true; // Obstacle found
                }
            }
        }
        return false;
    }
    
    calculateScratchRisk(shotAngle, power, targetPocket) {
        // Estimate if the cue ball might go into a pocket after the shot
        // This is a simplified calculation
        
        // Simulate where cue ball might end up (very rough estimate)
        const estimatedCueBallX = this.cueBall.x + Math.cos(shotAngle) * power * 2;
        const estimatedCueBallY = this.cueBall.y + Math.sin(shotAngle) * power * 2;
        
        // Check distance to all pockets
        let minDistToPocket = Infinity;
        this.pockets.forEach(pocket => {
            const dist = Math.sqrt(
                Math.pow(estimatedCueBallX - pocket.x, 2) + 
                Math.pow(estimatedCueBallY - pocket.y, 2)
            );
            if (dist < minDistToPocket) {
                minDistToPocket = dist;
            }
        });
        
        // Higher risk if cue ball ends up close to a pocket
        if (minDistToPocket < 50) {
            return 0.8; // High risk
        } else if (minDistToPocket < 100) {
            return 0.4; // Medium risk
        } else if (minDistToPocket < 150) {
            return 0.2; // Low risk
        }
        
        return 0.1; // Very low risk
    }
    
    checkGameOver() {
        const remainingBalls = this.balls.filter(b => !b.pocketed && b.type !== 'cue' && b.number !== 0);
        
        if (remainingBalls.length === 0) {
            if (this.playerScore > this.aiScore) {
                this.endGame('You Win!');
            } else if (this.aiScore > this.playerScore) {
                this.endGame('AI Wins!');
            } else {
                this.endGame('Tie Game!');
            }
        }
    }
    
    endGame(message) {
        this.gameRunning = false;
        this.isMoving = false;
        document.getElementById('poolGameOverTitle').textContent = message;
        document.getElementById('finalPlayerScore').textContent = this.playerScore;
        document.getElementById('finalAiScore').textContent = this.aiScore;
        this.poolGameOverDiv.classList.remove('hidden');
    }
    
    updateScore() {
        this.playerScoreElement.textContent = this.playerScore;
        this.aiScoreElement.textContent = this.aiScore;
        this.pointsScoreElement.textContent = this.playerScore;
    }
    
    restartGame() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.currentPlayer = 'player';
        this.gameRunning = false;
        this.isMoving = false;
        this.aimLocked = false;
        this.ballPottedThisTurn = false;
        this.aiThinking = false;
        this.firstShot = true; // Reset first shot flag
        this.isBreakSequence = false; // Reset break sequence flag
        this.collisionPairs = new Set(); // Reset collision tracking
        this.ballHitSoundPlayed = false; // Reset ball-hit sound flag
        // Reset spin control
        this.spinOffsetX = 0;
        this.spinOffsetY = 0;
        if (this.drawSpinControl) this.drawSpinControl();
        this.poolGameOverDiv.classList.add('hidden');
        this.poolStartBtn.disabled = false;
        this.poolShootBtn.disabled = true;
        this.poolRestartBtn.disabled = true;
        this.setupBalls();
        this.updateScore();
        this.draw();
    }
    
    draw() {
        // Clear the entire canvas first to prevent duplicate drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background image if available (behind everything)
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        }
        
        const railWidth = 30;
        
        // Draw table - use image if available, otherwise draw
        if (this.images.table) {
            // Draw table image with rotation and scaling
            const tableImg = this.images.table;
            const scaledWidth = tableImg.width * this.tableScale;
            const scaledHeight = tableImg.height * this.tableScale;
            
            // Calculate center point for rotation
            const centerX = this.canvas.width / 2 + this.tableX;
            const centerY = this.canvas.height / 2 + this.tableY;
            
            // Save context for transformation
            this.ctx.save();
            
            // Move to center, rotate, then draw
            this.ctx.translate(centerX, centerY);
            // Convert degrees to radians for rotation
            const rotationRadians = (this.tableRotationDegrees * Math.PI) / 180;
            this.ctx.rotate(rotationRadians);
            
            // Draw table image centered at rotation point
            this.ctx.drawImage(tableImg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
            
            // Restore context
            this.ctx.restore();
        } else {
            // Fallback: Draw dark brown wooden rails
            this.ctx.fillStyle = '#5D4037'; // Dark brown
            this.ctx.fillRect(0, 0, this.canvas.width, railWidth); // Top rail
            this.ctx.fillRect(0, this.canvas.height - railWidth, this.canvas.width, railWidth); // Bottom rail
            this.ctx.fillRect(0, 0, railWidth, this.canvas.height); // Left rail
            this.ctx.fillRect(this.canvas.width - railWidth, 0, railWidth, this.canvas.height); // Right rail
            
            // Draw green felt playing surface with gradient
            const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
            gradient.addColorStop(0, '#2d7a4d'); // Slightly darker at edges
            gradient.addColorStop(0.5, '#3a9d5f'); // Brighter in center
            gradient.addColorStop(1, '#2d7a4d'); // Slightly darker at edges
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(railWidth, railWidth, this.canvas.width - railWidth * 2, this.canvas.height - railWidth * 2);
        }
        
        // Draw pockets (black circular holes)
        this.ctx.fillStyle = '#000000';
        this.pockets.forEach((pocket, index) => {
            // Center pockets (side pockets) are indices 1 and 4 - scale them
            const isCenterPocket = index === 1 || index === 4;
            const baseRadius = 15;
            const pocketRadius = isCenterPocket ? baseRadius * this.centerPocketScale : baseRadius;
            
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add golden-yellow accent for corner pockets only, on wood rails (not on green felt)
            // Corner pockets are indices: 0=top-left, 2=top-right, 3=bottom-left, 5=bottom-right
            const isCornerPocket = index === 0 || index === 2 || index === 3 || index === 5;
            if (isCornerPocket) {
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                
                // Calculate the angle from this pocket to the invisible target point
                // The gap should face toward the target point, with individual rotation offset
                const angleToTarget = Math.atan2(
                    this.goldRingTargetPoint.y - pocket.y,
                    this.goldRingTargetPoint.x - pocket.x
                );
                
                // Get the rotation offset for this specific corner pocket
                // Map pocket index to rotation array index: 0->0, 2->1, 3->2, 5->3
                let rotationIndex;
                if (index === 0) rotationIndex = 0;      // top-left
                else if (index === 2) rotationIndex = 1; // top-right
                else if (index === 3) rotationIndex = 2; // bottom-left
                else if (index === 5) rotationIndex = 3; // bottom-right
                
                // Apply rotation offset (convert degrees to radians)
                const rotationDegrees = this.goldRingRotationOffsets[rotationIndex] || 0;
                const rotationOffsetRadians = (rotationDegrees * Math.PI) / 180;
                const gapDirection = angleToTarget + rotationOffsetRadians;
                
                // Gap size (45 degrees on each side of the center direction)
                const gapSize = Math.PI / 4; // 45 degrees
                const gapStart = gapDirection - gapSize;
                const gapEnd = gapDirection + gapSize;
                
                // Draw the ring with a gap facing the center
                const ringRadius = 18;
                
                // Normalize angles to [0, 2π) range
                const normalizeAngle = (angle) => {
                    let normalized = angle;
                    while (normalized < 0) normalized += Math.PI * 2;
                    while (normalized >= Math.PI * 2) normalized -= Math.PI * 2;
                    return normalized;
                };
                
                // The gap is from gapStart to gapEnd
                // We want to draw the arc that goes around the rest of the circle
                let gapStartNorm = normalizeAngle(gapStart);
                let gapEndNorm = normalizeAngle(gapEnd);
                
                // Draw the arc that avoids the gap
                // If gapEnd < gapStart, the gap crosses 0, so we draw from gapEnd to gapStart
                // Otherwise, we need to draw from gapEnd to gapStart + 2π
                if (gapEndNorm < gapStartNorm) {
                    // Gap crosses 0, draw the arc that avoids it
                    this.ctx.arc(pocket.x, pocket.y, ringRadius, gapEndNorm, gapStartNorm);
                } else {
                    // Gap doesn't cross 0, draw from gapEnd to gapStart + 2π (wrapping around)
                    this.ctx.arc(pocket.x, pocket.y, ringRadius, gapEndNorm, gapStartNorm + Math.PI * 2);
                }
                
                this.ctx.stroke();
            }
        });
        
        // Draw balls
        this.balls.forEach(ball => {
            // Skip pocketed balls - they should not be drawn at all
            if (ball.pocketed === true) {
                return;
            }
            
            // Ball shadow for depth
            this.ctx.beginPath();
            this.ctx.arc(ball.x + 1, ball.y + 1, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fill();
            
            // Ball with gradient for 3D effect
            const ballGradient = this.ctx.createRadialGradient(
                ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
                ball.x, ball.y, ball.radius
            );
            if (ball.number === 0) {
                // White cue ball
                ballGradient.addColorStop(0, '#ffffff');
                ballGradient.addColorStop(1, '#e0e0e0');
            } else {
                // Colored balls with highlight
                const lightColor = this.lightenColor(ball.color, 30);
                ballGradient.addColorStop(0, lightColor);
                ballGradient.addColorStop(0.7, ball.color);
                ballGradient.addColorStop(1, this.darkenColor(ball.color, 20));
            }
            
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = ballGradient;
            this.ctx.fill();
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            // Draw dot on cue ball (always visible, spins when ball has spin)
            if (ball.number === 0) {
                // Check if ball has spin
                let rotationAngle = this.initialDotAngle + this.spinRotationAngle; // Use current rotation angle
                if (ball.spinX !== undefined && ball.spinY !== undefined) {
                    const spinMagnitude = Math.sqrt(ball.spinX * ball.spinX + ball.spinY * ball.spinY);
                    if (spinMagnitude > 0.01) {
                        // Update rotation angle based on spin magnitude
                        // Spin faster if magnitude is higher, and also based on ball velocity
                        const velocity = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                        const spinSpeed = spinMagnitude * (0.5 + velocity * 0.02); // Increased spin speed
                        this.spinRotationAngle += spinSpeed;
                        if (this.spinRotationAngle > Math.PI * 2) {
                            this.spinRotationAngle -= Math.PI * 2;
                        }
                        rotationAngle = this.initialDotAngle + this.spinRotationAngle;
                    }
                    // Don't reset rotation angle when spin stops - keep dot where it is
                }
                
                // Always draw the dot on the cue ball
                this.ctx.save();
                this.ctx.translate(ball.x, ball.y);
                this.ctx.rotate(rotationAngle);
                
                // Draw a dot on the side of the ball (closer to center)
                const dotRadius = 3;
                const dotDistance = ball.radius * 0.5; // Position dot closer to center
                this.ctx.beginPath();
                this.ctx.arc(dotDistance, 0, dotRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = '#000000';
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            // Draw number
            if (ball.number > 0) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(ball.number, ball.x, ball.y);
            }
        });
        
        // Draw cue stick (when player's turn or AI is thinking, and not moving)
        if (this.gameRunning && !this.isMoving && this.cueBall && !this.cueBall.pocketed && 
            ((this.currentPlayer === 'player') || (this.currentPlayer === 'ai' && this.aiThinking))) {
            const stickLength = 80;
            const stickX = this.cueBall.x - Math.cos(this.cueAngle) * (this.cueBall.radius + stickLength);
            const stickY = this.cueBall.y - Math.sin(this.cueAngle) * (this.cueBall.radius + stickLength);
            
            // Animate AI thinking - slight back and forth movement
            if (this.currentPlayer === 'ai' && this.aiThinking) {
                const timeElapsed = (Date.now() - this.aiThinkStartTime) / 1000; // Time in seconds
                // Oscillate the angle slightly (about 5 degrees each way)
                const oscillation = Math.sin(timeElapsed * 3) * 0.08; // ~4.5 degrees oscillation
                this.cueAngle = this.aiBaseAngle + oscillation;
            }
            
            // Draw aim line
            if (this.currentPlayer === 'player') {
                this.ctx.strokeStyle = this.aimLocked ? '#00ff00' : '#ffff00';
            } else {
                // AI aim line in red/orange to show it's thinking
                this.ctx.strokeStyle = '#ff6600';
            }
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.cueBall.x, this.cueBall.y);
            this.ctx.lineTo(this.cueBall.x + Math.cos(this.cueAngle) * 200, 
                          this.cueBall.y + Math.sin(this.cueAngle) * 200);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Draw cue stick - use image if available, otherwise draw
            if (this.images.cue) {
                // Calculate position and rotation for cue image using original image dimensions
                const cueScale = 0.2; // Scale factor to make cue stick smaller (0.3 = 30% of original size)
                const cueWidth = this.images.cue.width * cueScale;
                const cueHeight = this.images.cue.height * cueScale;
                
                // Position cue stick behind the cue ball, pointing at it
                // Center the cue stick along the aiming line, with its tip near the cue ball
                // Position the center of the cue stick image along the aiming line
                // Increase distance to move cue stick further back
                const distanceFromBall = stickLength + this.cueBall.radius + (cueWidth / 2) + 40; // Added 100 pixels to move it back
                const cueCenterX = this.cueBall.x - Math.cos(this.cueAngle) * distanceFromBall;
                const cueCenterY = this.cueBall.y - Math.sin(this.cueAngle) * distanceFromBall;
                
                // Adjust to center the cue stick properly on the aiming line
                // Account for the cue stick's center point in the image
                const cueImageCenterOffsetX = 0; // Adjust if cue image center is off
                const cueImageCenterOffsetY = 0; // Adjust if cue image center is off
                
                // Save context for rotation
                this.ctx.save();
                this.ctx.translate(cueCenterX + cueImageCenterOffsetX, cueCenterY + cueImageCenterOffsetY);
                // Rotate the cue stick to point at the cue ball
                // The cue stick should point along the aiming line towards the cue ball
                // Adjust cueRotationOffset if the cue image orientation is different:
                // - Math.PI (180°) = point at ball (default)
                // - 0 = point away from ball
                // - Math.PI/2 (90°) = rotate 90 degrees
                this.ctx.rotate(this.cueAngle + this.cueRotationOffset);
                
                // Draw cue image scaled down, perfectly centered
                // The image is drawn from its center point, so offset by half its dimensions
                this.ctx.drawImage(
                    this.images.cue, 
                    -cueWidth / 2, 
                    -cueHeight / 2, 
                    cueWidth, 
                    cueHeight
                );
                this.ctx.restore();
            } else {
                // Fallback: Draw cue stick with brown color
                this.ctx.strokeStyle = '#8B4513'; // Brown
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(stickX, stickY);
                this.ctx.lineTo(this.cueBall.x - Math.cos(this.cueAngle) * this.cueBall.radius, 
                              this.cueBall.y - Math.sin(this.cueAngle) * this.cueBall.radius);
                this.ctx.stroke();
            }
            
            // Draw lock indicator (player) or AI thinking indicator
            if (this.currentPlayer === 'player' && this.aimLocked) {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('AIM LOCKED', this.canvas.width / 2, 30);
            } else if (this.currentPlayer === 'ai' && this.aiThinking) {
                this.ctx.fillStyle = '#ff6600';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('AI THINKING...', this.canvas.width / 2, 30);
            }
        }
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const r = Math.min(255, (num >> 16) + percent);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
        const b = Math.min(255, (num & 0x0000FF) + percent);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const r = Math.max(0, (num >> 16) - percent);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
        const b = Math.max(0, (num & 0x0000FF) - percent);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    selectDifficulty(difficulty) {
        this.aiDifficulty = difficulty;
        
        this.difficultyOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.difficulty === difficulty) {
                option.classList.add('active');
            }
        });
        
        localStorage.setItem('poolAiDifficulty', difficulty);
    }
    
    loadDifficulty() {
        const saved = localStorage.getItem('poolAiDifficulty') || 'easy';
        this.selectDifficulty(saved);
    }
    
    loadTheme() {
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);
    }
    
    openSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        
        this.settingsJustOpened = true;
        settingsPanel.classList.remove('hidden');
        settingsPanel.classList.add('open');
        // Add smooth animation
        setTimeout(() => {
            settingsPanel.style.right = '0';
            // Allow closing after animation completes
            setTimeout(() => {
                this.settingsJustOpened = false;
            }, 400);
        }, 10);
    }
    
    /**
     * Set table image scale
     * @param {number} scale - Scale factor (1.0 = 100%, 0.5 = 50%, 2.0 = 200%, etc.)
     */
    setTableScale(scale) {
        this.tableScale = scale;
        this.draw();
    }
    
    /**
     * Set table image rotation
     * @param {number} degrees - Rotation in degrees (0 = no rotation, 90 = 90 degrees clockwise)
     */
    setTableRotation(degrees) {
        this.tableRotationDegrees = degrees;
        this.draw();
    }
    
    /**
     * Set table image position offset
     * @param {number} x - X offset in pixels
     * @param {number} y - Y offset in pixels
     */
    setTablePosition(x, y) {
        this.tableX = x;
        this.tableY = y;
        this.draw();
    }
    
    /**
     * Set pocket position offset (applies to all pockets)
     * @param {number} x - X offset in pixels
     * @param {number} y - Y offset in pixels
     */
    setPocketOffset(x, y) {
        this.pocketOffsetX = x;
        this.pocketOffsetY = y;
        this.setupPockets(); // Recalculate pocket positions
        this.draw();
    }
    
    /**
     * Set individual pocket position
     * @param {number} pocketIndex - Index of pocket (0-5: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right)
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     */
    setPocketPosition(pocketIndex, x, y) {
        if (pocketIndex >= 0 && pocketIndex < this.pockets.length) {
            this.pockets[pocketIndex].x = x;
            this.pockets[pocketIndex].y = y;
            this.draw();
        }
    }
    
    /**
     * Set all pocket positions at once
     * @param {Array} positions - Array of 6 objects with x and y properties
     *                            Example: [{x: 30, y: 30}, {x: 300, y: 30}, ...]
     *                            Or array of 6 arrays: [[30, 30], [300, 30], ...]
     */
    setAllPocketPositions(positions) {
        if (positions && positions.length === 6) {
            positions.forEach((pos, index) => {
                if (index < this.pockets.length) {
                    if (Array.isArray(pos)) {
                        // If it's an array [x, y]
                        this.pockets[index].x = pos[0];
                        this.pockets[index].y = pos[1];
                    } else if (pos && typeof pos === 'object') {
                        // If it's an object {x: ..., y: ...}
                        if (pos.x !== undefined) this.pockets[index].x = pos.x;
                        if (pos.y !== undefined) this.pockets[index].y = pos.y;
                    }
                }
            });
            this.draw();
        }
    }
    
    /**
     * Manually trigger pocket detection from the table image
     * Useful for debugging or re-detecting after image changes
     */
    async redetectPockets() {
        const detected = await this.detectPocketsFromImage();
        if (detected) {
            this.setupPockets();
            this.draw();
            console.log('Pockets re-detected successfully');
            return true;
        } else {
            console.warn('Pocket detection failed');
            return false;
        }
    }
}

