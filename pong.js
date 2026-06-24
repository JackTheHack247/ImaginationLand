class PongGame {
    constructor() {
        this.canvas = document.getElementById('pongCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game dimensions
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        
        // Paddle properties
        this.paddleWidth = 10;
        this.paddleHeight = 80;
        this.paddleSpeed = 5;
        
        // Player paddle (left side)
        this.playerPaddle = {
            x: 20,
            y: this.canvasHeight / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            speed: this.paddleSpeed
        };
        
        // AI paddle (right side)
        this.aiPaddle = {
            x: this.canvasWidth - 20 - this.paddleWidth,
            y: this.canvasHeight / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            speed: this.paddleSpeed
        };
        
        // Ball properties
        this.ball = {
            x: this.canvasWidth / 2,
            y: this.canvasHeight / 2,
            radius: 8,
            vx: 4,
            vy: 4,
            speed: 4
        };
        
        // Game state
        this.playerScore = 0;
        this.aiScore = 0;
        this.pointsScore = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.aiDifficulty = localStorage.getItem('pongAiDifficulty') || 'medium';
        
        // Input state
        this.keys = {
            up: false,
            down: false,
            w: false,
            s: false
        };
        
        // DOM elements
        this.playerScoreElement = document.getElementById('pongPlayerScore');
        this.aiScoreElement = document.getElementById('pongAiScore');
        this.pointsScoreElement = document.getElementById('pongPointsScore');
        this.startBtn = document.getElementById('pongStartBtn');
        this.pauseBtn = document.getElementById('pongPauseBtn');
        this.restartBtn = document.getElementById('pongRestartBtn');
        this.gameOverDiv = document.getElementById('pongGameOver');
        this.gameOverTitle = document.getElementById('pongGameOverTitle');
        this.gameOverMessage = document.getElementById('pongGameOverMessage');
        this.finalPlayerScoreElement = document.getElementById('finalPongPlayerScore');
        this.finalAiScoreElement = document.getElementById('finalPongAiScore');
        this.finalPointsElement = document.getElementById('finalPongPoints');
        this.playAgainBtn = document.getElementById('pongPlayAgainBtn');
        
        // Settings elements
        this.settingsBtn = document.getElementById('pongSettingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.themeOptions = document.querySelectorAll('#pongSettings .theme-option');
        this.difficultyOptions = document.querySelectorAll('#pongSettings .difficulty-option');
        this.settingsJustOpened = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadTheme();
        this.loadAiDifficulty();
        this.draw();
    }
    
    setupEventListeners() {
        // Button events
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.playAgainBtn.addEventListener('click', () => this.restartGame());
        
        // Theme selection events
        this.themeOptions.forEach(option => {
            option.addEventListener('click', () => this.selectTheme(option.dataset.theme));
        });
        
        // Difficulty selection events
        this.difficultyOptions.forEach(option => {
            option.addEventListener('click', () => this.selectAiDifficulty(option.dataset.difficulty));
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        switch(e.key.toLowerCase()) {
            case 'arrowup':
            case 'up':
                e.preventDefault();
                this.keys.up = true;
                break;
            case 'arrowdown':
            case 'down':
                e.preventDefault();
                this.keys.down = true;
                break;
            case 'w':
                e.preventDefault();
                this.keys.w = true;
                break;
            case 's':
                e.preventDefault();
                this.keys.s = true;
                break;
        }
    }
    
    handleKeyUp(e) {
        switch(e.key.toLowerCase()) {
            case 'arrowup':
            case 'up':
                this.keys.up = false;
                break;
            case 'arrowdown':
            case 'down':
                this.keys.down = false;
                break;
            case 'w':
                this.keys.w = false;
                break;
            case 's':
                this.keys.s = false;
                break;
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.restartBtn.disabled = false;
        this.gameOverDiv.classList.add('hidden');
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    restartGame() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.pointsScore = 0;
        this.resetBall();
        this.resetPaddles();
        this.updateScores();
        this.gameOverDiv.classList.add('hidden');
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.restartBtn.disabled = true;
        this.gameRunning = false;
        this.gamePaused = false;
        this.draw();
    }
    
    resetBall() {
        this.ball.x = this.canvasWidth / 2;
        this.ball.y = this.canvasHeight / 2;
        // Random direction
        const angle = (Math.random() * Math.PI / 3) - Math.PI / 6; // -30 to 30 degrees
        const direction = Math.random() > 0.5 ? 1 : -1;
        this.ball.vx = direction * this.ball.speed * Math.cos(angle);
        this.ball.vy = this.ball.speed * Math.sin(angle);
    }
    
    resetPaddles() {
        this.playerPaddle.y = this.canvasHeight / 2 - this.paddleHeight / 2;
        this.aiPaddle.y = this.canvasHeight / 2 - this.paddleHeight / 2;
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // Move player paddle
        if (this.keys.up || this.keys.w) {
            this.playerPaddle.y = Math.max(0, this.playerPaddle.y - this.playerPaddle.speed);
        }
        if (this.keys.down || this.keys.s) {
            this.playerPaddle.y = Math.min(this.canvasHeight - this.paddleHeight, this.playerPaddle.y + this.playerPaddle.speed);
        }
        
        // Move AI paddle based on difficulty
        this.moveAiPaddle();
        
        // Move ball
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // Ball collision with top/bottom walls
        if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.canvasHeight) {
            this.ball.vy = -this.ball.vy;
        }
        
        // Ball collision with paddles
        this.checkPaddleCollision();
        
        // Check for scoring
        if (this.ball.x - this.ball.radius <= 0) {
            // AI scores
            this.aiScore++;
            this.resetBall();
            this.resetPaddles();
            this.updateScores();
            this.checkGameOver();
        } else if (this.ball.x + this.ball.radius >= this.canvasWidth) {
            // Player scores
            this.playerScore++;
            this.pointsScore += 5;
            this.resetBall();
            this.resetPaddles();
            this.updateScores();
            this.checkGameOver();
        }
    }
    
    moveAiPaddle() {
        const aiCenter = this.aiPaddle.y + this.paddleHeight / 2;
        const ballY = this.ball.y;
        const diff = ballY - aiCenter;
        
        let reactionSpeed = 0;
        let accuracy = 1.0;
        let aiSpeedMultiplier = 1.0;
        
        switch(this.aiDifficulty) {
            case 'easy':
                reactionSpeed = 0.15;  // Much slower reaction
                accuracy = 0.4;  // Much less accurate
                aiSpeedMultiplier = 0.6;  // Slower paddle movement
                break;
            case 'medium':
                reactionSpeed = 0.4;
                accuracy = 0.65;
                aiSpeedMultiplier = 0.8;
                break;
            case 'hard':
                reactionSpeed = 0.75;
                accuracy = 0.9;
                aiSpeedMultiplier = 1.0;
                break;
        }
        
        // Add some randomness for accuracy
        const targetY = aiCenter + diff * reactionSpeed * accuracy + (Math.random() - 0.5) * 30 * (1 - accuracy);
        
        // Use reduced speed for easier difficulties
        const currentSpeed = this.aiPaddle.speed * aiSpeedMultiplier;
        
        if (targetY < aiCenter - 2) {
            this.aiPaddle.y = Math.max(0, this.aiPaddle.y - currentSpeed);
        } else if (targetY > aiCenter + 2) {
            this.aiPaddle.y = Math.min(this.canvasHeight - this.paddleHeight, this.aiPaddle.y + currentSpeed);
        }
    }
    
    checkPaddleCollision() {
        // Player paddle collision
        if (this.ball.x - this.ball.radius <= this.playerPaddle.x + this.paddleWidth &&
            this.ball.x - this.ball.radius >= this.playerPaddle.x &&
            this.ball.y >= this.playerPaddle.y &&
            this.ball.y <= this.playerPaddle.y + this.paddleHeight) {
            
            if (this.ball.vx < 0) {
                // Calculate hit position on paddle (0 to 1)
                const hitPos = (this.ball.y - this.playerPaddle.y) / this.paddleHeight;
                // Angle based on hit position (-45 to 45 degrees)
                const angle = (hitPos - 0.5) * Math.PI / 2;
                const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
                this.ball.vx = Math.abs(this.ball.vx);
                this.ball.vy = Math.sin(angle) * speed;
            }
        }
        
        // AI paddle collision
        if (this.ball.x + this.ball.radius >= this.aiPaddle.x &&
            this.ball.x + this.ball.radius <= this.aiPaddle.x + this.paddleWidth &&
            this.ball.y >= this.aiPaddle.y &&
            this.ball.y <= this.aiPaddle.y + this.paddleHeight) {
            
            if (this.ball.vx > 0) {
                // Calculate hit position on paddle (0 to 1)
                const hitPos = (this.ball.y - this.aiPaddle.y) / this.paddleHeight;
                // Angle based on hit position (-45 to 45 degrees)
                const angle = (hitPos - 0.5) * Math.PI / 2;
                const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
                this.ball.vx = -Math.abs(this.ball.vx);
                this.ball.vy = Math.sin(angle) * speed;
            }
        }
    }
    
    checkGameOver() {
        if (this.playerScore >= 11 || this.aiScore >= 11) {
            this.gameRunning = false;
            this.gamePaused = false;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            
            if (this.playerScore >= 11) {
                this.gameOverTitle.textContent = 'You Win!';
                this.gameOverMessage.textContent = 'Congratulations! You defeated the AI!';
                this.pointsScore += 50;
            } else {
                this.gameOverTitle.textContent = 'Game Over!';
                this.gameOverMessage.textContent = 'The AI won this round. Try again!';
            }
            
            this.finalPlayerScoreElement.textContent = this.playerScore;
            this.finalAiScoreElement.textContent = this.aiScore;
            this.finalPointsElement.textContent = this.pointsScore;
            this.updateScores();
            this.gameOverDiv.classList.remove('hidden');
        }
    }
    
    updateScores() {
        this.playerScoreElement.textContent = this.playerScore;
        this.aiScoreElement.textContent = this.aiScore;
        this.pointsScoreElement.textContent = this.pointsScore;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw center line
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvasWidth / 2, 0);
        this.ctx.lineTo(this.canvasWidth / 2, this.canvasHeight);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw paddles
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.playerPaddle.x, this.playerPaddle.y, this.paddleWidth, this.paddleHeight);
        this.ctx.fillRect(this.aiPaddle.x, this.aiPaddle.y, this.paddleWidth, this.paddleHeight);
        
        // Draw ball
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Settings methods
    openSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        
        // Mark active difficulty
        this.difficultyOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.difficulty === this.aiDifficulty) {
                option.classList.add('active');
            }
        });
        
        // Mark active theme
        const currentTheme = getSavedTheme();
        this.themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === currentTheme) {
                option.classList.add('active');
            }
        });
        
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
    
    selectTheme(theme) {
        const normalized = saveTheme(theme);
        applyTheme(normalized);
        
        // Update active state in pong settings
        this.themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === normalized) {
                option.classList.add('active');
            }
        });
    }
    
    loadTheme() {
        const theme = getSavedTheme();
        applyTheme(theme);
    }
    
    selectAiDifficulty(difficulty) {
        this.aiDifficulty = difficulty;
        localStorage.setItem('pongAiDifficulty', difficulty);
        
        // Update active state
        this.difficultyOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.difficulty === difficulty) {
                option.classList.add('active');
            }
        });
    }
    
    loadAiDifficulty() {
        const difficulty = localStorage.getItem('pongAiDifficulty') || 'medium';
        this.aiDifficulty = difficulty;
        
        // Mark active difficulty
        this.difficultyOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.difficulty === difficulty) {
                option.classList.add('active');
            }
        });
    }
}

