// Classe principale de l'application
class ChessExerciseApp {
  constructor() {
    this.board = null;
    this.game = null;
    this.mode = 'edit';
    this.recording = false;
    this.resolving = false;
    this.currentMoveIndex = 0;
    this.recordedMoves = [];
    this.pendingBadMoveUndo = false;

    this.currentExercise = {
      startFen: '',
      endFen: '',
      explanation: '',
      solutionMoves: ''
    };

    this.initBoard();
  }

  initBoard() {
    const config = {
      draggable: true,
      dropOffBoard: 'trash',
      sparePieces: this.mode === 'edit',
      pieceTheme: './img/pieces/{piece}.png',
      onDrop: (this.recording || this.mode === 'play') ? this.onDrop.bind(this) : undefined
    };
    this.board = Chessboard('board', config);
    if (this.mode === 'edit') this.board.position('empty');
  }

  onDrop(source, target) {
    const move = this.game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    this.board.position(this.game.fen());

    if (this.recording) {
      this.recordedMoves.push(move.san);
    } else if (this.resolving) {
      const solutionMovesArray = this.currentExercise.solutionMoves.split(',');
      const expectedMove = solutionMovesArray[this.currentMoveIndex];

      if (move.san === expectedMove) {
        this.currentMoveIndex++;
        this.board.position(this.game.fen());

        const nextExpected = solutionMovesArray[this.currentMoveIndex];
        if (nextExpected) {
          const autoMove = this.game.moves({ verbose: true }).find(m => m.san === nextExpected);
          if (autoMove) {
            this.game.move(autoMove.san);
            this.board.position(this.game.fen());
            this.currentMoveIndex++;
          }
        }

        if (this.currentMoveIndex >= solutionMovesArray.length) {
          this.showMessage("🏁 Bravo ! Exercice terminé.", 'black');
          this.resolving = false;
        }
      } else {
        this.showBadMoveModal(expectedMove);
        return 'snapback';
      }
    }
  }

  clearBoard() {
    this.board.destroy();
    this.initBoard();
  }

  saveStartPosition() {
    const turn = document.getElementById("turn").value;
    let fenParts = this.board.fen().split(' ');

    if (fenParts.length < 6) {
      fenParts[1] = turn;
      fenParts[2] = '-';
      fenParts[3] = '-';
      fenParts[4] = '0';
      fenParts[5] = '1';
    } else {
      fenParts[1] = turn;
    }

    this.currentExercise.startFen = fenParts.join(' ');
    this.showMessage("✅ Position du problème sauvegardée !", 'green');
  }

  saveEndPosition() {
    this.currentExercise.endFen = this.board.fen();
    this.currentExercise.explanation = document.getElementById("explanation").value;
    this.showMessage("✅ Position de solution sauvegardée !", 'green');
  }

