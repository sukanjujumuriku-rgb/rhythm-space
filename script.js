const board = document.getElementById("board");
const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");
const bestComboElement = document.getElementById("best-combo");
const messageElement = document.getElementById("message");
const restartButton = document.getElementById("restart-button");
const loadingElement = document.getElementById("loading");

let stage = [];

let position = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;

let gameOver = false;

/* ==========================
   初期化
========================== */

async function init() {

    const rhythmData = await fetch("rhythms.json")
        .then(res => res.json());

    createStage(rhythmData);

    renderBoard();

    loadingElement.style.display = "none";
}

init();

/* ==========================
   ステージ生成
========================== */

function createStage(data) {

    stage = [];

    const difficulties = [
        "easy",
        "normal",
        "hard"
    ];

    for (let section = 0; section < 60; section++) {

        const difficulty =
            difficulties[
                Math.floor(Math.random() * difficulties.length)
            ];

        const patterns = data[difficulty];

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
   描画
========================== */

function renderBoard() {

    board.innerHTML = "";

    stage.forEach((cell, index) => {

        const div = document.createElement("div");

        div.classList.add("cell");

        if (cell.red) {
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
   前進
========================== */

function moveRight() {

    if (gameOver) return;

    if (position < stage.length - 1) {

        position++;
        score++;

        scoreElement.textContent = score;

        renderBoard();
    }
}

/* ==========================
   塗る
========================== */

function paintCell() {

    if (gameOver) return;

    const cell = stage[position];

    if (cell.red) {

        endGame();
        return;
    }

    if (!cell.painted) {

        cell.painted = true;

        combo++;

        if (combo > bestCombo) {
            bestCombo = combo;
        }

    } else {

        combo = 0;
    }

    comboElement.textContent = combo;
    bestComboElement.textContent = bestCombo;

    renderBoard();
}

/* ==========================
   ゲームオーバー
========================== */

function endGame() {

    gameOver = true;

    messageElement.textContent =
        "GAME OVER";

    restartButton.hidden = false;
}

/* ==========================
   リスタート
========================== */

restartButton.addEventListener(
    "click",
    () => location.reload()
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
