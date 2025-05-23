let players = Array();
if (localStorage.players) {
    players = JSON.parse(localStorage.players);
}

let player = "";
let playerScore = 0;
let gameType = "";
let difficultyLevel = 1;
var game;
let index = 0;
let errors = 0;
let timeLeft = 0;

let startSound = new Audio('sounds/lambo-start-up-sound.mp3');
let errorSound = new Audio('sounds/error.mp3');
let successSound = new Audio("sounds/success.mp3");
let welldoneSound = new Audio("sounds/success-fanfare-trumpets.mp3");
let badScoreSound = new Audio("sounds/lostGame.mp3");
var bg_sound = new Audio('sounds/fast-rocky-loop-275535.mp3');
bg_sound.volume = 0.2;
let soundOn = true;


$.when($.ready).then(function () {
    // Create a dummy jQuery object to act as an event bus
    const eventBus = $({});


    // Custom event listeners
    eventBus.on("playerSet", function (event, data) {
        console.log("Event 'playerSet' triggered with data:", data);
    });
    displayPlayers();
    $("#createPlayer").on("click", function () {
        player = $("#playerName").val();
        if (player == "") {
            alert("Entrer le nom du joueur!");
        } else if (playerNameExists(player)) {
            alert('Ce nom de joueur existe déjà, choisit-en un autre.');
            player = "";
        } else {
            players.push(player);
            localStorage.players = JSON.stringify(players);
            displayPlayers();
            eventBus.trigger("playerSet", [player])
        }
    });
    // Get the player name
    $(".player>p").on("click", function () {
        player = $(this).text();
        if (player == "") {
            alert("Mince, il y a problème avec ce joueur. Créer un nouveau joueur et se plaindre à Sylvain.");
        }
        eventBus.trigger("playerSet", player)
    });
    // if the player is selected, let's pick the game
    eventBus.on("playerSet", function (data) {
        $(".players").hide(400);
        $(".welcome>h1").html(`Salut ${player}!`);
        $(".welcome").show(400);
        $(".gameSettings").show(500);
        $("#gameMap").show(500);
        bg_sound.addEventListener('ended', function () {
            if (soundOn) {
                this.currentTime = 0;
                this.play();
            }
        }, false);
        if (soundOn) {
            bg_sound.play();
        }
    });
    $("#wizard").on("click", function () {
        $("#gameSelector option:eq(0)").prop("selected", true);
        showGameSetting();
    });
    $("#chaumiere").on("click", function () {
        $("#gameSelector option:eq(0)").prop("selected", true);
        showGameSetting();
    });
    $("#tower").on("click", function () {
        $("#gameSelector option:eq(1)").prop("selected", true);
        showGameSetting();
    });
    $("#chaudron").on("click", function () {
        $("#gameSelector option:eq(2)").prop("selected", true);
        showGameSetting();
    });
    $("#castle").on("click", function () {
        $("#gameSelector option:eq(3)").prop("selected", true);
        showGameSetting();
    });
    $("#ChampionsCup").on("click", function () {
        $("#gameSelector option:eq(4)").prop("selected", true);
        showGameSetting();
    });

    $(".options").on("click", function () {
        $(".limits").toggle(200);
    });
    // Initialize Game settings
    $("#startGame").on("click", function () {
        gameType = $("#gameSelector").val();
        difficultyLevel = $("#level").val();
        let nbQuestions = $("#nbQuestions").val();

        let options = new Options();
        $(".gameSettings").hide();
        game = new Game(gameType, difficultyLevel, nbQuestions, options);
        $(".gameSettings").hide(100);
        nextQuestion(game);
        startSound.play();
        $(".gameArea").show();
        startCountdown(game.totalTime);
        $("#answer").trigger("focus");
    });
    // Check answer and get the next one:
    $("#checkAnswer").on("click", function () {
        checkAnswerGoNext(game);
    });
    $("#answer").on("keypress", function (event) {
        // Check if the key pressed is Enter (key code 13)
        if (event.which === 13) {
            event.preventDefault();
            if ($(this).val().trim() !== "") {
                checkAnswerGoNext(game);
            }
        }
    });
    $(".NewGame").on("click", function () {
        $(".gameComplete").hide();
        $("#gameMap").show(500);
    });
    $(".changePlayer").on("click", function () {
        $(".gameComplete").hide();
        $(".players").show(500);
    });
});

