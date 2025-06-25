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

$data = json_decode(file_get_contents("php://input"));

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    if(!empty($data->email) && !empty($data->senha)) {
        $usuario = $auth->login($data->email, $data->senha);
        
        if($usuario) {
            session_start();
            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['usuario_nome'] = $usuario['nome'];
            $_SESSION['usuario_email'] = $usuario['email'];
            $_SESSION['usuario_perfil'] = $usuario['perfil'];
            
            http_response_code(200);
            echo json_encode(array(
                "message" => "Login realizado com sucesso.",
                "usuario" => $usuario
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Email ou senha incorretos."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Email e senha são obrigatórios."));
    }
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Método não permitido."));
}
?>

