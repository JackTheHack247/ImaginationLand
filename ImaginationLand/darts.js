class DartsGame {
    constructor() {
        this.canvas = document.getElementById('dartsCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.boardRadius = 200;
        
        // Game state
        this.round = 1;
        this.maxRounds = 3;
        this.score = 0;
        this.previousScore = 0;
        this.gameRunning = false;
        this.currentStage = 'waiting'; // waiting, vertical, horizontal, target, throwing
        
        // Aiming values
        this.verticalPosition = 0.5;
        this.horizontalPosition = 0.5;
        this.targetX = 0;
        this.targetY = 0;
        this.verticalDirection = 1;
        this.horizontalDirection = 1;
        this.verticalSpeed = 0.02;
        this.horizontalSpeed = 0.03;
        
        // DOM elements
        this.roundElement = document.getElementById('dartsRound');
        this.scoreElement = document.getElementById('dartsScore');
        this.dartsStartBtn = document.getElementById('dartsStartBtn');
        this.dartsThrowBtn = document.getElementById('dartsThrowBtn');
        this.dartsNextRoundBtn = document.getElementById('dartsNextRoundBtn');
        this.dartsRestartBtn = document.getElementById('dartsRestartBtn');
        this.dartsPlayAgainBtn = document.getElementById('dartsPlayAgainBtn');
        this.dartsGameOverDiv = document.getElementById('dartsGameOver');
        this.verticalSlider = document.getElementById('verticalSlider');
        this.horizontalSlider = document.getElementById('horizontalSlider');
        this.targetCircle = document.getElementById('targetCircle');
        this.verticalHandle = document.getElementById('verticalHandle');
        this.horizontalHandle = document.getElementById('horizontalHandle');
        this.aimingStage = document.getElementById('aimingStage');
        this.settingsJustOpened = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.drawDartboard();
        // Initialize handles to middle position
        this.verticalPosition = 0.5;
        this.horizontalPosition = 0.5;
        this.updateVerticalHandle();
        this.updateHorizontalHandle();
    }
    
    setupEventListeners() {
        this.dartsStartBtn.addEventListener('click', () => this.startGame());
        this.dartsThrowBtn.addEventListener('click', () => this.throwDart());
        this.dartsNextRoundBtn.addEventListener('click', () => this.nextRound());
        this.dartsRestartBtn.addEventListener('click', () => this.restartGame());
        this.dartsPlayAgainBtn.addEventListener('click', () => this.restartGame());
        
        this.verticalSlider.addEventListener('click', () => this.clickVerticalSlider());
        this.horizontalSlider.addEventListener('click', () => this.clickHorizontalSlider());
        this.targetCircle.addEventListener('click', () => this.clickTarget());
        
        // Theme options (shared with other games)
        const allThemeOptions = document.querySelectorAll('.theme-option');
        allThemeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const normalized = saveTheme(option.dataset.theme);
                applyTheme(normalized);
            });
        });
        
        this.loadTheme();
    }
    
    loadTheme() {
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);
    }
    
    startGame() {
        this.gameRunning = true;
        this.round = 1;
        this.score = 0;
        this.dartsStartBtn.disabled = true;
        this.dartsRestartBtn.disabled = false;
        this.startAiming();
    }
    
    startAiming() {
        this.currentStage = 'vertical';
        this.verticalPosition = 0.5; // Start in middle
        this.verticalDirection = 1;
        this.horizontalPosition = 0.5; // Start in middle
        this.horizontalDirection = 1;
        this.targetCircle.classList.add('hidden');
        this.dartsThrowBtn.classList.add('hidden');
        this.dartsNextRoundBtn.classList.add('hidden');
        this.dartsNextRoundBtn.disabled = true;
        
        // Update handle positions to middle
        this.updateVerticalHandle();
        this.updateHorizontalHandle();
        
        // Only animate vertical slider first
        this.animateVerticalSlider();
    }
    
    updateVerticalHandle() {
        const track = this.verticalHandle.parentElement;
        if (!track) return;
        const trackHeight = 500; // Fixed track height
        const handleHeight = 24;
        // Position handle center at the calculated position
        const handleCenter = this.verticalPosition * trackHeight;
        const handleTop = handleCenter - (handleHeight / 2);
        const maxTop = trackHeight - handleHeight;
        this.verticalHandle.style.top = Math.max(0, Math.min(maxTop, handleTop)) + 'px';
    }
    
    updateHorizontalHandle() {
        const track = this.horizontalHandle.parentElement;
        if (!track) return;
        const trackWidth = 500; // Fixed track width
        const handleWidth = 24;
        // Position handle center at the calculated position
        const handleCenter = this.horizontalPosition * trackWidth;
        const handleLeft = handleCenter - (handleWidth / 2);
        const maxLeft = trackWidth - handleWidth;
        this.horizontalHandle.style.left = Math.max(0, Math.min(maxLeft, handleLeft)) + 'px';
    }
    
    animateVerticalSlider() {
        if (!this.gameRunning || this.currentStage !== 'vertical') return;
        
        this.verticalPosition += this.verticalSpeed * this.verticalDirection;
        
        if (this.verticalPosition >= 1) {
            this.verticalPosition = 1;
            this.verticalDirection = -1;
        } else if (this.verticalPosition <= 0) {
            this.verticalPosition = 0;
            this.verticalDirection = 1;
        }
        
        this.updateVerticalHandle();
        requestAnimationFrame(() => this.animateVerticalSlider());
    }
    
    clickVerticalSlider() {
        if (this.currentStage !== 'vertical') return;
        
        this.currentStage = 'horizontal';
        this.horizontalPosition = 0.5; // Reset to middle
        this.horizontalDirection = 1;
        this.updateHorizontalHandle();
        
        // Cool animation
        this.animateTransition();
        
        // Start horizontal slider animation
        this.animateHorizontalSlider();
    }
    
    animateTransition(callback) {
        // Flash animation
        this.canvas.style.filter = 'brightness(1.5)';
        setTimeout(() => {
            this.canvas.style.filter = 'brightness(1)';
            if (callback) callback();
        }, 300);
    }
    
    animateHorizontalSlider() {
        if (!this.gameRunning || this.currentStage !== 'horizontal') return;
        
        this.horizontalPosition += this.horizontalSpeed * this.horizontalDirection;
        
        if (this.horizontalPosition >= 1) {
            this.horizontalPosition = 1;
            this.horizontalDirection = -1;
        } else if (this.horizontalPosition <= 0) {
            this.horizontalPosition = 0;
            this.horizontalDirection = 1;
        }
        
        this.updateHorizontalHandle();
        requestAnimationFrame(() => this.animateHorizontalSlider());
    }
    
    clickHorizontalSlider() {
        if (this.currentStage !== 'horizontal') return;
        
        // Calculate target position as intersection of two lines:
        // Horizontal slider position (0-1) maps to X position (left-right)
        // Vertical slider position (0-1) maps to Y position (top-bottom)
        const boardWidth = this.boardRadius * 2;
        const boardHeight = this.boardRadius * 2;
        
        // Map slider positions (0-1) to board coordinates
        // 0 = left/top edge, 1 = right/bottom edge
        this.targetX = this.centerX - this.boardRadius + (this.horizontalPosition * boardWidth);
        this.targetY = this.centerY - this.boardRadius + (this.verticalPosition * boardHeight);
        
        this.currentStage = 'target';
        this.targetCircle.classList.remove('hidden');
        
        // Position target circle relative to canvas
        const canvasRect = this.canvas.getBoundingClientRect();
        const gameArea = document.querySelector('.darts-game-area');
        const areaRect = gameArea.getBoundingClientRect();
        this.targetCircle.style.left = (this.targetX + (canvasRect.left - areaRect.left) - 15) + 'px';
        this.targetCircle.style.top = (this.targetY + (canvasRect.top - areaRect.top) - 15) + 'px';
        
        // Cool animation
        this.animateTransition();
        
        // Start shaking animation (already in CSS)
        this.dartsThrowBtn.classList.remove('hidden');
        this.dartsThrowBtn.disabled = false;
    }
    
    clickTarget() {
        // Update target position when clicked (for precision)
        // The shaking makes it challenging
    }
    
    throwDart() {
        if (this.currentStage !== 'target') return;
        
        this.currentStage = 'throwing';
        this.dartsThrowBtn.disabled = true;
        this.targetCircle.classList.add('hidden');
        
        // Animate dart flying
        this.animateDartThrow();
    }
    
    animateDartThrow() {
        const gameArea = document.querySelector('.darts-game-area');
        const canvasRect = this.canvas.getBoundingClientRect();
        const areaRect = gameArea.getBoundingClientRect();
        
        // Create throwing container
        const throwContainer = document.createElement('div');
        throwContainer.className = 'dart-throw-container';
        const boardContainer = document.querySelector('.darts-board-container');
        boardContainer.appendChild(throwContainer);
        
        // Create arm structure
        const arm = document.createElement('div');
        arm.className = 'dart-arm';
        throwContainer.appendChild(arm);
        
        const upperArm = document.createElement('div');
        upperArm.className = 'dart-upper-arm';
        arm.appendChild(upperArm);
        
        const forearm = document.createElement('div');
        forearm.className = 'dart-forearm';
        arm.appendChild(forearm);
        
        const hand = document.createElement('div');
        hand.className = 'dart-hand';
        forearm.appendChild(hand);
        
        // Create dart in hand
        const dartInHand = document.createElement('div');
        dartInHand.className = 'dart-in-hand';
        hand.appendChild(dartInHand);
        
        // Animation sequence: draw back, throw forward, dart flies
        setTimeout(() => {
            // Draw back - arm moves back
            arm.style.animation = 'drawBack 0.4s ease-out forwards';
            forearm.style.animation = 'forearmBend 0.4s ease-out forwards';
            
            setTimeout(() => {
                // Throw forward - powerful forward motion
                arm.style.animation = 'throwForward 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                forearm.style.animation = 'forearmBend 0.25s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards';
                
                setTimeout(() => {
                    // Dart leaves hand and flies
                    dartInHand.remove();
                    const flyingDart = document.createElement('div');
                    flyingDart.className = 'dart-flying';
                    
                    // Calculate trajectory from hand position
                    const startX = canvasRect.left + this.canvas.width / 2;
                    const startY = canvasRect.top + this.canvas.height + 100;
                    const endX = this.targetX + (canvasRect.left - areaRect.left);
                    const endY = this.targetY + (canvasRect.top - areaRect.top);
                    
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    
                    flyingDart.style.left = startX + 'px';
                    flyingDart.style.top = startY + 'px';
                    flyingDart.style.transform = `rotate(${angle}deg)`;
                    flyingDart.style.transition = 'all 0.5s cubic-bezier(0.2, 0, 0.1, 1)';
                    document.body.appendChild(flyingDart);
                    
                    // Animate dart flying with realistic trajectory
                    setTimeout(() => {
                        flyingDart.style.left = endX + 'px';
                        flyingDart.style.top = endY + 'px';
                        flyingDart.style.transform = `rotate(${angle + 8}deg)`;
                        flyingDart.style.animation = 'dartFly 0.5s ease-out forwards';
                        
                        setTimeout(() => {
                            // Dart lands - impact animation
                            flyingDart.style.animation = 'dartLand 0.2s ease-out forwards';
                            
                            setTimeout(() => {
                                // Draw dart on canvas at landing position
                                const canvasX = this.targetX;
                                const canvasY = this.targetY;
                                this.drawDartOnBoard(canvasX, canvasY);
                                
                                // Clean up
                                throwContainer.remove();
                                flyingDart.remove();
                                this.calculateScore();
                            }, 200);
                        }, 500);
                    }, 10);
                }, 250);
            }, 400);
        }, 10);
    }
    
    drawDartOnBoard(x, y) {
        // Draw a small dart mark on the canvas
        this.ctx.save();
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 5, y);
        this.ctx.lineTo(x + 5, y);
        this.ctx.moveTo(x, y - 5);
        this.ctx.lineTo(x, y + 5);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    calculateScore() {
        this.previousScore = this.score;
        const dx = this.targetX - this.centerX;
        const dy = this.targetY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let pointsEarned = 0;
        
        if (distance < 20) {
            pointsEarned = 50;
        } else if (distance < 40) {
            pointsEarned = 25;
        } else if (distance < 60) {
            pointsEarned = 15;
        } else if (distance < 80) {
            pointsEarned = 10;
        } else if (distance < 120) {
            pointsEarned = 5;
        } else if (distance < this.boardRadius) {
            pointsEarned = 2;
        }
        // Miss = 0 points
        
        this.score += pointsEarned;
        this.updateScore();
        this.showScore(pointsEarned);
    }
    
    showScore(pointsEarned) {
        // Show score popup animation
        const scorePopup = document.createElement('div');
        scorePopup.style.position = 'absolute';
        scorePopup.style.left = this.targetX + 'px';
        scorePopup.style.top = (this.targetY - 30) + 'px';
        scorePopup.style.color = pointsEarned >= 25 ? '#ffd700' : '#ffffff';
        scorePopup.style.fontSize = '28px';
        scorePopup.style.fontWeight = 'bold';
        scorePopup.style.textShadow = '2px 2px 4px black';
        scorePopup.style.pointerEvents = 'none';
        scorePopup.style.zIndex = '1000';
        scorePopup.style.transition = 'all 1s ease-out';
        scorePopup.textContent = '+' + pointsEarned;
        document.querySelector('.darts-game-area').appendChild(scorePopup);
        
        setTimeout(() => {
            scorePopup.style.transform = 'translateY(-50px)';
            scorePopup.style.opacity = '0';
            setTimeout(() => scorePopup.remove(), 1000);
        }, 10);
        
        // Show next round button after delay
        setTimeout(() => {
            this.dartsNextRoundBtn.classList.remove('hidden');
            this.dartsNextRoundBtn.disabled = false;
        }, 1500);
    }
    
    nextRound() {
        this.round++;
        if (this.round > this.maxRounds) {
            this.endGame();
        } else {
            this.dartsNextRoundBtn.classList.add('hidden');
            this.dartsNextRoundBtn.disabled = true;
            this.startAiming();
        }
    }
    
    endGame() {
        this.gameRunning = false;
        this.dartsGameOverDiv.classList.remove('hidden');
        document.getElementById('finalDartsScore').textContent = this.score;
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        this.roundElement.textContent = this.round;
    }
    
    restartGame() {
        this.round = 1;
        this.score = 0;
        this.gameRunning = false;
        this.currentStage = 'waiting';
        this.verticalPosition = 0.5;
        this.horizontalPosition = 0.5;
        this.dartsGameOverDiv.classList.add('hidden');
        this.dartsStartBtn.disabled = false;
        this.dartsRestartBtn.disabled = true;
        this.targetCircle.classList.add('hidden');
        this.dartsThrowBtn.classList.add('hidden');
        this.dartsNextRoundBtn.classList.add('hidden');
        this.updateVerticalHandle();
        this.updateHorizontalHandle();
        this.updateScore();
        this.drawDartboard();
    }
    
    drawDartboard() {
        // Clear canvas
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw dartboard rings
        const rings = [
            { radius: 200, color: '#8B4513' }, // Outer
            { radius: 180, color: '#ffffff' },
            { radius: 160, color: '#000000' },
            { radius: 140, color: '#ffffff' },
            { radius: 120, color: '#000000' },
            { radius: 100, color: '#ffffff' },
            { radius: 80, color: '#000000' },
            { radius: 60, color: '#ffffff' },
            { radius: 40, color: '#ff0000' }, // Inner ring
            { radius: 20, color: '#ff0000' }  // Bullseye
        ];
        
        rings.forEach(ring => {
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, ring.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = ring.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        // Draw segments (20 segments)
        for (let i = 0; i < 20; i++) {
            const angle = (i * Math.PI * 2 / 20) - Math.PI / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(
                this.centerX + Math.cos(angle) * this.boardRadius,
                this.centerY + Math.sin(angle) * this.boardRadius
            );
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    openSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        
        this.settingsJustOpened = true;
        settingsPanel.classList.remove('hidden');
        settingsPanel.classList.add('open');
        setTimeout(() => {
            settingsPanel.style.right = '0';
            setTimeout(() => {
                this.settingsJustOpened = false;
            }, 400);
        }, 10);
    }
}
