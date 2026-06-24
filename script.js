
const board = document.getElementById("board");
const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");
const bestComboElement = document.getElementById("best-combo");
const messageElement = document.getElementById("message");
const restartButton = document.getElementById("restart-button");
const loadingElement = document.getElementById("loading");

const difficultySelect = document.getElementById("difficulty");
const timerElement = document.getElementById("timer");
const checkpointElement = document.getElementById("checkpoint-info");

let rhythmData;
let difficultyData;

let stage = [];

let position = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;

let gameOver = false;
let difficulty = "easy";

/* ==========================
   MYTHIC
========================== */

let checkpointTarget = 20;
let checkpointProgress = 0;

let timeRemaining = 0;

let timerInterval = null;

/* ==========================
   起動
========================== */

window.addEventListener("load", init);

async function init() {

    try {

        [rhythmData, difficultyData] = await Promise.all([
            fetch("rhythms.json").then(r => r.json()),
            fetch("difficulties.json").then(r => r.json())
        ]);

        startGame();

        loadingElement.style.display = "none";

    } catch (err) {

        console.error(err);

        messageElement.textContent =
            "データ読み込み失敗";
    }
}

/* ==========================
   ゲーム開始
========================== */

function startGame() {

    clearTimer();

    difficulty = difficultySelect.value;

    position = 0;
    score = 0;
    combo = 0;
    bestCombo = 0;

    gameOver = false;

    checkpointTarget =
        difficultyData.mythic.checkpointStart;

    checkpointProgress = 0;

    stage = [];

    createStage();

    updateScore();

    messageElement.textContent = "";

    restartButton.hidden = true;

    setupMythic();

    renderBoard();
}

/* ==========================
   ステージ生成
========================== */

function createStage() {

    stage = [];

    const groups = [
        "easy",
        "normal",
        "hard"
    ];

    for (let section = 0; section < 80; section++) {

        const group =
            groups[
                Math.floor(Math.random() * groups.length)
            ];

        const patterns = rhythmData[group];

        const pattern =
            patterns[
                Math.floor(Math.random() * patterns.length)
            ];

        for (let i = 0; i < pattern.length; i++) {

            stage.push({
                red: pattern.red.includes(i),
                painted: false
            });

        }
    }
}

/* ==========================
   難易度
========================== */

function currentDifficultyData() {

    return difficultyData[difficulty];
}

function shouldShowRed(index) {

    const diff = currentDifficultyData();

    if (diff.showAllRed) {
        return true;
    }

    const vision = diff.vision ?? 2;

    return Math.abs(index - position) <= vision;
}

/* ==========================
   描画
========================== */

function renderBoard() {

    board.innerHTML = "";

    stage.forEach((cell, index) => {

        const div = document.createElement("div");

        div.classList.add("cell");

        if (cell.red && shouldShowRed(index)) {
            div.classList.add("red");
        }

        if (cell.painted) {
            div.classList.add("painted");
        }

        if (index === position) {
            div.classList.add("current");
        }

        board.appendChild(div);
    });

    scrollToPlayer();
}

/* ==========================
   スクロール
========================== */

function scrollToPlayer() {

    const current =
        board.children[position];

    if (!current) return;

    current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
    });
}

/* ==========================
   スコア
========================== */

function updateScore() {

    scoreElement.textContent = score;
    comboElement.textContent = combo;
    bestComboElement.textContent = bestCombo;
}

/* ==========================
   前進
========================== */

function moveRight() {

    if (gameOver) return;

    if (position >= stage.length - 1) {

        winGame();
        return;
    }

    position++;

    score++;

    if (difficulty === "mythic") {

        checkpointProgress++;

        updateCheckpoint();

        if (
            checkpointProgress >=
            checkpointTarget
        ) {

            checkpointClear();
        }
    }

    updateScore();

    renderBoard();
}

/* ==========================
   塗る
========================== */

function paintCell() {

    if (gameOver) return;

    const cell = stage[position];

    if (cell.red) {

        endGame(
            "赤マスでSPACEを押しました"
        );

        return;
    }

    if (!cell.painted) {

        cell.painted = true;

        combo++;

        if (combo > bestCombo) {
            bestCombo = combo;
        }

        score += 10;

    } else {

        combo = 0;
    }

    updateScore();

    renderBoard();
}

/* ==========================
   MYTHIC
========================== */

function setupMythic() {

    timerElement.textContent = "";
    checkpointElement.textContent = "";

    if (difficulty !== "mythic") {
        return;
    }

    timeRemaining =
        checkpointTarget / 2;

    updateCheckpoint();

    timerInterval = setInterval(() => {

        if (gameOver) return;

        timeRemaining -= 0.1;

        updateTimer();

        if (timeRemaining <= 0) {

            endGame(
                "時間切れ"
            );
        }

    }, 100);
}

function updateTimer() {

    if (difficulty !== "mythic") {

        timerElement.textContent = "";

        return;
    }

    timerElement.textContent =
        "残り時間: " +
        timeRemaining.toFixed(1) +
        "秒";
}

function updateCheckpoint() {

    if (difficulty !== "mythic") {

        checkpointElement.textContent = "";

        return;
    }

    checkpointElement.textContent =
        `Checkpoint ${checkpointProgress}/${checkpointTarget}`;
}

function checkpointClear() {

    score += 1000;

    checkpointTarget =
        Math.round(
            checkpointTarget *
            difficultyData.mythic
                .checkpointMultiplier
        );

    checkpointProgress = 0;

    timeRemaining =
        checkpointTarget / 2;

    updateCheckpoint();

    updateTimer();

    messageElement.textContent =
        "CHECKPOINT CLEAR!";

    setTimeout(() => {

        if (!gameOver) {

            messageElement.textContent =
                "";
        }

    }, 1500);
}

/* ==========================
   終了
========================== */

function endGame(reason) {

    gameOver = true;

    clearTimer();

    messageElement.textContent =
        "GAME OVER : " + reason;

    restartButton.hidden = false;
}

function winGame() {

    gameOver = true;

    clearTimer();

    messageElement.textContent =
        "STAGE CLEAR!";

    restartButton.hidden = false;
}

function clearTimer() {

    if (timerInterval) {

        clearInterval(timerInterval);

        timerInterval = null;
    }
}

/* ==========================
   リスタート
========================== */

restartButton.addEventListener(
    "click",
    startGame
);

/* ==========================
   難易度変更
========================== */

difficultySelect.addEventListener(
    "change",
    startGame
);

/* ==========================
   キー操作
========================== */

document.addEventListener(
    "keydown",
    (event) => {

        if (gameOver) return;

        if (event.code === "ArrowRight") {

            event.preventDefault();

            moveRight();
        }

        if (event.code === "Space") {

            event.preventDefault();

            paintCell();
        }

    }
);
