<?php
require_once 'config.php';

$fen = $_POST['fen'];
$explanation = $_POST['explanation'];
$solution = $_POST['solution'];

$sql = "INSERT INTO positions (fen, explanation, solution) VALUES (?, ?, ?)";
$stmt = $pdo->prepare($sql);
$stmt->execute([$fen, $explanation, $solution]);

echo "ID #" . $pdo->lastInsertId();