  toggleRecording() {
    if (!this.recording) {
      if (!this.currentExercise.startFen) {
        this.showMessage("⚠️ Tu dois d'abord sauvegarder la position de départ !", 'red');
        return;
      }
      this.game = new Chess();
      if (!this.game.load(this.currentExercise.startFen)) {
        this.showMessage("❌ Erreur de chargement de la position de départ.", 'red');
        return;
      }

      this.recording = true;
      this.recordedMoves = [];
      document.getElementById("recordButton").innerText = "⏹ Terminer l'enregistrement";
      this.board.destroy();
      this.board = Chessboard('board', {
        position: this.game.fen(),
        draggable: true,
        pieceTheme: './img/pieces/{piece}.png',
        onDrop: this.onDrop.bind(this)
      });
    } else {
      this.recording = false;
      document.getElementById("recordButton").innerText = "🎬 Commencer l'enregistrement";
      this.currentExercise.solutionMoves = this.recordedMoves.join(',');
      this.currentExercise.endFen = this.game.fen();
      this.showMessage("✅ sequence enregistrer  avec succès !", 'green');
    }
  }

saveExerciseToDB() {
  // Essaie de récupérer depuis currentExercise si pas directement sur l'instance
  const startFen = this.startFen || this.currentExercise?.startFen;
  const endFen = this.endFen || this.currentExercise?.endFen;
  const solutionMoves = this.solutionMovesArray?.length > 0
    ? this.solutionMovesArray
    : this.currentExercise?.solutionMoves?.split(',') || [];

  if (!startFen || !endFen || solutionMoves.length === 0) {
    this.showMessage("⚠️ Complète la position de départ, la solution et les coups.", "error", 'red');
    return;
  }

  const explanation = document.getElementById("explanation").value;
  const turn = document.getElementById("turn").value;

  const exerciseData = {
    startFen: startFen,
    endFen: endFen,
    explanation: explanation,
    turn: turn,
    solutionMoves: solutionMoves.join(',')
  };
console.log("🔍 Données envoyées à PHP :", exerciseData);

  fetch('/echecs-app/php/save_exercise.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(exerciseData)
  })
    .then(response => {
      if (!response.ok) throw new Error("Erreur serveur");
      return response.text();
    })
    .then(data => {
      this.showMessage("✅ Exercice enregistré avec succès !", "success", 'green');
    })
    .catch(error => {
      console.error("❌ Erreur d’enregistrement :", error);
      this.showMessage("❌ Échec de l'enregistrement. Vérifie le serveur.", "error", 'red');
    });
}

  loadExercises() {
    fetch('/echecs-app/php/get_exercises.php')
      .then(res => res.json())
      .then(data => {
        const listDiv = document.getElementById("exerciseList");
        listDiv.innerHTML = '';
        data.forEach(ex => {
          const div = document.createElement("div");
          div.className = "exercise";
          div.innerHTML = `
            <p><strong>Explication :</strong> ${ex.explanation}</p>
            <button onclick="app.showPosition('${ex.start_fen}')">📌 Problème</button>
            <button onclick="app.showPosition('${ex.end_fen}')">✅ Voir la solution</button>
            <button onclick="app.loadExercise(${ex.id})">🎯 Résoudre</button>
            <button onclick="app.deleteExercise(${ex.id})">🗑️ Supprimer</button>
          `;
          listDiv.appendChild(div);
        });
      });
  }

  loadExercise(id) {
    fetch('/echecs-app/php/get_exercise.php')
      .then(res => res.json())
      .then(data => {
        const ex = data.find(e => e.id === id);
        if (!ex) return;

        this.mode = 'play';
        this.recording = false;
        this.resolving = true;
        this.currentMoveIndex = 0;

        this.currentExercise = {
          startFen: ex.start_fen,
          endFen: ex.end_fen,
          explanation: ex.explanation,
          solutionMoves: ex.solution_moves
        };

        this.game = new Chess(this.currentExercise.startFen);
        this.board.destroy();
        this.board = Chessboard('board', {
          position: this.game.fen(),
          draggable: true,
          pieceTheme: './img/pieces/{piece}.png',
          onDrop: this.onDrop.bind(this)
        });
      });
  }

  showPosition(fen) {
    this.mode = 'edit';
    this.board.destroy();
    const tempGame = new Chess();
    try {
      tempGame.load(fen);
    } catch (e) {
      this.showMessage("❌ FEN invalide : " + fen , 'red');
      return;
    }
    this.board = Chessboard('board', {
      draggable: false,
      sparePieces: false,
      position: tempGame.fen(),
      pieceTheme: './img/pieces/{piece}.png'
    });
  }

  deleteExercise(id) {
    if (!confirm("Supprimer cet exercice ?")) return;
    fetch('/echecs-app/php/delete_exercise.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
      .then(res => res.json())
      .then(() => {
        this.showMessage("🗑️ Supprimé !", 'black');
        this.loadExercises();
      });
  }

  showBadMoveModal(expectedSan) {
    const hintPiece = expectedSan.charAt(0).match(/[A-Z]/) ? expectedSan.charAt(0) : '♙';
    const pieceName = {
      'K': '♔ Roi',
      'Q': '♕ Dame',
      'R': '♖ Tour',
      'B': '♗ Fou',
      'N': '♘ Cavalier',
      '♙': '♙ Pion'
    };

    const hint = pieceName[hintPiece] || '♙ Pion';
    document.getElementById('moveHint').innerText = `Indice : Joue avec ${hint}`;
    document.getElementById('badMoveModal').style.display = 'block';
    document.getElementById("badMoveCloseBtn").addEventListener("click", () => {
  this.closeBadMoveModal();
});
    this.pendingBadMoveUndo = true;
  }

closeBadMoveModal() {
  document.getElementById("badMoveModal").style.display = "none";

  this.currentMoveIndex = 0;

  try {
    this.game.load(this.currentExercise.startFen);
    this.board.position(this.game.fen());
    console.log("🔄 Position réinitialisée à :", this.currentExercise.startFen);

    // On vérifie que solutionMoves est bien défini et est un tableau
    if (Array.isArray(this.solutionMoves)) {
      const nextExpected = this.solutionMoves[this.currentMoveIndex];
      const legalMoves = this.game.moves({ verbose: true });

      const autoMove = legalMoves.find(m => m.san === nextExpected);

      // Vérifie que le coup suivant est pour l'adversaire
      if (autoMove && this.game.turn() !== this.expectedColor()) {
        const move = this.game.move(autoMove.san);
        this.board.position(this.game.fen());
        this.currentMoveIndex++;
        console.log(`🤖 L'adversaire rejoue automatiquement : ${move.san}`);
      }
    }

  } catch (e) {
    console.error("❌ Erreur de rechargement FEN :", e);
  }
}
startChainMode() {
  this.mode = 'chain';
  this.chainScore = 0;
  this.chainIndex = 0;
  this.chainExercises = [];

  document.getElementById("chainContainer").style.display = 'block';
  document.getElementById("exerciseList").style.display = 'none';

  fetch('/echecs-app/php/get_exercises.php')
    .then(res => res.json())
    .then(data => {
      this.chainExercises = this.shuffleArray(data);
      this.nextChainExercise();
    });
}

shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

nextChainExercise() {
  if (this.chainIndex >= this.chainExercises.length) {
    this.showMessage("🏁 Fin de la session !", 'black');
    this.stopChainMode();
    return;
  }

  const ex = this.chainExercises[this.chainIndex++];
  this.currentExercise = {
    startFen: ex.start_fen,
    endFen: ex.end_fen,
    explanation: ex.explanation,
    solutionMoves: ex.solution_moves
  };

  this.currentChainExercise = this.currentExercise; // ✅ AJOUT ICI

  this.game = new Chess(this.currentExercise.startFen);
  this.solutionMovesArray = this.currentExercise.solutionMoves.split(',');
  this.currentMoveIndex = 0;

  this.board = Chessboard('chainBoard', {
    position: this.game.fen(),
    draggable: true,
    pieceTheme: './img/pieces/{piece}.png',
    onDrop: (source, target) => this.handleChainMove(source, target)
  });

  document.getElementById("chainScore").textContent = `Score : ${this.chainScore}`;
}

handleChainMove(source, target) {
  const move = this.game.move({ from: source, to: target, promotion: 'q' });

  // Coup illégal
  if (move === null) {
    this.showMessage(`⛔ Coup illégal : ${source} → ${target}`, 'red');
    return 'snapback';
  }

  const expectedMove = this.solutionMovesArray[this.currentMoveIndex];

  // Si plus de coup attendu
  if (!expectedMove) {
    this.showMessage("✅ Exercice déjà terminé.");
    return;
  }

  console.log(`🧑‍💻 Joueur joue : ${move.san}`);
  console.log(`🎯 Coup attendu : ${expectedMove}`);

  if (move.san === expectedMove) {
    // ✅ Bon coup du joueur
    this.currentMoveIndex++;
    this.board.position(this.game.fen(), true);
    this.showMessage("✅ Bon coup !", 'green');

    const nextExpected = this.solutionMovesArray[this.currentMoveIndex];

    // 🤖 L'adversaire doit jouer un coup
    if (nextExpected) {
      const legalMoves = this.game.moves({ verbose: true });
      const autoMove = legalMoves.find(m => m.san === nextExpected);

      if (autoMove) {
        setTimeout(() => {
          const played = this.game.move(autoMove.san);
          this.board.position(this.game.fen(), true);
          console.log(`🤖 Adversaire joue : ${played.san}`);
          this.currentMoveIndex++;

          // 🎉 Exercice terminé après le coup adverse
          if (this.currentMoveIndex >= this.solutionMovesArray.length) {
            this.chainScore++;
            document.getElementById("chainScore").textContent = `Score : ${this.chainScore}`;
            this.showMessage("🎉 Exercice réussi !", 'green');
            setTimeout(() => this.nextChainExercise(), 800);
          }
        }, 300); // Délai pour affichage fluide
      } else {
        this.showMessage("⚠️ Coup adverse attendu mais introuvable.", 'orange');
      }
    } else {
      // 🎉 Exercice terminé (pas de coup adverse)
      this.chainScore++;
      document.getElementById("chainScore").textContent = `Score : ${this.chainScore}`;
      this.showMessage("🎉 Exercice réussi !", 'green');
      setTimeout(() => this.nextChainExercise(), 800);
    }

  } else {
    // ❌ Mauvais coup du joueur
    this.showMessage("❌ Mauvais coup !", 'red');
    setTimeout(() => {
      this.showMessage(`💡 Indice : joue une pièce en ${expectedMove[0]}`, 'orange');
    }, 1000);
    return 'snapback';
  }
}


stopChainMode() {
  this.mode = 'edit';
  document.getElementById("chainContainer").style.display = 'none';
  document.getElementById("exerciseList").style.display = 'block';
  this.initBoard();
}
showMessage(message, color = 'green') {
  const box = document.getElementById("feedbackMessage");
  box.textContent = message;
  box.style.color = color;
  box.style.opacity = 1;

  clearTimeout(this.messageTimeout);
  this.messageTimeout = setTimeout(() => {
    box.style.opacity = 0;
  }, 2000);
}
  }

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ChessExerciseApp();
});
