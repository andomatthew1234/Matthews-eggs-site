const PURCHASE_COUNT_KEY = 'krPurchaseCount';
const REDEEM_STORAGE_KEY = 'krRedeemedRewards';
const REDEEMABLE_REWARDS = [
    { id: 'redeem10', title: '10% off coupon', cost: 3, code: 'REDEEM-KR-REWARDS-10', description: 'Spend 3 purchases to get 10% off.' },
    { id: 'freeDozen', title: 'Free Dozen', cost: 7, code: 'KRREWARD-FDA8', description: 'Spend 7 purchases to receive a free dozen with one dozen purchase.' },
    { id: 'thirtyOff', title: '30% off (min $16)', cost: 5, code: 'KR-30-FJSJWI', description: 'Spend 5 purchases to get 30% off with a minimum $16 order.' },
    { id: 'firstTime', title: 'First Time Order 10% off', cost: 1, code: 'FIRST-TIME-KR-EIWS', description: 'First time order reward. Available once only.' }
];
let gameInterval = null;
let spawnInterval = null;
let gameState = {
    score: 0,
    missed: 0,
    running: false,
    items: [],
    playerX: 50,
    leftPressed: false,
    rightPressed: false,
};

function setActiveNav() {
    const pageId = document.body.dataset.page;
    document.querySelectorAll('nav a').forEach(link => {
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function loadLatestNewsOnHome() {
    if (document.body.dataset.page !== 'home') {
        return;
    }

    const banner = document.getElementById('latestNewsBanner');
    const titleEl = document.getElementById('latestNewsTitle');
    const noticeEl = document.getElementById('latestNewsNotice');
    const button = document.querySelector('.latest-news-btn');

    if (!banner || !titleEl || !noticeEl || !button) {
        return;
    }

    fetch('posts/news.json')
        .then(response => response.json())
        .then(posts => {
            if (!Array.isArray(posts) || posts.length === 0) {
                titleEl.textContent = 'No news available yet.';
                noticeEl.textContent = 'Check back soon for the latest update.';
                return;
            }
            const latest = posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            titleEl.textContent = latest.title || 'Latest announcement available';
            noticeEl.textContent = latest.summary || 'Read the newest story on the News page.';
            button.href = 'news.html';
        })
        .catch(() => {
            titleEl.textContent = 'News unavailable';
            noticeEl.textContent = 'There was a problem loading the latest announcement.';
            banner.style.opacity = '0.9';
        });
}

function togglePerks() {
    const perksList = document.getElementById('perksList');
    if (perksList) {
        perksList.classList.toggle('active');
    }
}

function getPurchaseCount() {
    return parseInt(localStorage.getItem(PURCHASE_COUNT_KEY) || '0', 10);
}

function updatePurchaseDisplays() {
    const count = getPurchaseCount();
    const gamesSummary = document.getElementById('purchaseSummaryGames');
    const buySummary = document.getElementById('purchaseSummaryBuy');

    if (gamesSummary) {
        gamesSummary.textContent = count > 0
            ? `Successful purchases recorded: ${count}`
            : 'No successful purchases recorded in this browser yet.';
    }

    if (buySummary) {
        buySummary.textContent = count > 0
            ? `Successful purchases recorded: ${count}`
            : 'Successful purchases recorded: 0';
    }

    const secretCard = document.getElementById('lockedGameCard');
    const secretDesc = document.getElementById('secretGameDesc');
    const secretBtn = document.getElementById('secretGameBtn');

    if (count >= 1 && secretCard) {
        secretCard.classList.remove('locked');
        if (secretDesc) {
            secretDesc.textContent = "You've unlocked the Royal Coop Escape! Click below to enter the secret coop.";
        }
        if (secretBtn) {
            secretBtn.textContent = 'Play Escape Game';
        }
    }

    const statusBadge = document.getElementById('statusBadgeTop');
    const scoreBig = document.getElementById('loyaltyScoreBig');
    const loyaltyMsg = document.getElementById('loyaltyMessage');
    const nextRankName = document.getElementById('nextRankName');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');

    if (scoreBig) {
        scoreBig.textContent = count;
    }

    let status = '👋 Visitor';
    let message = "Thanks for visiting our website! If you like the look of our eggs, make a purchase and it'll show up here. As long as you stay on the same browser, your loyalty will update with each purchase. Good luck!";
    let nextLevel = 'Try-outer';
    let milestone = 1;

    if (count >= 16) {
        status = '📘 Gold level';
        message = 'Legend status. Part of the family. Well done.';
        nextLevel = 'Max Level Reached';
        milestone = count;
    } else if (count >= 11) {
        status = '📗 Silver level';
        message = 'Now your getting into it. Silver! You\'ve come a long way, traveler.';
        nextLevel = 'Gold level';
        milestone = 16;
    } else if (count >= 5) {
        status = '🥚 Loyal customer';
        message = 'Now you\'ve done more then 5 purchases, you\'re part of the King Royalty family!';
        nextLevel = 'Silver level';
        milestone = 11;
    } else if (count >= 1) {
        status = '💰 Try-outer';
        message = 'Thanks! You\'ve successfully bought some eggs, and you\'ve levelled up to try-outer. If you loved them, you can keep going to see what you can unlock!';
        nextLevel = 'Loyal customer';
        milestone = 5;
    }

    if (statusBadge) {
        statusBadge.textContent = status;
    }
    if (loyaltyMsg) {
        loyaltyMsg.textContent = message;
    }
    if (nextRankName) {
        nextRankName.textContent = `Next Level: ${nextLevel}`;
    }
    if (progressText) {
        progressText.textContent = `${count} / ${milestone}`;
    }
    if (progressBar) {
        let percent = milestone === 0 ? 100 : (count / milestone) * 100;
        if (count >= 16) {
            percent = 100;
        }
        progressBar.style.width = `${Math.min(100, percent)}%`;
    }
    if (typeof updateRedeemDisplay === 'function') {
        updateRedeemDisplay();
    }
}

function getRedeemedRewards() {
    try {
        return JSON.parse(localStorage.getItem(REDEEM_STORAGE_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function saveRedeemedRewards(rewards) {
    localStorage.setItem(REDEEM_STORAGE_KEY, JSON.stringify(rewards));
}

function getRedeemedReward(id) {
    return getRedeemedRewards().find(reward => reward.id === id);
}

function showLoyaltyTab(tab) {
    document.getElementById('levelsTab').classList.toggle('active', tab === 'levels');
    document.getElementById('redeemTab').classList.toggle('active', tab === 'redeem');
    document.getElementById('loyaltyLevelsView').classList.toggle('hidden', tab !== 'levels');
    document.getElementById('loyaltyRedeemView').classList.toggle('hidden', tab !== 'redeem');
    if (tab === 'redeem') {
        updateRedeemDisplay();
    }
}

function updateRedeemDisplay() {
    const balanceElement = document.getElementById('redeemBalance');
    if (balanceElement) {
        balanceElement.textContent = getPurchaseCount();
    }

    const listElement = document.getElementById('redeemList');
    if (!listElement) {
        return;
    }

    const redeemedRewards = getRedeemedRewards();
    const currentCount = getPurchaseCount();

    listElement.innerHTML = REDEEMABLE_REWARDS.map(reward => {
        const redeemed = redeemedRewards.find(r => r.id === reward.id);
        const isSelected = !!redeemed;
        const isViewed = isSelected && redeemed.viewed;
        const buttonText = isSelected ? (isViewed ? 'Redeemed' : 'View coupon') : `Redeem ${reward.cost} purchases`;
        const disabled = isSelected ? isViewed : currentCount < reward.cost;
        return `
            <div class="redeem-card">
                <h3>${reward.title}</h3>
                <p>${reward.description}</p>
                <div class="redeem-cost">Cost: ${reward.cost}</div>
                <button class="btn" ${disabled ? 'disabled' : ''} onclick="handleRedeemReward('${reward.id}')">${buttonText}</button>
                ${isSelected ? `<span class="redeem-status">${isViewed ? 'Redeemed' : 'Pending view'}</span>` : ''}
            </div>
        `;
    }).join('');
}

function handleRedeemReward(id) {
    const reward = REDEEMABLE_REWARDS.find(r => r.id === id);
    if (!reward) {
        return;
    }

    const existing = getRedeemedReward(id);
    if (existing) {
        showRedeemCoupon(existing);
        return;
    }

    const currentCount = getPurchaseCount();
    if (currentCount < reward.cost) {
        alert('You do not have enough purchase balance to redeem this reward.');
        return;
    }

    const updatedCount = currentCount - reward.cost;
    localStorage.setItem(PURCHASE_COUNT_KEY, updatedCount);

    const newReward = {
        id: reward.id,
        title: reward.title,
        code: reward.code,
        viewed: false,
        redeemedAt: Date.now()
    };

    const redeemedRewards = getRedeemedRewards();
    redeemedRewards.push(newReward);
    saveRedeemedRewards(redeemedRewards);
    updatePurchaseDisplays();
    showRedeemCoupon(newReward);
}

function showRedeemCoupon(reward) {
    const couponArea = document.getElementById('redeemCouponArea');
    const couponText = document.getElementById('redeemCouponText');
    if (!couponArea || !couponText) {
        return;
    }

    if (reward.viewed) {
        couponText.textContent = 'This coupon code has already been viewed and cannot be shown again.';
    } else {
        couponText.textContent = reward.code;
        const redeemedRewards = getRedeemedRewards();
        const index = redeemedRewards.findIndex(r => r.id === reward.id);
        if (index >= 0) {
            redeemedRewards[index].viewed = true;
            saveRedeemedRewards(redeemedRewards);
        }
    }

    couponArea.classList.remove('hidden');
    if (typeof updateRedeemDisplay === 'function') {
        updateRedeemDisplay();
    }
}

function getRedeemBalance() {
    return getPurchaseCount();
}

document.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    updatePurchaseDisplays();
    loadLatestNewsOnHome();
    if (document.body.dataset.page === 'loyalty') {
        showLoyaltyTab('levels');
    }
    if (document.body.dataset.page === 'games') {
        closeGame();
    }
});

window.addEventListener('pageshow', updatePurchaseDisplays);

function launchGame() {
    const list = document.querySelector('.game-list');
    if (list) {
        list.style.display = 'none';
    }
    const screen = document.getElementById('chickenDashScreen');
    if (!screen) {
        return;
    }
    screen.classList.add('active');
    gameState.leftPressed = false;
    gameState.rightPressed = false;
    showMessage('Ready to Play!', 'Use arrow keys or WASD to move and catch eggs.', false);
    resetGame();
}

function launchSecretGame() {
    const count = getPurchaseCount();
    if (count >= 1) {
        window.open('secret_game.html', '_blank');
    } else {
        alert('Wait! This game is for Try-outers and higher. Make a purchase to unlock!');
    }
}

function closeGame() {
    const screen = document.getElementById('chickenDashScreen');
    if (screen) {
        screen.classList.remove('active');
    }
    const list = document.querySelector('.game-list');
    if (list) {
        list.style.display = 'flex';
    }
    stopGame();
    const audio = document.getElementById('gameAudio');
    if (audio) {
        audio.pause();
    }
}

function resetGame() {
    stopGame();
    gameState.score = 0;
    gameState.missed = 0;
    gameState.running = false;
    gameState.playerX = 50;
    gameState.leftPressed = false;
    gameState.rightPressed = false;
    updateHud();
    clearBoard();
    const audio = document.getElementById('gameAudio');
    if (audio) {
        audio.pause();
    }
    showMessage('Ready to Play!', 'Press Start to begin Chicken Dash.', true);
}

function showMessage(title, message, showButton) {
    const container = document.getElementById('gameMessage');
    if (!container) {
        return;
    }
    container.classList.add('show');
    const titleElement = document.getElementById('gameResultTitle');
    const textElement = document.getElementById('gameResultText');
    const button = container.querySelector('button');

    if (titleElement) {
        titleElement.textContent = title;
    }
    if (textElement) {
        textElement.textContent = message;
    }
    if (button) {
        button.style.display = showButton ? 'inline-flex' : 'none';
    }
}

function hideMessage() {
    const container = document.getElementById('gameMessage');
    if (container) {
        container.classList.remove('show');
    }
}

function startGame() {
    if (gameState.running) {
        return;
    }
    gameState.running = true;
    hideMessage();
    clearBoard();
    movePlayer(0);

    gameInterval = setInterval(updateGame, 20);
    spawnInterval = setInterval(spawnItem, 700);
    window.addEventListener('keydown', handleInput);
    window.addEventListener('keyup', handleKeyUp);
    const audio = document.getElementById('gameAudio');
    if (audio) {
        audio.play();
    }
}

function stopGame() {
    gameState.running = false;
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    window.removeEventListener('keydown', handleInput);
    window.removeEventListener('keyup', handleKeyUp);
    const audio = document.getElementById('gameAudio');
    if (audio) {
        audio.pause();
    }
}

function handleInput(event) {
    if (!gameState.running) {
        return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        gameState.leftPressed = true;
    }
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        gameState.rightPressed = true;
    }
}

function handleKeyUp(event) {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        gameState.leftPressed = false;
    }
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        gameState.rightPressed = false;
    }
}

function movePlayer(delta) {
    const board = document.getElementById('gameBoard');
    if (!board) {
        return;
    }
    const max = board.clientWidth - 70;
    gameState.playerX = Math.min(max, Math.max(0, gameState.playerX + delta));
    const player = document.getElementById('player');
    if (player) {
        player.style.left = gameState.playerX + 'px';
    }
}

function updateHud() {
    const scoreElement = document.getElementById('dashScore');
    const missedElement = document.getElementById('dashMissed');
    if (scoreElement) {
        scoreElement.textContent = gameState.score;
    }
    if (missedElement) {
        missedElement.textContent = gameState.missed;
    }
}

function clearBoard() {
    const board = document.getElementById('gameBoard');
    if (!board) {
        return;
    }
    gameState.items.forEach(item => {
        if (item.element) {
            item.element.remove();
        }
    });
    gameState.items = [];
}

function spawnItem() {
    const board = document.getElementById('gameBoard');
    if (!board) {
        return;
    }
    const xPos = Math.random() * (board.clientWidth - 40);
    const isRock = Math.random() < 0.24;
    const element = document.createElement('div');
    element.className = 'falling-item' + (isRock ? ' rock' : '');
    element.style.left = xPos + 'px';
    element.style.top = '-50px';

    board.appendChild(element);
    gameState.items.push({ element, top: -50, type: isRock ? 'rock' : 'egg' });
}

function updateGame() {
    if (gameState.leftPressed) {
        movePlayer(-10);
    }
    if (gameState.rightPressed) {
        movePlayer(10);
    }
    const board = document.getElementById('gameBoard');
    const player = document.getElementById('player');
    if (!board || !player) {
        return;
    }
    const playerRect = player.getBoundingClientRect();
    const newItems = [];

    gameState.items.forEach(item => {
        item.top += item.type === 'rock' ? 6 : 5;
        item.element.style.top = item.top + 'px';
        const itemRect = item.element.getBoundingClientRect();

        if (item.top > board.clientHeight) {
            if (item.type === 'egg') {
                gameState.missed += 1;
                updateHud();
                if (gameState.missed >= 3) {
                    endGame('Game over!', 'You missed too many eggs. Try again!');
                }
            }
            item.element.remove();
            return;
        }

        if (itemRect.left < playerRect.right && itemRect.right > playerRect.left && itemRect.bottom > playerRect.top && itemRect.top < playerRect.bottom) {
            if (item.type === 'egg') {
                gameState.score += 1;
                updateHud();
                item.element.remove();
            } else {
                endGame('Oh no!', 'A rock hit the coop. Game over.');
                item.element.remove();
            }
            return;
        }

        newItems.push(item);
    });

    gameState.items = newItems;
}

function endGame(title, message) {
    stopGame();
    showMessage(title, message, true);
}
