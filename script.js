const board = document.getElementById("board");
const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");
const bestComboElement = document.getElementById("best-combo");
const messageElement = document.getElementById("message");
const restartButton = document.getElementById("restart-button");

const difficultySelect = document.getElementById("difficulty");
const timerElement = document.getElementById("timer");
const checkpointElement = document.getElementById("checkpoint-info");
const loadingElement = document.getElementById("loading");

let rhythmData;
let difficultyData;

let stage = [];

let position = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;

let gameOver = false;
let difficulty = "easy";

let checkpointTarget = 20;
let checkpointProgress = 0;
let timeRemaining = 0;

let timerInterval = null;

/* =========================
   デバッグ
========================= */

function debug(text) {

    console.log(text);

    if (loadingElement) {

        loadingElement.textContent =
            text;
    }
}

/* =========================
   起動
========================= */

window.addEventListener(
    "load",
    init
);

async function init() {

    try {

        debug(
            "rhythms.json 読込中"
        );

        const rhythmResponse =
            await fetch(
                "rhythms.json"
            );

        debug(
            "rhythms.json 取得成功"
        );

        rhythmData =
            await rhythmResponse.json();

        debug(
            "rhythms.json 解析成功"
        );

        const diffResponse =
            await fetch(
                "difficulties.json"
            );

        debug(
            "difficulties.json 取得成功"
        );

        difficultyData =
            await diffResponse.json();

        debug(
            "difficulties.json 解析成功"
        );

        debug(
            "startGame 実行"
        );

        startGame();

        debug(
            "ゲーム初期化成功"
        );

        setTimeout(() => {

            loadingElement.style.display =
                "none";

        }, 3000);

    } catch (err) {

        console.error(err);

        debug(
            "ERROR : "
            + err.name
            + " : "
            + err.message
        );

        if (messageElement) {

            messageElement.textContent =
                "読み込み失敗";
        }
    }
}

/* =========================
   開始
========================= */

function startGame() {

    debug(
        "startGame 開始"
    );

    clearTimer();

    difficulty =
        difficultySelect.value;

    position = 0;
    score = 0;
    combo = 0;
    bestCombo = 0;

    gameOver = false;

    checkpointTarget =
        difficultyData.mythic
            .checkpointStart;

    checkpointProgress = 0;

    stage = [];

    debug(
        "ステージ生成"
    );

    createStage();

    debug(
        "スコア更新"
    );

    updateScore();

    messageElement.textContent =
        "";

    restartButton.hidden =
        true;

    debug(
        "難易度設定"
    );

    setupMythic();

    debug(
        "描画"
    );

    renderBoard();

    debug(
        "startGame 完了"
    );
}

/* =========================
   ステージ生成
========================= */

function createStage() {

    stage = [];

    const groups = [
        "easy",
        "normal",
        "hard"
    ];

    for (
        let section = 0;
        section < 80;
        section++
    ) {

        const group =
            groups[
                Math.floor(
                    Math.random()
                    * groups.length
                )
            ];

        const patterns =
            rhythmData[group];

        if (
            !patterns ||
            patterns.length === 0
        ) {

            throw new Error(
                group +
                " の譜面がありません"
            );
        }

        const pattern =
            patterns[
                Math.floor(
                    Math.random()
                    * patterns.length
                )
            ];

        for (
            let i = 0;
            i < pattern.length;
            i++
        ) {

            stage.push({

                red:
                    pattern.red.includes(
                        i
                    ),

                painted: false
                
               　separator:
                    i === pattern.length - 1

            });
        }
    }

    debug(
        "生成マス数 : "
        + stage.length
    );
}

/* =========================
   難易度
========================= */

function currentDifficultyData() {

    return difficultyData[
        difficulty
    ];
}

function shouldShowRed(
    index
) {

    const diff =
        currentDifficultyData();

    if (
        diff.showAllRed
    ) {

        return true;
    }

    const vision =
        diff.vision ?? 2;

    return (
        Math.abs(
            index - position
        ) <= vision
    );
}

/* =========================
   描画
========================= */

function renderBoard() {

    debug(
        "描画開始"
    );

    board.innerHTML = "";

    stage.forEach(

        (cell, index) => {

            const div =
                document.createElement(
                    "div"
                );

            div.classList.add(
                "cell"
            );
           
           if (cell.separator) {

            div.classList.add(
               "separator"
            );
            }

            if (
                cell.red &&
                shouldShowRed(
                    index
                )
            ) {

                div.classList.add(
                    "red"
                );
            }

            if (
                cell.painted
            ) {

                div.classList.add(
                    "painted"
                );
            }

            if (
                index ===
                position
            ) {

                div.classList.add(
                    "current"
                );
            }

            board.appendChild(
                div
            );
        }

    );

    debug(
        "scrollToPlayer"
    );

    updateBoardPosition();
}
/* =========================
   スクロール
========================= */
function updateBoardPosition() {

    const wrapper =
        document.getElementById(
            "board-wrapper"
        );

    const cellSize = 44;

    const center =
        wrapper.clientWidth / 2;

    const offset =
        center -
        (position * cellSize) -
        (cellSize / 2);

    board.style.transform =
        `translateX(${offset}px)`;
}


