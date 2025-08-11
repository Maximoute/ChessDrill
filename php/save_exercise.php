<?php
// Active le mode CORS et les entêtes JSON si besoin
header('Content-Type: application/json');

// Récupère le JSON brut
$rawData = file_get_contents("php://input");

// Décode les données JSON
$data = json_decode($rawData, true);

// Vérifie que toutes les données sont présentes
if (!isset($data['startFen'], $data['endFen'], $data['solutionMoves'], $data['explanation'], $data['turn'])) {
    http_response_code(400); // Requête incorrecte
    echo json_encode(["error" => "Données incomplètes"]);
    exit;
}

// Connexion à la BDD
$conn = new mysqli("localhost", "root", "", "echecs_db");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur connexion BDD"]);
    exit;
}

// Prépare la requête
$stmt = $conn->prepare("INSERT INTO exercises (start_fen, end_fen, solution_moves, explanation, turn) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $data['startFen'], $data['endFen'], $data['solutionMoves'], $data['explanation'], $data['turn']);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Erreur SQL"]);
}

$stmt->close();
$conn->close();