const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let bird;
let gravity = 0.5; // Adjusted gravity
let jump = -8; // Adjusted jump force
let pipes = [];
let gameSpeed = 2;
let score = 0;
let highScore = 0;
let gameStarted = false;
let frames = 0; // Define and initialize frames variable

// Images
const birdImg = new Image();
birdImg.src = 'bird.png';
const pipeImg = new Image();
pipeImg.src = 'pipe.png';

// Bird class
class Bird {
    constructor() {
        this.x = 50;
        this.y = canvas.height / 2;
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.lift = jump;
    }

    draw() {
        ctx.drawImage(birdImg, this.x, this.y, this.width, this.height);
    }

    update() {
        this.velocity += gravity;
        this.y += this.velocity;

        if (this.y >= canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.velocity = 0;
        }

        if (this.y <= 0) {
            this.y = 0;
            this.velocity = 0;
        }
    }

    flap() {
        this.velocity += this.lift;
    }
}

// Pipe class
class Pipe {
    constructor() {
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 200) + 100;
        this.width = 52;
        this.height = 320;
        this.dx = -gameSpeed;
    }

    draw() {
        ctx.drawImage(pipeImg, this.x, this.y - this.height, this.width, this.height);
        ctx.drawImage(pipeImg, this.x, this.y + 100, this.width, this.height);
    }

    update() {
        this.x += this.dx;
    }

    offscreen() {
        return this.x + this.width < 0;
    }

    collide(bird) {
        // Check for vertical collision
        if (
            bird.x < this.x + this.width &&
            bird.x + bird.width > this.x &&
            bird.y < this.y + this.height &&
            bird.y + bird.height > this.y
        ) {
            // Check for horizontal collision (bird's x position within pipe's x range)
            if (bird.x + bird.width > this.x && bird.x < this.x + this.width) {
                return true;
            }
        }
        return false;
    }
}

function setup() {
    bird = new Bird();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bird.draw();
    bird.update();

    if (frames % 100 === 0) {
        pipes.push(new Pipe());
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].draw();
        pipes[i].update();

        if (pipes[i].collide(bird)) {
            console.log('Game Over');
            if (score > highScore) {
                highScore = score;
                document.getElementById('highScoreValue').textContent = highScore;
            }
            resetGame();
        }

        if (pipes[i].offscreen()) {
            pipes.splice(i, 1);
            score++;
        }
    }

    ctx.fillStyle = '#000';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);

    frames++; // Increment frames variable

    requestAnimationFrame(draw); // Call draw recursively
}

function resetGame() {
    pipes = [];
    score = 0;
    bird = new Bird();
    gameStarted = false;
    document.getElementById('startScreen').style.display = 'block';
    document.getElementById('gameCanvas').style.display = 'none';
}

setup();

document.getElementById('startButton').addEventListener('click', function() {
    if (!gameStarted) {
        gameStarted = true;
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';
        draw();
    }
});

window.addEventListener('keydown', function (e) {
    if (gameStarted && e.code === 'Space') {
        bird.flap();
    }
});