function Game(gameType, difficultyLevel, nbQuestions, options) {
    let time = 0;
    let rand1 = [];
    let rand2 = [];
    let results = [];
    let question = "";
    let operator = [];
    let challenge = [];
    let min = parseInt(options.min);
    let max = parseInt(options.max);
    // difficulty level in seconds
    // Number of seconds the player has to answer the question
    switch (difficultyLevel) {
        case "1":
            time = 30;
            break;
        case "2":
            time = 20;
            break;
        case "3":
            time = 10;
            break;
        case "4":
            time = 5;
            break;
        default:
            time = 15
    }
    let totalTime = time * nbQuestions;

    if (gameType == "random") {
        let randOp = Math.floor(Math.random() * 4);
        if (randOp == 1) { gameType = "add"; } else
            if (randOp == 2) { gameType = "sub"; } else
                if (randOp == 3) { gameType = "mult"; } else
                    if (randOp == 4) { gameType = "div"; }
    }
    switch (gameType) {
        case "add":
            question = "Ajoute ces chiffres:"
            for (let i = 0; i < nbQuestions; i++) {
                let firstRand = Math.floor(Math.random() * (max - min + 1)) + min;
                let secondRand = Math.floor(Math.random() * (max - min + 1)) + min;
                rand1.push(firstRand);
                rand2.push(secondRand);
                operator.push(" + ");
                results.push(firstRand + secondRand);
                challenge.push(firstRand + operator[i] + secondRand);
            }
            break;
        case "sub":
            question = "Soustrait ces chiffres:"
            for (let i = 0; i < nbQuestions; i++) {
                let firstRand = Math.floor(Math.random() * (max - min + 1)) + min;
                let secondRand = Math.floor(Math.random() * (max - min + 1)) + min;
                // if negative results are allowed the order can be random, else, the biggest number must always be first.
                let positif = (options.positif == "on") ? true : false;
                if (positif) {
                    if (firstRand > secondRand) {
                        rand1.push(firstRand);
                        rand2.push(secondRand);
                    } else {
                        rand1.push(secondRand);
                        rand2.push(firstRand);
                    }
                } else {
                    rand1.push(firstRand);
                    rand2.push(secondRand);
                }
                operator.push(" - ");
                results.push(rand1[i] - rand2[i]);
                challenge.push(rand1[i] + operator[i] + rand2[i]);
            }
            break;
        case "mult":
            question = "Multiplie ces chiffres:"
            for (let i = 0; i < nbQuestions; i++) {
                let firstRand = Math.floor(Math.random() * (max - min + 1)) + min;
                // selects randomly one of the multiplication tables activated.
                let tables = options.tables.split(',');
                let secondRand = Math.floor(Math.random() * (tables.length - 0)) + min;
                secondRand = tables[secondRand];
                rand1.push(firstRand);
                rand2.push(secondRand);
                operator.push(" x ");
                results.push(firstRand * secondRand);
                challenge.push(firstRand + operator[i] + secondRand);
            }
            break;
        case "div":
            question = "Divise ces chiffres:"
            for (let i = 0; i < nbQuestions; i++) {
                let firstRand = Math.floor(Math.random() * (max - min + 1)) + min;
                let secondRand = Math.floor(Math.random() * (max - min + 1)) + min;
                // Avoid dividing by zero. todo: Loop through rands later to get a better question.
                if (firstRand == 0) { firstRand++; }
                if (secondRand == 0) { secondRand++; }
                let first = firstRand * secondRand;
                rand1.push(first);
                rand2.push(firstRand);
                operator.push(" / ");
                results.push(secondRand);
                challenge.push(first + operator[i] + firstRand);
            }
            break;
    }
    // Create the gameData object
    const gameData = {
        gameType,
        difficultyLevel,
        nbQuestions,
        totalTime,
        question,
        results,
        operator,
        challenge
    };
    return gameData;
}
function Options() {
    let positif = $("#positif").val();
    let min = $("#min").val();
    let max = $("#max").val();
    let tables = $("#tables").val();

    const options = {
        positif, min, max, tables
    }
    return options;
}
function displayPlayers() {
    players = localStorage.players;
    if (players) {
        players = JSON.parse(players);
        for (var i = 0; i < players.length; i++) {
            $(".player").append(`<p>${players[i]}</p>`);
        }
    }
    else {
        players = Array();
    }

}
function playerNameExists(name) {
    if (localStorage.players == null) {
        return false;
    }
    players = JSON.parse(localStorage.players || []);
    let val = players.some(player => player == name);
    return val;
}

function nextQuestion(game) {
    if (index >= game.nbQuestions) {
        gameComplete();
        return;
    }
    $(".question").html(`<h2>${game.question}</h2>`);
    const challenge = game.challenge[index];
    $(".challenge").html(challenge);
    $("#answer").val("");
    $("#answer").trigger("focus");

}

function checkAnswerGoNext(game) {
    let answer = $("#answer").val();
    if (answer == parseInt(game.results[index])) {
        successSound.play();
        index++;
        playerScore++;
    } else {
        errorSound.play();
        errors++;
    }
    nextQuestion(game);
}
/**
 * the last question has been answered. Time to tally up the score and give a rating. 
*/
function gameComplete() {
    bg_sound.pause();
    soundOn = false;
    $(".gameArea").hide();
    $(".question").html("");
    $(".challenge").html("");
    $("#answer").val("");
    // Compute the score
    let timeLeftPercent = (game.totalTime - timeLeft) / game.totalTime;
    let timeBonus = Math.ceil(playerScore * timeLeftPercent);
    let errorPercent = errors / game.nbQuestions;
    let errorPenalty = Math.ceil(playerScore * (errorPercent));
    let finalScore = playerScore + timeBonus - errorPenalty;
    $(".gameComplete").show(200);
    $("#score").html(`Your score: ${playerScore}`);
    $("#timeBonus").html(`Bonus Vitesse: ${timeBonus}`);
    $("#errors").html(`Erreurs: ${errors}`);    
    $("#errorPenalities").html(`Pénalité: ${errorPenalty}`);
    $("#finalScore").html(`Score final: ${finalScore}`);
    if (errors > game.nbQuestions / 3) {
        $("#eval").html(`${player} est une <b>Banane</b>!`);
        badScoreSound.play();
    } else {
        $("#eval").html(`${player} est un <b>Génie</b>!`);
        welldoneSound.play();
    }
    playerScore = 0;
    errors = 0;
    index = 0;
    game = null;
    difficultyLevel = 0;
}
function showGameSetting() {
    $("#gameMap").hide(200);
    $(".limits").show();
    $(".gameSettings").show();
}

// Countdown timer function
function startCountdown(totalTime) {
    const countdownDiv = $(".countdown");
    countdownDiv.css("width", "100%");
    timeLeft = totalTime;
    const interval = setInterval(() => {
        const percentage = (timeLeft / totalTime) * 100;
        countdownDiv.css("width", percentage + "%");
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(interval);
            countdownDiv.css("width", "0%");
            gameComplete()
        }
    }, 1000);
}
