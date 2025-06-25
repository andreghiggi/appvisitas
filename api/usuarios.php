<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../classes/Usuario.php';
include_once '../classes/Auth.php';

$database = new Database();
$db = $database->getConnection();
$usuario = new Usuario($db);
$auth = new Auth($db);

// Verificar se o usuário está logado
session_start();
if(!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Acesso negado. Faça login primeiro."));
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            $usuario->id = $_GET['id'];
            if($usuario->buscarPorId()) {
                $usuario_arr = array(
                    "id" => $usuario->id,
                    "nome" => $usuario->nome,
                    "email" => $usuario->email,
                    "perfil" => $usuario->perfil
                );
                http_response_code(200);
                echo json_encode($usuario_arr);
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Usuário não encontrado."));
            }
        } else {
            $stmt = $usuario->listar();
            $usuarios_arr = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $usuarios_arr[] = array(
                    "id" => $row['id'],
                    "nome" => $row['nome'],
                    "email" => $row['email'],
                    "perfil" => $row['perfil']
                );
            }
            
            http_response_code(200);
            echo json_encode($usuarios_arr);
        }
        break;
        
    case 'POST':
        if($_SESSION['usuario_perfil'] != 'administrador') {
            http_response_code(403);
            echo json_encode(array("message" => "Acesso negado. Apenas administradores podem criar usuários."));
            break;
        }
        
        if(!empty($data->nome) && !empty($data->email) && !empty($data->senha) && !empty($data->perfil)) {
            $usuario->nome = $data->nome;
            $usuario->email = $data->email;
            $usuario->senha = $data->senha;
            $usuario->perfil = $data->perfil;
            
            if($usuario->criar()) {
                http_response_code(201);
                echo json_encode(array("message" => "Usuário criado com sucesso."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Não foi possível criar o usuário."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Dados incompletos."));
        }
        break;
        
    case 'PUT':
        if($_SESSION['usuario_perfil'] != 'administrador') {
            http_response_code(403);
            echo json_encode(array("message" => "Acesso negado. Apenas administradores podem editar usuários."));
            break;
        }
        
        if(!empty($data->id) && !empty($data->nome) && !empty($data->email)) {
            $usuario->id = $data->id;
            $usuario->nome = $data->nome;
            $usuario->email = $data->email;
            $usuario->senha = isset($data->senha) ? $data->senha : '';
            
            if($usuario->atualizar()) {
                http_response_code(200);
                echo json_encode(array("message" => "Usuário atualizado com sucesso."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Não foi possível atualizar o usuário."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Dados incompletos."));
        }
        break;
        
    case 'DELETE':
        if($_SESSION['usuario_perfil'] != 'administrador') {
            http_response_code(403);
            echo json_encode(array("message" => "Acesso negado. Apenas administradores podem excluir usuários."));
            break;
        }
        
        if(!empty($data->id)) {
            $usuario->id = $data->id;
            
            if($usuario->excluir()) {
                http_response_code(200);
                echo json_encode(array("message" => "Usuário excluído com sucesso."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Não foi possível excluir o usuário."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "ID do usuário é obrigatório."));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Método não permitido."));
        break;
}
?>

