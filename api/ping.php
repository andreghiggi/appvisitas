<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, HEAD");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Simples endpoint para verificar conectividade
if($_SERVER['REQUEST_METHOD'] == 'GET' || $_SERVER['REQUEST_METHOD'] == 'HEAD') {
    http_response_code(200);
    echo json_encode(array(
        "status" => "online",
        "timestamp" => date('Y-m-d H:i:s'),
        "server" => "PHP " . phpversion()
    ));
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Método não permitido."));
}
?>

