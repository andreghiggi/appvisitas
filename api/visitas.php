<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../classes/Visita.php';
include_once '../classes/Cliente.php';
include_once '../classes/Auth.php';

$database = new Database();
$db = $database->getConnection();
$visita = new Visita($db);
$cliente = new Cliente($db);
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
            $visita->id = $_GET['id'];
            if($visita->buscarPorId()) {
                $visita_arr = array(
                    "id" => $visita->id,
                    "id_vendedor" => $visita->id_vendedor,
                    "id_cliente" => $visita->id_cliente,
                    "data_hora" => $visita->data_hora,
                    "situacao" => $visita->situacao,
                    "observacoes" => $visita->observacoes,
                    "retorno_data_hora" => $visita->retorno_data_hora
                );
                http_response_code(200);
                echo json_encode($visita_arr);
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Visita não encontrada."));
            }
        } else {
            $id_vendedor = null;
            
            // Se for vendedor, só pode ver suas próprias visitas
            if($_SESSION['usuario_perfil'] == 'vendedor') {
                $id_vendedor = $_SESSION['usuario_id'];
            } else if(isset($_GET['vendedor'])) {
                $id_vendedor = $_GET['vendedor'];
            }
            
            if(isset($_GET['data_inicio']) && isset($_GET['data_fim'])) {
                $stmt = $visita->listarPorPeriodo($_GET['data_inicio'], $_GET['data_fim'], $id_vendedor);
            } else if(isset($_GET['retornos'])) {
                $data = isset($_GET['data']) ? $_GET['data'] : null;
                $stmt = $visita->listarRetornos($id_vendedor, $data);
            } else {
                $stmt = $visita->listar($id_vendedor);
            }
            
            $visitas_arr = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $visitas_arr[] = array(
                    "id" => $row['id'],
                    "id_vendedor" => $row['id_vendedor'],
                    "id_cliente" => $row['id_cliente'],
                    "cliente_nome" => $row['cliente_nome'],
                    "vendedor_nome" => isset($row['vendedor_nome']) ? $row['vendedor_nome'] : '',
                    "data_hora" => $row['data_hora'],
                    "situacao" => $row['situacao'],
                    "observacoes" => $row['observacoes'],
                    "retorno_data_hora" => $row['retorno_data_hora']
                );
            }
            
            http_response_code(200);
            echo json_encode($visitas_arr);
        }
        break;
        
    case 'POST':
        if(!empty($data->cliente_nome) && !empty($data->data_hora) && !empty($data->situacao)) {
            // Buscar ou criar cliente
            $id_cliente = $cliente->buscarOuCriar($data->cliente_nome);
            
            if($id_cliente) {
                $visita->id_vendedor = isset($data->id_vendedor) ? $data->id_vendedor : $_SESSION['usuario_id'];
                $visita->id_cliente = $id_cliente;
                $visita->data_hora = $data->data_hora;
                $visita->situacao = $data->situacao;
                $visita->observacoes = isset($data->observacoes) ? $data->observacoes : '';
                $visita->retorno_data_hora = isset($data->retorno_data_hora) ? $data->retorno_data_hora : null;
                
                if($visita->criar()) {
                    http_response_code(201);
                    echo json_encode(array(
                        "message" => "Visita criada com sucesso.",
                        "id" => $visita->id
                    ));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "Não foi possível criar a visita."));
                }
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Erro ao processar cliente."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Dados incompletos."));
        }
        break;
        
    case 'PUT':
        if(!empty($data->id) && !empty($data->cliente_nome) && !empty($data->data_hora) && !empty($data->situacao)) {
            // Buscar ou criar cliente
            $id_cliente = $cliente->buscarOuCriar($data->cliente_nome);
            
            if($id_cliente) {
                $visita->id = $data->id;
                $visita->id_cliente = $id_cliente;
                $visita->data_hora = $data->data_hora;
                $visita->situacao = $data->situacao;
                $visita->observacoes = isset($data->observacoes) ? $data->observacoes : '';
                $visita->retorno_data_hora = isset($data->retorno_data_hora) ? $data->retorno_data_hora : null;
                
                if($visita->atualizar()) {
                    http_response_code(200);
                    echo json_encode(array("message" => "Visita atualizada com sucesso."));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "Não foi possível atualizar a visita."));
                }
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Erro ao processar cliente."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Dados incompletos."));
        }
        break;
        
    case 'DELETE':
        if(!empty($data->id)) {
            $visita->id = $data->id;
            
            if($visita->excluir()) {
                http_response_code(200);
                echo json_encode(array("message" => "Visita excluída com sucesso."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Não foi possível excluir a visita."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "ID da visita é obrigatório."));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Método não permitido."));
        break;
}
?>

