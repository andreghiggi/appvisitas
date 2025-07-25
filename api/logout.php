<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../classes/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    if($auth->logout()) {
        http_response_code(200);
        echo json_encode(array("message" => "Logout realizado com sucesso."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Erro ao realizar logout."));
    }
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Método não permitido."));
}
?>