/* =========================
   スコア
========================= */

function updateScore() {

    scoreElement.textContent =
        score;

    comboElement.textContent =
        combo;

    bestComboElement.textContent =
        bestCombo;
}

/* =========================
   右へ進む
========================= */

function moveRight() {

    if (gameOver)
        return;

    const cell =
        stage[position];

    if (
        !cell.red &&
        !cell.painted
    ) {

        messageElement.textContent =
            "先に塗ってください";

        setTimeout(() => {

            if (!gameOver) {

                messageElement.textContent =
                    "";
            }

        }, 1000);

        return;
    }

    if (
        position >=
        stage.length - 1
    ) {

        winGame();
        return;
    }

    position++;

    
    if (
        difficulty ===
        "mythic"
    ) {

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

    const currentCell =
        stage[position];

    if (
        currentCell &&
        currentCell.red
    ) {

        messageElement.textContent =
            "SKIP!";

        setTimeout(() => {

            if (!gameOver) {

                messageElement.textContent =
                    "";
            }

        }, 500);
    }
}

/* =========================
   塗る
========================= */

function paintCell() {

    if (gameOver)
        return;

    const cell =
        stage[position];

    if (cell.red) {

        endGame(
            "赤マスでSPACE"
        );

        return;
    }

    if (cell.painted) {

        return;
    }

    cell.painted = true;

    combo++;

    if (
        combo >
        bestCombo
    ) {

        bestCombo =
            combo;
    }

    score += 100;

    if (
        combo % 10 === 0
    ) {

        score += 500;

        messageElement.textContent =
            combo +
            " COMBO!";

        setTimeout(() => {

            if (!gameOver) {

                messageElement.textContent =
                    "";
            }

        }, 1000);
    }

    updateScore();

    renderBoard();

    moveRight();
}

/* =========================
   MYTHIC
========================= */

function setupMythic() {

    timerElement.textContent =
        "";

    checkpointElement.textContent =
        "";

    if (
        difficulty !==
        "mythic"
    ) {

        return;
    }

    timeRemaining =
        checkpointTarget / 2;

    updateTimer();
    updateCheckpoint();

    timerInterval =
        setInterval(() => {

            if (
                gameOver
            ) {

                return;
            }

            timeRemaining -= 0.1;

            updateTimer();

            if (
                timeRemaining <= 0
            ) {

                endGame(
                    "時間切れ"
                );
            }

        }, 100);
}

function updateTimer() {

    if (
        difficulty !==
        "mythic"
    ) {

        timerElement.textContent =
            "";

        return;
    }

    timerElement.textContent =
        "残り時間 : " +
        timeRemaining.toFixed(1) +
        "秒";
}

function updateCheckpoint() {

    if (
        difficulty !==
        "mythic"
    ) {

        checkpointElement.textContent =
            "";

        return;
    }

    checkpointElement.textContent =
        "Checkpoint "
        + checkpointProgress
        + "/"
        + checkpointTarget;
}

function checkpointClear() {

    score += 1000;

    checkpointTarget =
        Math.round(
            checkpointTarget *
            difficultyData
                .mythic
                .checkpointMultiplier
        );

    checkpointProgress = 0;

    timeRemaining =
        checkpointTarget / 2;

    updateTimer();
    updateCheckpoint();

    messageElement.textContent =
        "CHECKPOINT CLEAR!";

    setTimeout(() => {

        if (!gameOver) {

            messageElement.textContent =
                "";
        }

    }, 1500);
}

/* =========================
   終了
========================= */

function endGame(
    reason
) {

    gameOver = true;

    clearTimer();

    messageElement.textContent =
        "GAME OVER : "
        + reason;

    restartButton.hidden =
        false;

    debug(
        "GAME OVER"
    );
}

function winGame() {

    gameOver = true;

    clearTimer();

    messageElement.textContent =
        "STAGE CLEAR!";

    restartButton.hidden =
        false;

    debug(
        "STAGE CLEAR"
    );
}

function clearTimer() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }
}

/* =========================
   UI
========================= */

restartButton.addEventListener(
    "click",
    startGame
);

difficultySelect.addEventListener(
    "change",
    startGame
);

/* =========================
   キー操作
========================= */

document.addEventListener(
    "keydown",

    event => {

        if (
            gameOver
        ) {

            return;
        }

        if (
            event.code ===
            "ArrowRight"
        ) {

            event.preventDefault();

            moveRight();
        }

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            paintCell();
        }
    }
);
