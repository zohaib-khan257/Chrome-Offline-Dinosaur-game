/**
 * Client-side game engine for Dino Run.
 * The game has no server state: high scores live in localStorage.
 */

class ScoreBoard {
  constructor(scoreElement, highScoreElement) {
    this.scoreElement = scoreElement;
    this.highScoreElement = highScoreElement;
    this.storageKey = "django-dino-high-score";
    this.highScore = Number.parseInt(localStorage.getItem(this.storageKey) || "0", 10);
    this.render(0);
  }

  render(score) {
    this.scoreElement.textContent = String(Math.floor(score)).padStart(5, "0");
    this.highScoreElement.textContent = String(this.highScore).padStart(5, "0");
  }

  saveHighScore(score) {
    if (score > this.highScore) {
      this.highScore = Math.floor(score);
      localStorage.setItem(this.storageKey, String(this.highScore));
    }
    this.render(score);
  }
}

class Obstacle {
  constructor(type, element, stageWidth) {
    this.type = type;
    this.element = element;
    this.x = stageWidth + 30;
  }

  move(speed) {
    this.x -= speed;
    this.element.style.transform = `translateX(${this.x}px)`;
  }

  get bounds() {
    return this.element.getBoundingClientRect();
  }
}

class DinosaurGame {
  constructor() {
    this.stage = document.querySelector("#game-stage");
    this.dinosaur = document.querySelector("#dinosaur");
    this.obstacleLayer = document.querySelector("#obstacle-layer");
    this.ground = document.querySelector("#ground");
    this.message = document.querySelector("#game-message");
    this.restartButton = document.querySelector("#restart-button");
    this.themeButton = document.querySelector(".theme-toggle");
    this.scoreBoard = new ScoreBoard(
      document.querySelector("#score"),
      document.querySelector("#high-score"),
    );

    this.isRunning = false;
    this.isJumping = false;
    this.isDucking = false;
    this.score = 0;
    this.speed = 6;
    this.groundOffset = 0;
    this.obstacles = [];
    this.nextObstacleAt = 0;
    this.lastFrameTime = 0;
    this.frameId = null;
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
    document.addEventListener("keyup", (event) => this.handleKeyUp(event));
    this.stage.addEventListener("pointerdown", () => this.handleTap());
    this.restartButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.start();
    });
    this.themeButton.addEventListener("click", () => {
      document.body.classList.toggle("is-night");
    });
  }

  handleKeyDown(event) {
    if (["Space", "ArrowUp", "ArrowDown"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "Space" || event.code === "ArrowUp") {
      this.isRunning ? this.jump() : this.start();
    }
    if (event.code === "ArrowDown" && this.isRunning && !this.isJumping) {
      this.duck(true);
    }
  }

  handleKeyUp(event) {
    if (event.code === "ArrowDown") {
      this.duck(false);
    }
  }

  handleTap() {
    this.isRunning ? this.jump() : this.start();
  }

  start() {
    cancelAnimationFrame(this.frameId);
    this.obstacles.forEach((obstacle) => obstacle.element.remove());
    this.obstacles = [];
    this.score = 0;
    this.speed = 6;
    this.nextObstacleAt = 55;
    this.lastFrameTime = performance.now();
    this.isRunning = true;
    this.isJumping = false;
    this.duck(false);
    this.dinosaur.style.bottom = "38px";
    this.dinosaur.classList.add("is-running");
    this.message.classList.add("is-hidden");
    this.stage.focus({ preventScroll: true });
    this.frameId = requestAnimationFrame((time) => this.update(time));
  }

  jump() {
    if (this.isJumping) return;
    this.isJumping = true;
    this.duck(false);
    this.dinosaur.classList.remove("is-running");
    const jumpHeight = 118;
    const startTime = performance.now();
    const duration = 560;

    const animateJump = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const height = Math.sin(progress * Math.PI) * jumpHeight;
      this.dinosaur.style.bottom = `${38 + height}px`;
      if (progress < 1 && this.isRunning) {
        requestAnimationFrame(animateJump);
      } else {
        this.dinosaur.style.bottom = "38px";
        this.isJumping = false;
        this.dinosaur.classList.add("is-running");
      }
    };
    requestAnimationFrame(animateJump);
  }

  duck(shouldDuck) {
    this.isDucking = shouldDuck;
    this.dinosaur.classList.toggle("is-ducking", shouldDuck);
  }

  createObstacle() {
    const isBird = this.score > 180 && Math.random() < 0.28;
    const element = document.createElement("div");
    const image = document.createElement("img");
    const type = isBird ? "bird" : "cactus";
    const isLargeCactus = !isBird && Math.random() < 0.38;

    element.className = `obstacle ${type}${isLargeCactus ? " is-large" : ""}`;
    image.src = isBird ? this.stage.dataset.birdSrc : this.stage.dataset.cactusSrc;
    image.alt = "";
    element.append(image);
    this.obstacleLayer.append(element);
    this.obstacles.push(new Obstacle(type, element, this.stage.clientWidth));
  }

  update(time) {
    if (!this.isRunning) return;
    const delta = Math.min(time - this.lastFrameTime, 40) / 16.67;
    this.lastFrameTime = time;
    this.score += delta;
    this.speed = Math.min(15, 6 + this.score / 180);
    this.scoreBoard.render(this.score);
    this.groundOffset = (this.groundOffset - this.speed * delta) % 48;
    this.ground.style.backgroundPositionX = `${this.groundOffset}px`;

    if (this.score >= this.nextObstacleAt) {
      this.createObstacle();
      this.nextObstacleAt = this.score + 55 + Math.random() * 75;
    }

    this.obstacles = this.obstacles.filter((obstacle) => {
      obstacle.move(this.speed * delta);
      if (obstacle.x < -100) {
        obstacle.element.remove();
        return false;
      }
      if (this.hasCollision(obstacle)) this.end();
      return true;
    });

    this.frameId = requestAnimationFrame((nextTime) => this.update(nextTime));
  }

  hasCollision(obstacle) {
    const dino = this.dinosaur.getBoundingClientRect();
    const target = obstacle.bounds;
    const padding = obstacle.type === "bird" ? 10 : 8;
    return (
      dino.left + padding < target.right - padding &&
      dino.right - padding > target.left + padding &&
      dino.top + padding < target.bottom - padding &&
      dino.bottom - padding > target.top + padding
    );
  }

  end() {
    if (!this.isRunning) return;
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    this.dinosaur.classList.remove("is-running");
    this.scoreBoard.saveHighScore(this.score);
    this.message.querySelector(".message-title").textContent = "Game over";
    this.message.querySelector("p:not(.message-title)").textContent = `Score: ${Math.floor(this.score)} — try again?`;
    this.restartButton.textContent = "Restart game";
    this.message.classList.remove("is-hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => new DinosaurGame());
