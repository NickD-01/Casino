const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let deck = [];
let players = [];
let dealerHand = [];
let currentPlayerIndex = 0;
let gameOver = false;

const dealerHandElement = document.getElementById('dealer-hand');
const playersContainer = document.getElementById('players-container');
const addPlayerButton = document.getElementById('add-player-button');
const newGameButton = document.getElementById('new-game-button');
const messageElement = document.getElementById('message');

class Player {
    constructor(id) {
        this.id = id;
        this.hands = [[]];
        this.currentHand = 0;
        this.bet = 10;
        this.element = createPlayerElement(id);
    }
}

function createPlayerElement(id) {
    const playerElement = document.createElement('div');
    playerElement.className = 'player';
    playerElement.innerHTML = `
        <div class="player-icon"><i class="fas fa-user"></i></div>
        <h2>Player ${id}</h2>
        <div class="hand"></div>
        <div class="controls">
            <button class="hit-button">Hit</button>
            <button class="stand-button">Stand</button>
            <button class="double-button">Double Down</button>
            <button class="split-button">Split</button>
        </div>
    `;
    playersContainer.appendChild(playerElement);

    const hitButton = playerElement.querySelector('.hit-button');
    const standButton = playerElement.querySelector('.stand-button');
    const doubleButton = playerElement.querySelector('.double-button');
    const splitButton = playerElement.querySelector('.split-button');

    hitButton.addEventListener('click', () => hit(players[id - 1]));
    standButton.addEventListener('click', () => stand(players[id - 1]));
    doubleButton.addEventListener('click', () => doubleDown(players[id - 1]));
    splitButton.addEventListener('click', () => split(players[id - 1]));

    return playerElement;
}

function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCard() {
    if (deck.length === 0) {
        console.error('Deck is empty!');
        return null;
    }
    return deck.pop();
}

function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;

    for (let card of hand) {
        if (!card || !card.value) {
            console.error('Invalid card:', card);
            continue;
        }

        if (card.value === 'A') {
            aceCount++;
            value += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }

    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount--;
    }

    return value;
}

function updateHandDisplay(hand, element, score) {
    let handElement;
    if (element === dealerHandElement) {
        handElement = element.querySelector('.hand');
    } else {
        handElement = element.querySelector('.hand');
    }
    
    if (!handElement) {
        console.error('Hand element not found:', element);
        return;
    }
    handElement.innerHTML = `<h3>Hand Value: ${score}</h3>`;
    for (let card of hand) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = `${card.value}${card.suit}`;
        cardElement.style.color = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
        handElement.appendChild(cardElement);
    }
}

function updateDealerHand(showAll = false) {
    const visibleHand = showAll ? dealerHand : [dealerHand[0], { suit: '?', value: '?' }];
    const score = showAll ? calculateHandValue(dealerHand) : calculateHandValue([dealerHand[0]]);
    
    const handElement = dealerHandElement.querySelector('.dealer-cards');
    if (!handElement) {
        console.error('Dealer hand element not found');
        return;
    }

    handElement.innerHTML = ''; // Clear previous cards

    for (let card of visibleHand) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = card.suit === '?' ? '?' : `${card.value}${card.suit}`;
        cardElement.style.color = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
        handElement.appendChild(cardElement);
    }

    const dealerScoreElement = dealerHandElement.querySelector('#dealer-score');
    if (dealerScoreElement) {
        dealerScoreElement.textContent = score;
    }
}

function checkForBlackjack() {
    const dealerValue = calculateHandValue(dealerHand);
    if (dealerValue === 21) {
        endGame("Dealer has Blackjack! All players lose!");
        return true;
    }

    let allBlackjack = true;
    for (let player of players) {
        const playerValue = calculateHandValue(player.hands[0]);
        if (playerValue === 21) {
            messageElement.textContent += `Player ${player.id} has Blackjack! `;
        } else {
            allBlackjack = false;
        }
    }

    if (allBlackjack) {
        endGame("All players have Blackjack! It's a tie!");
        return true;
    }

    return false;
}

function hit(player) {
    if (gameOver) return;

    player.hands[player.currentHand].push(dealCard());
    const handValue = calculateHandValue(player.hands[player.currentHand]);
    updateHandDisplay(player.hands[player.currentHand], player.element, handValue);

    if (handValue > 21) {
        if (player.currentHand < player.hands.length - 1) {
            player.currentHand++;
            updateHandDisplay(player.hands[player.currentHand], player.element, calculateHandValue(player.hands[player.currentHand]));
        } else {
            messageElement.textContent = `Player ${player.id} busts!`;
            nextPlayer();
        }
    }

    players.forEach(p => updateButtons(p));
}

