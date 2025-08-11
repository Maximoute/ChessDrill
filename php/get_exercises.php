<?php
header('Content-Type: application/json');

try {
  $db = new PDO('mysql:host=localhost;dbname=exercices_echecs;charset=utf8', 'root', '');
  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  $stmt = $db->query("SELECT id, start_fen, end_fen, explanation, solution_moves FROM exercices");
  $exercises = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($exercises);
} catch (PDOException $e) {
  echo json_encode(["error" => $e->getMessage()]);
}
