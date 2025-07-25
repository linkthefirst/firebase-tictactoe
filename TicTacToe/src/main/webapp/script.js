// Firebase imports (ESM)
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, get, update, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

document.addEventListener('DOMContentLoaded', function () {
  const app = getApp();
  const auth = getAuth(app);
  const db = getDatabase(app);

  function incrementStat(uid, statType) {
    const statRef = ref(db, `users/${uid}/${statType}`);
    runTransaction(statRef, (current) => {
      return (current || 0) + 1;
    }).then(result => {
      console.log(`✅ Updated ${statType} for ${uid}:`, result.snapshot.val());
    }).catch(error => {
      console.error(`❌ Failed to update ${statType} for UID ${uid}:`, error);
    });
  }

  const boardElement = document.getElementById('board');
  const messageElement = document.getElementById('message');
  const hostBtn = document.getElementById('hostGameBtn');
  const showJoinFieldsBtn = document.getElementById('showJoinFieldsBtn');
  const joinControlsWrapper = document.getElementById('joinControlsWrapper');
  const codeDisplay = document.getElementById('gameCodeDisplay');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  const joinCodeInput = document.getElementById('joinCodeInput');
  const joinByCodeBtn = document.getElementById('joinByCodeBtn');
  const rematchButton = document.getElementById('rematchButton');

  const tabs = {
    register: document.getElementById('registerTab'),
    login: document.getElementById('loginTab'),
    connections: document.getElementById('connectionsTab'),
    profile: document.getElementById('profileTab')
  };

  const sections = {
    connections: document.getElementById('connections'),
    profile: document.getElementById('profile'),
    register: document.getElementById('user-registration'),
    login: document.getElementById('user-login')
  };

  Object.values(sections).forEach(section => section.classList.remove('active'));
  sections.connections.classList.add('active');

  Object.entries(tabs).forEach(([name, tab]) => {
    if (tab) {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        Object.values(sections).forEach(section => section.classList.remove('active'));
        sections[name].classList.add('active');
      });
    }
  });

  let board = [];
  let currentPlayer = 'X';
  let gameOver = false;
  let currentGameId = null;
  let playerSymbol = null;
  let gameMode = 'local';
  let joinAlertShown = false;
  let symbolToUsername = {};

  function createBoard() {
    boardElement.innerHTML = '';
    board = [['-', '-', '-'], ['-', '-', '-'], ['-', '-', '-']];
    currentPlayer = 'X';
    gameOver = false;
    messageElement.textContent = '';
    rematchButton.style.display = 'none';

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.addEventListener('click', handleClick);
        boardElement.appendChild(cell);
      }
    }
  }

  function handleClick(event) {
    if (gameOver) return;
    const row = event.target.dataset.row;
    const col = event.target.dataset.col;
    if (board[row][col] !== '-') return;

    if (gameMode === 'multiplayer') {
      const user = auth.currentUser;
      if (!user || playerSymbol !== currentPlayer) return alert("Not your turn!");

      board[row][col] = playerSymbol;
      update(ref(db, 'games/' + currentGameId), {
        [`board/${row}/${col}`]: playerSymbol,
        currentPlayer: playerSymbol === 'X' ? 'O' : 'X'
      });
    } else {
      board[row][col] = currentPlayer;
      event.target.classList.add(currentPlayer.toLowerCase());
      const winner = checkWinner();

      if (winner) {
        messageElement.textContent = `PLAYER ${winner} WINS!`;
        gameOver = true;
        rematchButton.style.display = 'inline-block';
      } else if (isBoardFull()) {
        messageElement.textContent = 'TIE';
        gameOver = true;
        rematchButton.style.display = 'inline-block';
      } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        messageElement.textContent = `Player ${currentPlayer}'s turn`;
      }
    }
  }

  function isBoardFull() {
    return board.flat().every(cell => cell !== '-');
  }

  function checkWinner() {
    for (let i = 0; i < 3; i++) {
      if (board[i][0] !== '-' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) return board[i][0];
      if (board[0][i] !== '-' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) return board[0][i];
    }
    if (board[0][0] !== '-' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) return board[0][0];
    if (board[0][2] !== '-' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) return board[0][2];
    return null;
  }

  rematchButton.addEventListener('click', () => {
    if (gameMode === 'multiplayer') {
      if (!currentGameId || !playerSymbol) return;
      update(ref(db, 'games/' + currentGameId + '/rematchVotes'), {
        [playerSymbol]: true
      });
      rematchButton.style.display = 'none';
      messageElement.textContent = 'Waiting for opponent to accept rematch...';
    } else {
      createBoard();
      currentPlayer = 'X';
      messageElement.textContent = "Player X turn";
    }
  });

  function checkLoser(winner) {
    if (!winner || winner === 'null') {
      messageElement.textContent = 'TIE';
    } else if (winner === playerSymbol) {
      messageElement.textContent = `You win! 🎉`;
    } else {
      const winnerName = symbolToUsername[winner] || winner;
      messageElement.textContent = `You lose. 😢 ${winnerName} wins.`;
    }
    rematchButton.style.display = 'inline-block';
  }
  function generateGameCode(length = 6) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}
    // Multiplayer game hosting
  hostBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return alert("Please log in to host a game.");

    const customCode = generateGameCode();
    const gameRef = ref(db, 'games/' + customCode);
    set(gameRef, {
      host: user.uid,
      playerX: user.displayName || "Host",
      hostName: user.displayName || "Host",
      joiner: null,
      board: {
        0: ["-", "-", "-"],
        1: ["-", "-", "-"],
        2: ["-", "-", "-"]
      },
      status: "waiting",
      currentPlayer: "X"
    });

    currentGameId = customCode;
    playerSymbol = 'X';
    gameMode = 'multiplayer';
    joinAlertShown = false;
    listenForGameUpdates(currentGameId);
    createBoard();

    codeDisplay.textContent = `Game Code: ${currentGameId}`;
    document.getElementById('hostCodeArea').style.display = 'block';
    copyCodeBtn.style.display = 'inline-block';
  });

  // Game joining functionality
  showJoinFieldsBtn.addEventListener('click', () => {
    joinControlsWrapper.style.display = 'flex';
  });

  joinByCodeBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please log in to join a game.");

    const code = joinCodeInput.value.trim();
    if (!code) return alert("Please enter a game code.");

    // Check if user is trying to join their own game
    if (currentGameId === code) {
        return alert("You cannot join your own game!");
    }

    const gameRef = ref(db, 'games/' + code);
    const snapshot = await get(gameRef);

    if (snapshot.exists()) {
        const game = snapshot.val();
        if (game.status === 'waiting') {
            // Additional check to prevent joining own game by host UID
            if (game.host === user.uid) {
                return alert("You cannot join your own game!");
            }
            
            await update(gameRef, {
                joiner: user.uid,
                playerO: user.displayName || "Player O",
                joinerName: user.displayName || "Player O",
                status: "in-progress"
            });

            currentGameId = code;
            playerSymbol = 'O';
            gameMode = 'multiplayer';
            joinAlertShown = false;
            listenForGameUpdates(currentGameId);
            createBoard();
        } else {
            alert("This game has already started or is full.");
        }
    } else {
        alert("Invalid game code.");
    }
});
  // Real-time game updates
  function listenForGameUpdates(gameId) {
    const gameRef = ref(db, 'games/' + gameId);
    onValue(gameRef, snapshot => {
        const data = snapshot.val();
        if (!data) return;
        
        const user = auth.currentUser;
        // Prevent host from joining their own game
        if (user && data.host === user.uid && data.joiner === user.uid) {
            set(ref(db, 'games/' + gameId), null);
            alert("You cannot join your own game. Please create a new game.");
            return;
        }

        board = [data.board["0"], data.board["1"], data.board["2"]];
        currentPlayer = data.currentPlayer;
        gameOver = false;
        updateBoardUI();

        // Build symbolToUsername dynamically
        symbolToUsername = {
            X: data.hostName || "Host",
            O: data.joinerName || "Joiner"
        };

        const winner = checkWinner();
        // Only process if game is in-progress and has now ended
        if (winner || isBoardFull()) {
  const finalWinner = winner || 'null';

  const gameStatRef = ref(db, 'games/' + gameId);
  runTransaction(gameStatRef, (gameData) => {
    if (!gameData || gameData.statsUpdated) return; // already handled

    // update only within transaction
    gameData.status = 'completed';
    gameData.winner = finalWinner;
    gameData.statsUpdated = true;

    return gameData;
  }).then(result => {
    if (!result.committed) return;

    checkLoser(finalWinner);

    const game = result.snapshot.val();
    const hostUid = game.host;
    const joinerUid = game.joiner;

    if (finalWinner === 'X' && hostUid) {
      incrementStat(hostUid, 'wins');
      if (joinerUid) incrementStat(joinerUid, 'losses');
    } else if (finalWinner === 'O' && joinerUid) {
      incrementStat(joinerUid, 'wins');
      if (hostUid) incrementStat(hostUid, 'losses');
    } else if (finalWinner === 'null') {
      if (hostUid) incrementStat(hostUid, 'draws');
      if (joinerUid) incrementStat(joinerUid, 'draws');
    }
  }).catch(err => {
    console.error("🔥 Transaction failed:", err);
  });
}

        // Handle rematch votes
        if (data.rematchVotes) {
            if (data.rematchVotes.X && data.rematchVotes.O) {
                update(ref(db, 'games/' + gameId), {
                    board: {
                        0: ["-", "-", "-"],
                        1: ["-", "-", "-"],
                        2: ["-", "-", "-"]
                    },
                    currentPlayer: "X",
                    status: "in-progress",
                    winner: null,
                    rematchVotes: null,
                    statsUpdated: null
                });
                createBoard();
                messageElement.textContent = "Rematch started! Player X turn.";
            } else if (data.rematchVotes[playerSymbol === 'X' ? 'O' : 'X']) {
                rematchButton.style.display = 'inline-block';
                messageElement.textContent = 'Opponent wants a rematch! Click REMATCH to accept.';
            }
        }

        // New player notifications
        if (playerSymbol === 'X' && data.status === 'in-progress' && data.joiner && !joinAlertShown) {
            alert(`Opponent ${data.joinerName} has joined. You have the first move, ${data.hostName}!`);
            joinAlertShown = true;
        }

        if (playerSymbol === 'O' && data.status === 'in-progress' && !joinAlertShown) {
            alert(`You've joined a game! You're O. Player X is ${data.hostName}.`);
            joinAlertShown = true;
        }
    });
}

  // UI updates
  function updateBoardUI() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
      const row = cell.dataset.row;
      const col = cell.dataset.col;
      cell.className = 'cell';
      const value = board[row][col];
      if (value === 'X') cell.classList.add('x');
      else if (value === 'O') cell.classList.add('o');
    });
  }

  // Utility functions
  copyCodeBtn.addEventListener('click', () => {
    if (!currentGameId) return;
    navigator.clipboard.writeText(currentGameId)
      .then(() => alert('Game code copied to clipboard!'))
      .catch(() => alert('Failed to copy code.'));
  });

  // Initialize the game
  createBoard();
});