function stand(player) {
    if (gameOver) return;

    if (player.currentHand < player.hands.length - 1) {
        player.currentHand++;
        updateHandDisplay(player.hands[player.currentHand], player.element, calculateHandValue(player.hands[player.currentHand]));
    } else {
        nextPlayer();
    }

    players.forEach(p => updateButtons(p));
}

function doubleDown(player) {
    if (gameOver || player.hands[player.currentHand].length !== 2) return;

    player.bet *= 2;
    hit(player);
    if (!gameOver) stand(player);

    players.forEach(p => updateButtons(p));
}

function split(player) {
    if (gameOver || player.hands[player.currentHand].length !== 2 || player.hands.length > 1) return;
    if (player.hands[player.currentHand][0].value !== player.hands[player.currentHand][1].value) return;

    player.hands.push([player.hands[player.currentHand].pop()]);
    player.hands[0].push(dealCard());
    player.hands[1].push(dealCard());

    updateHandDisplay(player.hands[player.currentHand], player.element, calculateHandValue(player.hands[player.currentHand]));
    players.forEach(p => updateButtons(p));
}

function updateButtons(player) {
    const hitButton = player.element.querySelector('.hit-button');
    const standButton = player.element.querySelector('.stand-button');
    const doubleButton = player.element.querySelector('.double-button');
    const splitButton = player.element.querySelector('.split-button');

    const isCurrentPlayer = player === players[currentPlayerIndex];
    const canDouble = player.hands[player.currentHand].length === 2 && !gameOver;
    const canSplit = player.hands[player.currentHand].length === 2 && !gameOver && 
                     player.hands.length === 1 && 
                     player.hands[player.currentHand][0].value === player.hands[player.currentHand][1].value;

    hitButton.disabled = !isCurrentPlayer || gameOver;
    standButton.disabled = !isCurrentPlayer || gameOver;
    doubleButton.disabled = !isCurrentPlayer || !canDouble;
    splitButton.disabled = !isCurrentPlayer || !canSplit;
}

function nextPlayer() {
    currentPlayerIndex++;
    if (currentPlayerIndex >= players.length) {
        dealerPlay();
    } else {
        messageElement.textContent = `Player ${players[currentPlayerIndex].id}'s turn`;
        players.forEach(player => updateButtons(player));
    }
}

function dealerPlay() {
    updateDealerHand(true); // Show all cards
    while (calculateHandValue(dealerHand) < 17) {
        dealerHand.push(dealCard());
        updateDealerHand(true); // Update display after each card
    }
    determineWinners();
}

function determineWinners() {
    const dealerValue = calculateHandValue(dealerHand);
    let message = `Dealer's hand: ${dealerValue}. `;

    if (dealerValue > 21) {
        message += "Dealer busts! ";
    }

    for (let player of players) {
        for (let i = 0; i < player.hands.length; i++) {
            const playerValue = calculateHandValue(player.hands[i]);
            if (playerValue > 21) {
                message += `Player ${player.id} Hand ${i + 1} busts. `;
            } else if (dealerValue > 21 || playerValue > dealerValue) {
                message += `Player ${player.id} Hand ${i + 1} wins! `;
            } else if (playerValue === dealerValue) {
                message += `Player ${player.id} Hand ${i + 1} ties. `;
            } else {
                message += `Player ${player.id} Hand ${i + 1} loses. `;
            }
        }
    }

    endGame(message);
}

function endGame(message) {
    gameOver = true;
    messageElement.textContent = message;
    for (let player of players) {
        const buttons = player.element.querySelectorAll('button');
        buttons.forEach(button => button.disabled = true);
    }
}

function startNewGame() {
    gameOver = false;
    currentPlayerIndex = 0;
    dealerHand = [];
    messageElement.textContent = '';

    createDeck();
    shuffleDeck();

    for (let player of players) {
        player.hands = [[]];
        player.currentHand = 0;
        player.bet = 10;
        player.hands[0].push(dealCard(), dealCard());
        updateHandDisplay(player.hands[0], player.element, calculateHandValue(player.hands[0]));
    }

    dealerHand.push(dealCard(), dealCard());
    updateDealerHand();

    if (!checkForBlackjack()) {
        messageElement.textContent = `Player ${players[currentPlayerIndex].id}'s turn`;
        players.forEach(player => updateButtons(player));
    }
}

function addPlayer() {
    if (players.length < 7) {
        const newPlayer = new Player(players.length + 1);
        players.push(newPlayer);
        if (gameOver) {
            startNewGame();
        } else {
            newPlayer.hands[0].push(dealCard(), dealCard());
            updateHandDisplay(newPlayer.hands[0], newPlayer.element, calculateHandValue(newPlayer.hands[0]));
            players.forEach(player => updateButtons(player));
        }
    } else {
        alert("Maximum number of players reached (7)");
    }
}

addPlayerButton.addEventListener('click', addPlayer);
newGameButton.addEventListener('click', startNewGame);

// Initialize the game with one player
addPlayer();
startNewGame();